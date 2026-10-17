// Faixa fina com o padrão geométrico dos tecidos samakaka (detalhe angolano).

export default function FaixaSamakaka({ className = "" }) {
  return (
    <div className={`h-4 w-full overflow-hidden bg-[#141414] ${className}`} aria-hidden="true">
      <svg className="block h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="padrao-samakaka" width="48" height="16" patternUnits="userSpaceOnUse">
            <rect width="48" height="16" fill="#141414" />
            <polygon points="0,0 24,0 12,16" fill="var(--color-samakaka-amarelo)" />
            <polygon points="24,0 48,0 36,16" fill="var(--color-samakaka-vermelho)" />
            <polygon points="12,16 24,0 36,16" fill="#ffffff" />
            <polygon points="0,16 12,16 6,8" fill="var(--color-samakaka-vermelho)" />
            <polygon points="36,16 48,16 42,8" fill="var(--color-samakaka-amarelo)" />
          </pattern>
        </defs>
        <rect width="100%" height="16" fill="url(#padrao-samakaka)" />
      </svg>
    </div>
  );
}
