import React, { useState } from 'react'

export default function Avatar({ src, alt, initials, className }) {
  const [errored, setErrored] = useState(false)

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt || 'Candidate avatar'}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
      />
    )
  }

  return <div className={className}>{initials}</div>
}
