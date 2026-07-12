import { useState, useCallback, useRef, useEffect } from "react";
import { callAI, parseStructuredResponse, INTERVIEWER_SYSTEM_PROMPT } from "../utils/aiClient";
import { buildResumeContext } from "../utils/resumeParser";
import { buildGitHubContext } from "../utils/githubapi";
import { buildRepoContext } from "../utils/repoAnalysis";
import { routeContext, looksLikeJobDescription } from "../utils/contextRouter";
import { loadState, saveState, clearState } from "../utils/persistence";

// Assemble the LLM prompt from ONLY the sources the router selected.
function buildRoutedPrompt(userText, route, ctx) {
  const { resumeText, candidate, githubData, repoIndex, jobDescription, history } = ctx;
  const c = route.contexts;
  const parts = [
    "You are ResumeIQ. Answer the recruiter using the SELECTED SOURCES below and the system rules. Combine them and reason like a senior engineering manager. If a source is not listed here, it was intentionally excluded for this question — do not ask for it.",
  ];

  if (history?.length) {
    const recent = history.map(h => `Recruiter: ${h.question}\nResumeIQ: ${h.answer}`).join("\n\n");
    parts.push(`=== RECENT CONVERSATION (for follow-ups like "compare that", "what about the other one" — use it to resolve references, don't restate it) ===\n${recent}`);
  }

  if (c.includes("resume")) {
    const r = candidate ? buildResumeContext(candidate) : resumeText ? `Raw Resume\n${resumeText.slice(0, 4000)}` : null;
    if (r) parts.push(`=== RESUME + ATS ENGINE OUTPUT ===\n${r}`);
  } else if (c.includes("ats") && candidate?.ats) {
    parts.push(`=== ATS ENGINE OUTPUT (authoritative) ===\n${JSON.stringify({ score: candidate.ats.total, label: candidate.ats.label, breakdown: candidate.ats.breakdown }, null, 2)}`);
  }

  if (c.includes("github") && githubData) parts.push(`=== GITHUB PROFILE ===\n${buildGitHubContext(githubData)}`);

  if (c.includes("repositories") && githubData?.repositories?.length) {
    const list = githubData.repositories.slice(0, 40).map(r => `- ${r.name}${r.language ? ` [${r.language}]` : ""}${r.description ? `: ${r.description}` : ""}`).join("\n");
    parts.push(`=== ALL REPOSITORIES (${githubData.repositories.length}) ===\n${list}`);
  }

  if (c.includes("repository")) {
    if (repoIndex && (!route.namedRepos?.length || route.namedRepos.includes(repoIndex.repo))) {
      parts.push(`=== SELECTED REPOSITORY (${repoIndex.owner}/${repoIndex.repo}) ===\n${buildRepoContext(repoIndex, userText, route.file ? "file" : "repo", route.file)}`);
    } else if (route.namedRepos?.length && githubData?.repositories?.length) {
      const meta = githubData.repositories.filter(r => route.namedRepos.includes(r.name));
      if (meta.length) parts.push(`=== REPOSITORY METADATA ===\n${meta.map(r => `- ${r.name}: ${r.description || "no description"} [${r.language || "?"}]`).join("\n")}\n(Only metadata is available for these; deeper code analysis requires indexing the repository.)`);
      if (repoIndex) parts.push(`(A different repository, ${repoIndex.repo}, is currently indexed with code if needed.)`);
    } else if (repoIndex) {
      parts.push(`=== SELECTED REPOSITORY (${repoIndex.owner}/${repoIndex.repo}) ===\n${buildRepoContext(repoIndex, userText, route.file ? "file" : "repo", route.file)}`);
    }
  }

  if (c.includes("jd") && jobDescription) parts.push(`=== JOB DESCRIPTION (compare the candidate against this; fill jdMatch) ===\n${jobDescription.slice(0, 4000)}`);

  if (route.file) parts.push(`Selected file: ${route.file}. Scope file-level answers to this file.`);

  parts.push(`Sources selected for this question: ${route.sources.join(", ") || "general knowledge only (nothing connected yet)"}.`);
  parts.push(`=== QUESTION ===\n${userText}`);
  return parts.join("\n\n");
}

export function useChat() {
  const [messages, setMessages] = useState(() => loadState("chat:messages", []));
  const [isLoading, setIsLoading] = useState(false);
  const [lastMeta, setLastMeta] = useState(null);
  const [activeProvider, setActiveProvider] = useState(null);
  const lastJdRef = useRef(null);
  const messagesRef = useRef([]);
  messagesRef.current = messages;

  // Cap what's persisted so a long session doesn't balloon localStorage.
  useEffect(() => {
    saveState("chat:messages", messages.slice(-60));
  }, [messages]);

  const send = useCallback(
    async (userText, resumeText = "", candidate = null, githubData = null, options = {}) => {
      if (!userText.trim() || isLoading) return;
      setIsLoading(true);

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: userText }]);

      const repoIndex = options.repoIndex || null;
      const selectedFilePath = options.filePath || null;

      // Last 3 exchanges, so follow-ups like "compare that to the other one"
      // resolve without the recruiter having to restate context.
      const pairs = [];
      let pendingQuestion = null;
      for (const m of messagesRef.current) {
        if (m.role === "user") pendingQuestion = m.text;
        else if (m.role === "ai" && m.parsed?.answer && pendingQuestion) {
          pairs.push({ question: pendingQuestion, answer: m.parsed.answer.slice(0, 600) });
          pendingQuestion = null;
        }
      }
      const history = pairs.slice(-3);

      // Remember a pasted job description so later "is he a fit?" questions can reuse it.
      if (looksLikeJobDescription(userText)) lastJdRef.current = userText;
      const jobDescription = looksLikeJobDescription(userText) ? userText : lastJdRef.current;

      const route = routeContext(userText, {
        candidate, githubData, repoIndex, selectedFilePath, jobDescription,
      });

      const appendAi = (parsed, extra = {}) =>
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "ai", parsed, provider: parsed.provider, scope: route.scope, sources: route.sources, ...extra }]);

      // File intent but no file selected → ask instead of hallucinating.
      if (route.needFile) {
        appendAi({
          answer: "Which file would you like me to analyze? Open a file from the repository browser on the right, then ask again — I'll scope the answer to that file.",
          confidence: 0, source: "file", citations: [], suggested_followups: [], missing_data: [], reasoning: "", interview: null, recommendation: null, jdMatch: null,
        });
        setIsLoading(false);
        return;
      }

      try {
        const prompt = buildRoutedPrompt(userText, route, { resumeText, candidate, githubData, repoIndex, jobDescription, history });
        const systemPrompt = route.interviewer ? INTERVIEWER_SYSTEM_PROMPT : undefined;
        const result = await callAI([{ role: "user", parts: [{ text: prompt }] }], systemPrompt);
        const parsed = parseStructuredResponse(result.text);
        setActiveProvider(result.provider);
        appendAi({ ...parsed, provider: result.provider });
        setLastMeta({ confidence: parsed.confidence, source: parsed.source });
      } catch (err) {
        appendAi({
          answer: `Unable to reach the AI provider.\n\n${err.message}`,
          confidence: 0, source: "error", citations: [], suggested_followups: [], missing_data: [], reasoning: "", interview: null, recommendation: null, jdMatch: null,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const clear = useCallback(() => {
    lastJdRef.current = null;
    setMessages([]);
    setLastMeta(null);
    setActiveProvider(null);
    clearState("chat:messages");
  }, []);

  return { messages, isLoading, lastMeta, activeProvider, send, clear };
}
