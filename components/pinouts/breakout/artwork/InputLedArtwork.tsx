export function InputLedArtwork({ id }: { id: string }) {
  if (id === 'ws2812') return (
    <g>
      <rect x="5" y="57" width="270" height="66" rx="6" fill="#f1f5f9" stroke="#94a3b8" />
      {[50, 140, 230].map((x) => <g key={x}>
        <rect x={x - 16} y="73" width="32" height="32" rx="3" fill="#cbd5e1" stroke="#64748b" />
        <circle cx={x} cy="89" r="9" fill="#c084fc" />
      </g>)}
      <path d="M75 90h35m-8 -5 8 5-8 5 M165 90h35m-8 -5 8 5-8 5" fill="none" stroke="#334155" strokeWidth="2" />
    </g>
  );
  const joystick = id === 'hw-504';
  const rgb = id === 'ky-009';
  return (
    <g>
      <rect x="54" y="18" width="172" height="145" rx="8" fill={joystick ? '#1e3a8a' : '#14532d'} stroke="#94a3b8" strokeOpacity=".5" />
      {rgb ? (
        <g><rect x="108" y="48" width="64" height="64" rx="6" fill="#e2e8f0" />
          {['#f87171', '#4ade80', '#60a5fa'].map((color, i) => <circle key={color} cx={125 + i * 15} cy="80" r="8" fill={color} />)}</g>
      ) : (
        <g><circle cx="140" cy="82" r={joystick ? 52 : 39} fill="#334155" stroke="#94a3b8" strokeWidth="4" />
          <circle cx="140" cy="82" r={joystick ? 42 : 15} fill={joystick ? '#0f172a' : '#cbd5e1'} stroke="#64748b" strokeWidth="2" />
          {!joystick ? <path d="M135 65v34 M145 65v34" stroke="#64748b" strokeWidth="2" /> : null}</g>
      )}
    </g>
  );
}
