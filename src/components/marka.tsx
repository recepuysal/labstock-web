export function Marka({ boyut = 27 }: { boyut?: number }) {
  const bosluk = Math.round(boyut * 0.29);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: bosluk }}>
      <img
        src="/logo-mark.svg"
        alt=""
        width={boyut}
        height={boyut}
        style={{ flexShrink: 0, display: 'block' }}
      />
      <span style={{ fontSize: boyut * 0.61, fontWeight: 600, letterSpacing: '-0.5px' }}>
        LabStock
      </span>
    </span>
  );
}
