export function PowerArtwork({ id }: { id: string }) {
  if (id === 'holder-2s') return (
    <g>
      <rect x="22" y="16" width="236" height="150" rx="10" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
      {[44, 102].map((y, i) => <g key={y}>
        <rect x="48" y={y} width="184" height="48" rx="12" fill="#166534" stroke="#4ade80" />
        <text x={i ? 214 : 58} y={y + 30} fill="#dcfce7" fontSize="18">+</text>
        <text x={i ? 58 : 214} y={y + 30} fill="#dcfce7" fontSize="18">−</text>
        <text x="140" y={y + 30} fill="#dcfce7" fontSize="12" textAnchor="middle">18650</text>
      </g>)}
      <path d="M236 68h12v58h-12" fill="none" stroke="#d4b777" strokeWidth="3" />
    </g>
  );
  const buck = id === 'lm2596';
  return (
    <g>
      <rect x="22" y="22" width="236" height="136" rx="8" fill="#1e3a8a" stroke="#60a5fa" strokeOpacity=".6" />
      {buck ? (
        <g><rect x="110" y="53" width="55" height="55" rx="12" fill="#334155" stroke="#94a3b8" />
          <path d="M118 80c0-24 40-24 40 0s-40 24-40 0m7 0c0-15 26-15 26 0s-26 15-26 0" fill="none" stroke="#d4b777" strokeWidth="4" />
          <rect x="179" y="47" width="38" height="29" rx="3" fill="#2563eb" stroke="#93c5fd" />
          <circle cx="198" cy="61" r="7" fill="#d4b777" /><path d="M192 61h12" stroke="#334155" strokeWidth="2" />
          {[60, 216].map((x) => <circle key={x} cx={x} cy="120" r="16" fill="#94a3b8" stroke="#334155" strokeWidth="4" />)}</g>
      ) : (
        <g><rect x="107" y="58" width="64" height="55" rx="3" fill="#0f172a" stroke="#94a3b8" />
          <rect x="119" y="134" width="42" height="24" rx="7" fill="#94a3b8" stroke="#475569" />
          <rect x="125" y="145" width="30" height="8" rx="4" fill="#0f172a" /></g>
      )}
    </g>
  );
}
