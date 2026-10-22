// Pedidos de conta de novos orientadores (só o administrador vê esta página).
// Aprovar activa a conta; recusar apaga o pedido (a conta nunca esteve activa).

import { Building2, Check, Inbox, LoaderCircle, Mail, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { decidirPedidoConta, listarPedidosConta } from "../../api/orientador";
import { sessaoOrientador } from "../../sessao/sessaoOrientador";

const data = (iso) =>
  new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Pedido({ pedido, aDecidir, aoDecidir }) {
  const [confirmarRecusa, setConfirmarRecusa] = useState(false);
  const ocupado = aDecidir === pedido.id;
  return (
    <li className="rounded-[14px] border-[1.5px] border-borda bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-[18px] font-bold">{pedido.nome}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-texto-suave">
            <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" aria-hidden="true" /> {pedido.email}</span>
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" aria-hidden="true" /> {pedido.escola}</span>
          </p>
          <p className="mt-1 text-[13px] text-texto-suave">Pedido feito em {data(pedido.criado_em)}</p>
        </div>
        {confirmarRecusa ? (
          <div className="flex flex-col gap-2 md:items-end">
            <p className="text-[14px] font-medium">Recusar e apagar este pedido?</p>
            <div className="flex gap-2">
              <button
                type="button" onClick={() => setConfirmarRecusa(false)} disabled={ocupado}
                className="h-11 rounded-[10px] border-[1.5px] border-borda px-4 text-[14px] font-semibold hover:bg-fundo"
              >
                Cancelar
              </button>
              <button
                type="button" onClick={() => aoDecidir(pedido, "recusar")} disabled={ocupado}
                className="flex h-11 items-center gap-2 rounded-[10px] bg-red-600 px-4 text-[14px] font-semibold text-white hover:bg-red-700"
              >
                {ocupado && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />} Sim, recusar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button" onClick={() => setConfirmarRecusa(true)} disabled={ocupado}
              className="flex h-11 items-center gap-2 rounded-[10px] border-[1.5px] border-borda px-4 text-[14px] font-semibold text-texto hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-4 w-4" aria-hidden="true" /> Recusar
            </button>
            <button
              type="button" onClick={() => aoDecidir(pedido, "aprovar")} disabled={ocupado}
              className="flex h-11 items-center gap-2 rounded-[10px] bg-primaria px-5 text-[14px] font-semibold text-white hover:bg-primaria-escura disabled:opacity-70"
            >
              {ocupado ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
              Aprovar
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function PedidosConta() {
  const sessao = sessaoOrientador();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [aDecidir, setADecidir] = useState(null);
  const [aviso, setAviso] = useState(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setDados(await listarPedidosConta());
    } catch (e) {
      setErro(e.message);
    }
  }, []);

  useEffect(() => {
    if (sessao?.administrador) carregar();
  }, [carregar, sessao?.administrador]);

  if (!sessao?.administrador) return <Navigate to="/orientador" replace />;

  async function decidir(pedido, decisao) {
    setADecidir(pedido.id);
    setAviso(null);
    try {
      await decidirPedidoConta(pedido.id, decisao);
      setAviso(decisao === "aprovar" ? `Conta de ${pedido.nome} aprovada. Já pode entrar.` : `Pedido de ${pedido.nome} recusado.`);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setADecidir(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6 md:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-primaria">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Administrador
          </p>
          <h1 className="text-[28px] font-bold leading-tight">Pedidos de conta</h1>
          <p className="mt-1 text-[15px] text-texto-suave">
            Aprove só quem é realmente orientador. Depois de aprovada, a conta vê os dados de todos os alunos.
          </p>
        </div>
        <button
          type="button" onClick={carregar}
          className="flex h-11 items-center gap-2 rounded-[10px] border-[1.5px] border-borda bg-white px-4 text-[14px] font-semibold hover:bg-fundo"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Actualizar
        </button>
      </div>

      {aviso && <p role="status" className="mb-4 rounded-[10px] bg-emerald-50 px-4 py-3 text-[14px] font-medium text-emerald-800">{aviso}</p>}
      {erro && <p role="alert" className="mb-4 rounded-[10px] bg-red-50 px-4 py-3 text-[14px] text-red-700">{erro}</p>}

      {!dados ? (
        <div className="h-[160px] animate-pulse rounded-[14px] bg-borda/60" aria-label="A carregar" />
      ) : dados.pendentes.length === 0 ? (
        <div className="flex flex-col items-center rounded-[14px] border-[1.5px] border-dashed border-borda bg-white px-6 py-12 text-center">
          <Inbox className="mb-3 h-10 w-10 text-texto-suave" aria-hidden="true" />
          <p className="text-[17px] font-bold">Não há pedidos pendentes</p>
          <p className="mt-1 text-[14px] text-texto-suave">Quando alguém criar conta em "Criar conta", o pedido aparece aqui.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {dados.pendentes.map((p) => <Pedido key={p.id} pedido={p} aDecidir={aDecidir} aoDecidir={decidir} />)}
        </ul>
      )}

      {dados?.aprovados?.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[18px] font-bold">Aprovados recentemente</h2>
          <ul className="divide-y divide-borda rounded-[14px] border-[1.5px] border-borda bg-white">
            {dados.aprovados.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[14px]">
                <span><strong className="font-semibold">{p.nome}</strong> <span className="text-texto-suave">· {p.email}</span></span>
                <span className="text-texto-suave">aprovado em {data(p.aprovado_em)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
