import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { C, disp, mono } from "../../../theme";
import type { NoMapa } from "../../../lib/mapas/tipos";
import { useMapaEstado } from "./useMapaEstado";

/** Dimensão padrão de um nó por tamanho — usada tanto para desenhar quanto
 * para calcular onde as arestas encostam na borda. */
const DIMENSOES: Record<NoMapa["tamanho"], { largura: number; altura: number }> = {
  pequeno: { largura: 92, altura: 36 },
  medio: { largura: 140, altura: 46 },
  grande: { largura: 190, altura: 60 },
};

const CORES: { token: string; rotulo: string }[] = [
  { token: "caneta", rotulo: "Roxo" },
  { token: "ok", rotulo: "Verde" },
  { token: "erro", rotulo: "Vermelho" },
  { token: "sub", rotulo: "Cinza" },
];

function corDoToken(token: string): string {
  return (C as Record<string, string>)[token] ?? C.caneta;
}

function dimensoesDe(n: NoMapa) {
  const base = DIMENSOES[n.tamanho];
  return { largura: n.largura ?? base.largura, altura: n.altura ?? base.altura };
}

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;

/**
 * Viewport pan/zoom + nós + arestas do mapa mental — portado de
 * SynapsePro/index.html, mas com arestas em SVG (não canvas): reposicionam
 * junto com o React e escalam sem serrilhar, sem precisar reimplementar o
 * loop de redraw do original.
 */
