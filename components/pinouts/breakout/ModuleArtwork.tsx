import { DisplayArtwork } from './artwork/DisplayArtwork';
import { InputLedArtwork } from './artwork/InputLedArtwork';
import { PowerArtwork } from './artwork/PowerArtwork';

/** Recognizable device silhouettes; pad locations vary between breakout vendors. */
export function ModuleArtwork({ id }: { id: string }) {
  if (['ili9488', 'lcd1602-i2c'].includes(id)) return <DisplayArtwork id={id} />;
  if (['ky-040', 'hw-504', 'ws2812', 'ky-009'].includes(id)) return <InputLedArtwork id={id} />;
  if (['lm2596', 'charger-2s', 'holder-2s'].includes(id)) return <PowerArtwork id={id} />;
  return (
    <g>
      <rect x="30" y="20" width="220" height="130" rx="10" fill="#14532d" stroke="#4ade80" strokeOpacity=".4" />
      <rect x="106" y="60" width="60" height="48" rx="3" fill="#1e293b" stroke="#94a3b8" />
      {[64, 74, 84, 94, 104].map((y) => <path key={y} d={`M98 ${y}h8 M166 ${y}h8`} stroke="#cbd5e1" strokeWidth="3" />)}
      <text x="136" y="88" fill="#e2e8f0" fontSize="9" textAnchor="middle">{id === 'max98357a' ? 'MAX98357A' : 'PCM5102A'}</text>
      {id === 'max98357a' ? (
        <g><rect x="196" y="50" width="40" height="65" rx="4" fill="#2563eb" />
          {[68, 98].map((y) => <circle key={y} cx="216" cy={y} r="9" fill="#94a3b8" stroke="#334155" />)}</g>
      ) : (
        <g>{[65, 112].map((y) => <circle key={y} cx="215" cy={y} r="14" fill="#94a3b8" stroke="#334155" strokeWidth="5" />)}</g>
      )}
      <rect x="74" y="35" width="16" height="25" rx="2" fill="#cbd5e1" />
      <rect x="75" y="119" width="33" height="10" rx="2" fill="#cbd5e1" />
    </g>
  );
}
