import { useCallback, useEffect, useRef, useState } from "react";
import type { NoMapa } from "../../../lib/mapas/tipos";
import { salvarNosMapa } from "../../../lib/repo";

const HISTORICO_MAX = 50;
/** Debounce do autosave — evita um write no SQLite a cada tecla digitada. */
const SALVAR_DEBOUNCE_MS = 600;

/**
 * Estado editável de um mapa mental: nós, undo/redo (até 50 passos, mesmo
 * limite do SynapsePro) e autosave debounced. Portado de pushState/undo/redo
 * em SynapsePro/index.html, adaptado para React (snapshot em JSON.stringify,
 * mesma técnica — simples e suficiente para o tamanho de um mapa).
 */
export function useMapaEstado(mapaId: number, nosIniciais: NoMapa[]) {
  const [nos, setNos] = useState<NoMapa[]>(nosIniciais);
  const historico = useRef<string[]>([]);
  const refazer = useRef<string[]>([]);
  const [podeDesfazer, setPodeDesfazer] = useState(false);
  const [podeRefazer, setPodeRefazer] = useState(false);
  const salvarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const atualizarFlags = useCallback(() => {
    setPodeDesfazer(historico.current.length > 0);
    setPodeRefazer(refazer.current.length > 0);
  }, []);

  /** Chamar ANTES de uma mutação, para poder desfazê-la depois. */
  const registrarHistorico = useCallback(() => {
    historico.current.push(JSON.stringify(nos));
    if (historico.current.length > HISTORICO_MAX) historico.current.shift();
    refazer.current = [];
    atualizarFlags();
  }, [nos, atualizarFlags]);

  const mutar = useCallback(
    (proximo: NoMapa[] | ((atual: NoMapa[]) => NoMapa[]), comHistorico = true) => {
      if (comHistorico) registrarHistorico();
      setNos(proximo);
    },
    [registrarHistorico],
  );

  const desfazer = useCallback(() => {
    const anterior = historico.current.pop();
    if (anterior === undefined) return;
    refazer.current.push(JSON.stringify(nos));
    setNos(JSON.parse(anterior));
    atualizarFlags();
  }, [nos, atualizarFlags]);

  const refazerAcao = useCallback(() => {
    const proximo = refazer.current.pop();
    if (proximo === undefined) return;
    historico.current.push(JSON.stringify(nos));
    setNos(JSON.parse(proximo));
    atualizarFlags();
  }, [nos, atualizarFlags]);

  // Autosave debounced — dispara a cada mudança de `nos`, mas só grava 600ms
  // depois da última (arrastar um nó gera dezenas de mudanças por segundo).
  useEffect(() => {
    if (salvarTimer.current) clearTimeout(salvarTimer.current);
    salvarTimer.current = setTimeout(() => {
      void salvarNosMapa(mapaId, nos);
    }, SALVAR_DEBOUNCE_MS);
    return () => {
      if (salvarTimer.current) clearTimeout(salvarTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nos, mapaId]);

  const proximoId = useCallback(() => {
    return nos.reduce((m, n) => Math.max(m, n.id), 0) + 1;
  }, [nos]);

  const adicionarFilho = useCallback(
    (paiId: number, x: number, y: number) => {
      const id = proximoId();
      mutar((atual) => [
        ...atual,
        {
          id,
          texto: "",
          x,
          y,
          pai: paiId,
          cor: "caneta",
          tamanho: "medio",
        },
      ]);
      return id;
    },
    [mutar, proximoId],
  );

  const moverNo = useCallback(
    (id: number, x: number, y: number, comHistorico = false) => {
      mutar((atual) => atual.map((n) => (n.id === id ? { ...n, x, y } : n)), comHistorico);
    },
    [mutar],
  );

  const editarTexto = useCallback(
    (id: number, texto: string) => {
      mutar((atual) => atual.map((n) => (n.id === id ? { ...n, texto } : n)), false);
    },
    [mutar],
  );

  const editarDica = useCallback(
    (id: number, dica: string) => {
      mutar((atual) => atual.map((n) => (n.id === id ? { ...n, dica: dica || undefined } : n)));
    },
    [mutar],
  );

  const definirCor = useCallback(
    (id: number, cor: string) => {
      mutar((atual) => atual.map((n) => (n.id === id ? { ...n, cor } : n)));
    },
    [mutar],
  );

  const definirTamanho = useCallback(
    (id: number, tamanho: NoMapa["tamanho"]) => {
      mutar((atual) => atual.map((n) => (n.id === id ? { ...n, tamanho } : n)));
    },
    [mutar],
  );

  /** Apaga o nó e toda a subárvore dele — a raiz nunca pode ser apagada. */
  const apagarNo = useCallback(
    (id: number) => {
      mutar((atual) => {
        const aApagar = new Set<number>([id]);
        let mudou = true;
        while (mudou) {
          mudou = false;
          for (const n of atual) {
            if (n.pai !== null && aApagar.has(n.pai) && !aApagar.has(n.id)) {
              aApagar.add(n.id);
              mudou = true;
            }
          }
        }
        return atual.filter((n) => !aApagar.has(n.id));
      });
    },
    [mutar],
  );

  return {
    nos,
    mutar,
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
  };
}