export default function MapaMental({
  nosIniciais,
  mapaId,
  onEstudar,
}: {
  nosIniciais: NoMapa[];
  mapaId: number;
  onEstudar: (soIds: number[] | null) => void;
}) {
  const {
    nos,
    adicionarFilho,
    moverNo,
    editarTexto,
    editarDica,
    definirCor,
    definirTamanho,
    apagarNo,
    registrarHistorico,
    desfazer,
    refazerAcao,
    podeDesfazer,
    podeRefazer,
  } = useMapaEstado(mapaId, nosIniciais);

  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const arrastandoNo = useRef<{ id: number; offX: number; offY: number } | null>(null);
  const arrastandoPan = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const moveuDurante = useRef(false);

  const porId = useMemo(() => new Map(nos.map((n) => [n.id, n])), [nos]);
  const raiz = nos.find((n) => n.pai === null);

  function paraCoordMundo(clientX: number, clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  }

  function aoRodarRoda(e: React.WheelEvent) {
    e.preventDefault();
    const fator = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const novoZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * fator));
    const rect = containerRef.current!.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const mundoX = (cursorX - pan.x) / zoom;
    const mundoY = (cursorY - pan.y) / zoom;
    setZoom(novoZoom);
    setPan({ x: cursorX - mundoX * novoZoom, y: cursorY - mundoY * novoZoom });
  }

  function aoIniciarArrastarNo(e: React.PointerEvent, no: NoMapa) {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const mundo = paraCoordMundo(e.clientX, e.clientY);
    arrastandoNo.current = { id: no.id, offX: mundo.x - no.x, offY: mundo.y - no.y };
    moveuDurante.current = false;
    registrarHistorico();
    setSelecionado(no.id);
  }

  function aoIniciarPan(e: React.PointerEvent) {
    if (e.target !== e.currentTarget) return;
    setSelecionado(null);
    arrastandoPan.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }

  function aoMoverPonteiro(e: React.PointerEvent) {
    if (arrastandoNo.current) {
      const mundo = paraCoordMundo(e.clientX, e.clientY);
      moveuDurante.current = true;
      moverNo(
        arrastandoNo.current.id,
        mundo.x - arrastandoNo.current.offX,
        mundo.y - arrastandoNo.current.offY,
      );
      return;
    }
    if (arrastandoPan.current) {
      const dx = e.clientX - arrastandoPan.current.x;
      const dy = e.clientY - arrastandoPan.current.y;
      setPan({ x: arrastandoPan.current.panX + dx, y: arrastandoPan.current.panY + dy });
    }
  }

  function aoSoltarPonteiro() {
    arrastandoNo.current = null;
    arrastandoPan.current = null;
  }

  const centralizarNoRaiz = useCallback(() => {
    if (!raiz || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const { largura, altura } = dimensoesDe(raiz);
    setPan({
      x: rect.width / 2 - (raiz.x + largura / 2) * zoom,
      y: rect.height / 3 - (raiz.y + altura / 2) * zoom,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raiz?.id]);

  useEffect(() => {
    centralizarNoRaiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function aoTeclar(e: React.KeyboardEvent) {
    if ((e.key === "Delete" || e.key === "Backspace") && selecionado != null && selecionado !== raiz?.id) {
      const alvo = document.activeElement;
      if (alvo instanceof HTMLTextAreaElement) return; // não interfere ao editar texto
      e.preventDefault();
      apagarNo(selecionado);
      setSelecionado(null);
    }
  }

  const noSelecionado = selecionado != null ? porId.get(selecionado) : null;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button onClick={desfazer} disabled={!podeDesfazer} title="Desfazer" style={botaoFerramenta}>
          <ArrowUturnLeftIcon width={16} height={16} />
        </button>
        <button onClick={refazerAcao} disabled={!podeRefazer} title="Refazer" style={botaoFerramenta}>
          <ArrowUturnRightIcon width={16} height={16} />
        </button>
        <button onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z / 1.2))} title="Diminuir zoom" style={botaoFerramenta}>
          <MagnifyingGlassMinusIcon width={16} height={16} />
        </button>
        <button onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z * 1.2))} title="Aumentar zoom" style={botaoFerramenta}>
          <MagnifyingGlassPlusIcon width={16} height={16} />
        </button>
        <button onClick={centralizarNoRaiz} style={{ ...botaoFerramenta, width: "auto", padding: "0 10px", ...mono, fontSize: 11 }}>
          Centralizar
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => onEstudar(null)}
          style={{
            ...mono,
            fontSize: 12,
            fontWeight: 600,
            padding: "8px 14px",
            borderRadius: 8,
            border: `1.5px solid ${C.caneta}`,
            background: C.caneta,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Estudar mapa
        </button>
      </div>

      {noSelecionado && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 8,
            alignItems: "center",
            flexWrap: "wrap",
            padding: "8px 10px",
            border: `1.5px solid ${C.line}`,
            borderRadius: 8,
            background: C.card,
          }}
        >
          <span style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.6 }}>NÓ SELECIONADO</span>
          <button
            onClick={() => {
              const { largura, altura } = dimensoesDe(noSelecionado);
              const id = adicionarFilho(
                noSelecionado.id,
                noSelecionado.x + largura + 40,
                noSelecionado.y + altura + 20,
              );
              setSelecionado(id);
            }}
            title="Adicionar filho"
            style={botaoFerramenta}
          >
            <PlusIcon width={15} height={15} />
          </button>
          {CORES.map((c) => (
            <button
              key={c.token}
              onClick={() => definirCor(noSelecionado.id, c.token)}
              title={c.rotulo}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: noSelecionado.cor === c.token ? `2px solid ${C.ink}` : `1.5px solid ${C.line}`,
                background: corDoToken(c.token),
                cursor: "pointer",
              }}
            />
          ))}
          {(["pequeno", "medio", "grande"] as const).map((t) => (
            <button
              key={t}
              onClick={() => definirTamanho(noSelecionado.id, t)}
              style={{
                ...mono,
                fontSize: 10.5,
                padding: "5px 8px",
                borderRadius: 6,
                border: `1.5px solid ${noSelecionado.tamanho === t ? C.caneta : C.line}`,
                background: noSelecionado.tamanho === t ? C.canetaSoft : "transparent",
                color: noSelecionado.tamanho === t ? C.caneta : C.sub,
                cursor: "pointer",
              }}
            >
              {t === "pequeno" ? "P" : t === "medio" ? "M" : "G"}
            </button>
          ))}
          <input
            value={noSelecionado.dica ?? ""}
            onChange={(e) => editarDica(noSelecionado.id, e.target.value)}
            placeholder="Dica (modo estudo)"
            style={{
              ...mono,
              fontSize: 11,
              padding: "6px 8px",
              borderRadius: 6,
              border: `1.5px solid ${C.line}`,
              background: C.paper,
              color: C.ink,
              flex: 1,
              minWidth: 120,
            }}
          />
          {noSelecionado.id !== raiz?.id && (
            <button
              onClick={() => {
                apagarNo(noSelecionado.id);
                setSelecionado(null);
              }}
              title="Apagar nó (e sub-ramo)"
              style={{ ...botaoFerramenta, color: C.erro, borderColor: C.erro }}
            >
              <TrashIcon width={15} height={15} />
            </button>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        tabIndex={0}
        onWheel={aoRodarRoda}
        onPointerDown={aoIniciarPan}
        onPointerMove={aoMoverPonteiro}
        onPointerUp={aoSoltarPonteiro}
        onPointerLeave={aoSoltarPonteiro}
        onKeyDown={aoTeclar}
        style={{
          position: "relative",
          height: "min(70vh, 640px)",
          border: `1.5px solid ${C.line}`,
          borderRadius: 12,
          overflow: "hidden",
          background: C.paper,
          backgroundImage: `radial-gradient(${C.line} 1px, transparent 1px)`,
          backgroundSize: `${18 * zoom}px ${18 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          cursor: arrastandoPan.current ? "grabbing" : "grab",
          touchAction: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <svg style={{ position: "absolute", overflow: "visible", pointerEvents: "none" }}>
            {nos
              .filter((n) => n.pai !== null)
              .map((n) => {
                const pai = porId.get(n.pai!);
                if (!pai) return null;
                const dPai = dimensoesDe(pai);
                const dNo = dimensoesDe(n);
                const x1 = pai.x + dPai.largura / 2;
                const y1 = pai.y + dPai.altura;
                const x2 = n.x + dNo.largura / 2;
                const y2 = n.y;
                const midY = (y1 + y2) / 2;
                return (
                  <path
                    key={n.id}
                    d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                    stroke={C.line}
                    strokeWidth={2}
                    fill="none"
                  />
                );
              })}
          </svg>

          {nos.map((n) => {
            const { largura, altura } = dimensoesDe(n);
            const ativo = selecionado === n.id;
            return (
              <div
                key={n.id}
                onPointerDown={(e) => aoIniciarArrastarNo(e, n)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!moveuDurante.current) setSelecionado(n.id);
                }}
                style={{
                  position: "absolute",
                  left: n.x,
                  top: n.y,
                  width: largura,
                  minHeight: altura,
                  borderRadius: 10,
                  border: `2px solid ${corDoToken(n.cor)}`,
                  background: ativo ? corDoToken(n.cor) : C.card,
                  boxShadow: ativo ? "0 4px 14px rgba(0,0,0,0.18)" : "0 1px 4px rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 10px",
                  cursor: "grab",
                }}
              >
                <textarea
                  value={n.texto}
                  onChange={(e) => editarTexto(n.id, e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="…"
                  rows={1}
                  style={{
                    ...disp,
                    width: "100%",
                    resize: "none",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: ativo ? "#fff" : C.ink,
                    fontSize: n.tamanho === "grande" ? 15 : n.tamanho === "pequeno" ? 12 : 13.5,
                    fontWeight: n.pai === null ? 700 : 500,
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const botaoFerramenta: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: `1.5px solid ${C.line}`,
  background: C.card,
  color: C.ink,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
