export function Marka({ boyut = 27 }: { boyut?: number }) {
  const bosluk = Math.round(boyut * 0.29);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: bosluk }}>
      <span style={{ position: 'relative', width: boyut, height: boyut, flexShrink: 0, display: 'block' }}>
        <img
          src="/logo-mark.svg"
          alt=""
          width={boyut}
          height={boyut}
          className="logo-acik-tema"
          style={{ position: 'absolute', inset: 0 }}
        />
        <img
          src="/logo-mark-koyu.svg"
          alt=""
          width={boyut}
          height={boyut}
          className="logo-koyu-tema"
          style={{ position: 'absolute', inset: 0 }}
        />
      </span>
      <span style={{ fontSize: boyut * 0.61, fontWeight: 600, letterSpacing: '-0.5px' }}>
        LabStock
      </span>
    </span>
  );
}
