// O Kiala com um telemóvel na mão, a escolher a nota na lista de 10 a 20.
// É o desenho do avatar com a mão e o telemóvel desenhados por cima em SVG.
// O toque duplo no "15" repete-se devagar; com movimento reduzido fica parado.

import kiala from "../assets/personagens/k0.webp";

const NOTAS = Array.from({ length: 11 }, (_, i) => 10 + i);
const ESCOLHIDA = 15;

export default function IlustracaoSemDigitar({ className = "" }) {
  return (
    <div className={`relative mx-auto aspect-[420/570] w-full max-w-[210px] overflow-hidden ${className}`} aria-hidden="true">
      <img src={kiala} alt="" width={420} height={570} className="absolute inset-0 h-full w-full" />
      <svg viewBox="0 0 420 570" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="isd-pele" x1="0" x2="1">
            <stop offset="0" stopColor="#B86A40" />
            <stop offset="1" stopColor="#9C552F" />
          </linearGradient>
        </defs>
        {/* manga da bata */}
        <path d="M292 570 C 292 548, 300 532, 316 524 L 372 520 C 384 536, 390 552, 390 570 Z" fill="#F4F5FC" stroke="#D9DCE8" strokeWidth="2" />
        <g transform="translate(0 6) rotate(-10 300 430)">
          {/* palma por trás do telemóvel */}
          <path d="M262 470 C 262 520, 300 560, 345 556 C 380 552, 384 510, 372 470 Z" fill="url(#isd-pele)" />
          {/* telemóvel */}
          <rect x="246" y="330" width="112" height="196" rx="18" fill="#252B42" />
          <rect x="253" y="342" width="98" height="172" rx="12" fill="#fff" />
          <rect x="285" y="335" width="34" height="5" rx="2.5" fill="#3A4160" />
          <text x="262" y="364" fontSize="9.5" fontWeight="700" fill="#252B42">Nota de Física</text>
          <g fontSize="11" fontWeight="700" textAnchor="middle">
            {NOTAS.map((n, i) => {
              const x = 262 + (i % 3) * 28;
              const y = 374 + Math.floor(i / 3) * 30;
              const sel = n === ESCOLHIDA;
              return (
                <g key={n}>
                  <rect
                    x={x} y={y} width="24" height="24" rx="5"
                    className={sel ? "isd-escolhida" : undefined}
                    fill={sel ? "#1F6FC0" : "#fff"}
                    stroke={sel ? "#1F6FC0" : "#E6E9EF"}
                    strokeWidth="1.3"
                  />
                  <text x={x + 12} y={y + 16} fill={sel ? "#fff" : "#252B42"} className={sel ? "isd-escolhida-txt" : undefined}>{n}</text>
                </g>
              );
            })}
          </g>
          {/* toque duplo no 15 */}
          <circle cx="330" cy="416" r="10" className="isd-toque" fill="none" stroke="#1F6FC0" strokeWidth="2" />
          <circle cx="330" cy="416" r="10" className="isd-toque isd-toque-2" fill="none" stroke="#1F6FC0" strokeWidth="2" />
          {/* dedos (lado esquerdo) e polegar (lado direito) */}
          <g fill="#B86A40" stroke="#8E4A2A" strokeWidth="1.2">
            <rect x="238" y="452" width="22" height="15" rx="7.5" />
            <rect x="237" y="469" width="23" height="15" rx="7.5" />
            <rect x="239" y="486" width="21" height="14" rx="7" />
            <path d="M372 498 C 364 484, 352 474, 342 472 C 334 471, 332 480, 339 485 C 348 491, 354 500, 358 510 Z" />
          </g>
        </g>
      </svg>
    </div>
  );
}
