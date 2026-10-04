export function DisplayArtwork({ id }: { id: string }) {
  const lcd = id === 'lcd1602-i2c';
  return (
    <g>
      <rect x="15" y="20" width="250" height="145" rx="6" fill="#14532d" stroke="#4ade80" strokeOpacity=".4" />
      {[[25, 30], [255, 30], [25, 155], [255, 155]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#0f172a" stroke="#d4b777" />)}
      <rect x="38" y="38" width="204" height="110" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
      <rect x="48" y="48" width="184" height="90" rx="2" fill={lcd ? '#65a30d' : '#0c4a6e'} />
      {lcd ? (
        <g fill="#365314" fontFamily="monospace" fontSize="15">
          <text x="62" y="82">HIOS 16 x 2</text><text x="62" y="110">I2C · PCF8574</text>
        </g>
      ) : (
        <g><path d="M62 112 L91 80 L117 96 L151 66 L178 92 L211 71" fill="none" stroke="#38bdf8" strokeWidth="3" />
          <text x="62" y="126" fill="#bae6fd" fontFamily="monospace" fontSize="10">480 × 320 · SPI</text></g>
      )}
    </g>
  );
}
