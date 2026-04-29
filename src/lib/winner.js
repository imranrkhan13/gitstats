// Single source of truth for winner calculation — used by BOTH CompareView and ShareCard
// Identical metrics, identical logic. No divergence possible.

export function calcWinner(data1, data2) {
  const u1 = data1.user
  const u2 = data2.user

  const metrics = [
    { key:'score',     label:'Dev Score',      v1:data1.score,             v2:data2.score,              higherBetter:true  },
    { key:'stars',     label:'Total Stars',    v1:data1.totalStars,        v2:data2.totalStars,         higherBetter:true  },
    { key:'repos',     label:'Repos',          v1:data1.nonForkCount,      v2:data2.nonForkCount,       higherBetter:true  },
    { key:'followers', label:'Followers',      v1:u1.followers,            v2:u2.followers,             higherBetter:true  },
    { key:'streak',    label:'Streak',         v1:data1.streak,            v2:data2.streak,             higherBetter:true  },
    { key:'forks',     label:'Forks',          v1:data1.totalForks,        v2:data2.totalForks,         higherBetter:true  },
    { key:'langs',     label:'Languages',      v1:data1.languages.length,  v2:data2.languages.length,   higherBetter:true  },
    { key:'avgStars',  label:'Avg Stars/Repo', v1:data1.avgStars,          v2:data2.avgStars,           higherBetter:true  },
  ]

  // Only count strict wins — ties count for NEITHER
  const wins1 = metrics.filter(m => m.higherBetter ? m.v1 > m.v2 : m.v1 < m.v2).length
  const wins2 = metrics.filter(m => m.higherBetter ? m.v2 > m.v1 : m.v2 < m.v1).length
  const winner = wins1 > wins2 ? 'user1' : wins2 > wins1 ? 'user2' : 'tie'

  return { metrics, wins1, wins2, winner, total: metrics.length }
}
