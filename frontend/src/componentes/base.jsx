// Peças simples partilhadas pelos ecrãs provisórios. Quando chegarem os
// ecrãs do Stitch, estas peças são substituídas pelas do design final.

export function EcraProvisorio({ titulo, children, largo = false }) {
  return (
    <main className={`mx-auto px-4 py-8 ${largo ? "max-w-5xl" : "max-w-xl"}`}>
      <p className="mb-6 rounded border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Ecrã provisório: a lógica já funciona; o aspecto final vem do design.
      </p>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{titulo}</h1>
      {children}
    </main>
  );
}

export function Botao({ children, variante = "principal", className = "", ...props }) {
  const estilos = {
    principal: "bg-slate-900 text-white hover:bg-slate-700",
    secundario: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  };
  return (
    <button
      className={`rounded px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${estilos[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Campo({ rotulo, erro, id, ...props }) {
  return (
    // A mensagem de erro fica fora do <label> para não entrar no nome do
    // campo lido pelo leitor de ecrã; liga-se ao campo por aria-describedby.
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{rotulo}</label>
      <input
        id={id}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`w-full rounded border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400 ${erro ? "border-red-500" : "border-slate-300"}`}
        {...props}
      />
      {erro && <span id={`${id}-erro`} className="mt-1 block text-xs text-red-600">{erro}</span>}
    </div>
  );
}

export function MensagemErro({ erro }) {
  if (!erro) return null;
  return (
    <p role="alert" className="my-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
      {erro.message ?? String(erro)}
    </p>
  );
}

export function ACarregar({ texto = "A carregar…" }) {
  return <p className="text-sm text-slate-500" aria-live="polite">{texto}</p>;
}
