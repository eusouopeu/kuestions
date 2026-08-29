import { useRef, useState } from "react";
import { ArrowUturnLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { C, disp, mono } from "../../../theme";
import type { PaginaCaderno } from "../../../lib/caderno/tipos";
import { renomearPagina } from "../../../lib/repo";
import BlocoCadernoItem from "./BlocoCadernoItem";
import { useCadernoEstado } from "./useCadernoEstado";

/**
 * Editor de UMA página do Caderno: título + lista de blocos. O estado dos
 * blocos vem de useCadernoEstado (CRUD, undo, autosave); este componente só
 * cuida do fluxo de foco entre blocos (Enter avança, Backspace-no-início
 * funde e volta) e do cabeçalho da página.
 */
export default function EditorCaderno({
  pagina,
  onAbrirLink,
}: {
  pagina: PaginaCaderno;
  /** Abre (ou cria) outra página pelo título — vem de um `[[Título]]`. */
  onAbrirLink: (titulo: string) => void;
}) {
  const {
    blocos,
    podeDesfazer,
    desfazer,
    atualizarTexto,
    alternarMarcado,
    alternarAberto,
    mudarTipo,
    inserirApos,
    apagarBloco,
    duplicarBloco,
    moverBloco,
    fundirComAnterior,
    editarCelula,
    adicionarLinhaTabela,
    adicionarColunaTabela,
  } = useCadernoEstado(pagina.id, pagina.blocos);

  const [titulo, setTitulo] = useState(pagina.titulo);
  const [focadoId, setFocadoId] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLTextAreaElement>());
  const proximoFoco = useRef<string | null>(null);

  function focarDepoisDoRender(id: string) {
    proximoFoco.current = id;
    // O bloco alvo pode ainda não existir no DOM neste exato tick (acabou
    // de ser criado); um microtask garante que o BlocoCadernoItem já montou
    // e registrou seu ref antes de tentarmos focar.
    queueMicrotask(() => {
      if (proximoFoco.current === id) {
        setFocadoId(id);
        proximoFoco.current = null;
      }
    });
  }

  function aoSalvarTitulo() {
    const t = titulo.trim() || "Sem título";
    if (t !== pagina.titulo) void renomearPagina(pagina.id, t);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <button
          onClick={desfazer}
          disabled={!podeDesfazer}
          title="Desfazer"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: `1.5px solid ${C.line}`,
            background: C.card,
            color: C.ink,
            cursor: podeDesfazer ? "pointer" : "default",
            opacity: podeDesfazer ? 1 : 0.4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ArrowUturnLeftIcon width={15} height={15} />
        </button>
      </div>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onBlur={aoSalvarTitulo}
        placeholder="Sem título"
        style={{
          ...disp,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: -0.5,
          width: "100%",
          border: "none",
          outline: "none",
          background: "transparent",
          color: C.ink,
          marginBottom: 14,
          padding: 0,
        }}
      />

      {blocos.map((bloco) => (
        <BlocoCadernoItem
          key={bloco.id}
          bloco={bloco}
          focado={focadoId === bloco.id}
          onFocar={() => setFocadoId(bloco.id)}
          onDesfocar={() => setFocadoId((atual) => (atual === bloco.id ? null : atual))}
          onTexto={(texto) => atualizarTexto(bloco.id, texto)}
          onEnter={() => {
            const novoId = inserirApos(bloco.id);
            focarDepoisDoRender(novoId);
          }}
          onBackspaceNoInicio={() => {
            const idAnterior = fundirComAnterior(bloco.id);
            if (idAnterior) focarDepoisDoRender(idAnterior);
          }}
          onAlternarMarcado={() => alternarMarcado(bloco.id)}
          onAlternarAberto={() => alternarAberto(bloco.id)}
          onMudarTipo={(tipo) => mudarTipo(bloco.id, tipo)}
          onDuplicar={() => duplicarBloco(bloco.id)}
          onApagar={() => apagarBloco(bloco.id)}
          onMoverCima={() => moverBloco(bloco.id, -1)}
          onMoverBaixo={() => moverBloco(bloco.id, 1)}
          onAbrirLink={onAbrirLink}
          onEditarCelula={(l, c, v) => editarCelula(bloco.id, l, c, v)}
          onAdicionarLinhaTabela={() => adicionarLinhaTabela(bloco.id)}
          onAdicionarColunaTabela={() => adicionarColunaTabela(bloco.id)}
          registrarRef={(el) => {
            if (el) refs.current.set(bloco.id, el);
            else refs.current.delete(bloco.id);
          }}
        />
      ))}

      <button
        onClick={() => {
          const novoId = inserirApos(blocos[blocos.length - 1]?.id ?? null);
          focarDepoisDoRender(novoId);
        }}
        style={{
          ...mono,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12.5,
          color: C.sub,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "10px 0",
          marginTop: 4,
        }}
      >
        <PlusIcon width={14} height={14} />
        Novo bloco
      </button>
    </div>
  );
}
