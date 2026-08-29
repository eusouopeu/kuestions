import { useCallback, useEffect, useRef, useState } from "react";
import type { BlocoCaderno, TipoBloco } from "../../../lib/caderno/tipos";
import { novoBloco } from "../../../lib/caderno/tipos";
import { salvarBlocosPagina } from "../../../lib/repo";

const HISTORICO_MAX = 50;
const SALVAR_DEBOUNCE_MS = 600;

/**
 * Estado editável dos blocos de UMA página do Caderno: CRUD, reordenação,
 * undo (snapshot em JSON.stringify, mesma técnica de useMapaEstado.ts) e
 * autosave debounced. Um hook por página, não por app inteiro — cada página
 * aberta tem seu próprio histórico de undo.
 */
export function useCadernoEstado(paginaId: number, blocosIniciais: BlocoCaderno[]) {
  const [blocos, setBlocos] = useState<BlocoCaderno[]>(
    blocosIniciais.length ? blocosIniciais : [novoBloco()],
  );
  const historico = useRef<string[]>([]);
  const [podeDesfazer, setPodeDesfazer] = useState(false);
  const salvarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutar = useCallback((proximo: BlocoCaderno[] | ((atual: BlocoCaderno[]) => BlocoCaderno[])) => {
    setBlocos((atual) => {
      historico.current.push(JSON.stringify(atual));
      if (historico.current.length > HISTORICO_MAX) historico.current.shift();
      setPodeDesfazer(true);
      return typeof proximo === "function" ? proximo(atual) : proximo;
    });
  }, []);

  const desfazer = useCallback(() => {
    const anterior = historico.current.pop();
    if (anterior === undefined) return;
    setBlocos(JSON.parse(anterior));
    setPodeDesfazer(historico.current.length > 0);
  }, []);

  useEffect(() => {
    if (salvarTimer.current) clearTimeout(salvarTimer.current);
    salvarTimer.current = setTimeout(() => {
      void salvarBlocosPagina(paginaId, blocos);
    }, SALVAR_DEBOUNCE_MS);
    return () => {
      if (salvarTimer.current) clearTimeout(salvarTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocos, paginaId]);

  const atualizarTexto = useCallback((id: string, texto: string) => {
    setBlocos((atual) => atual.map((b) => (b.id === id ? { ...b, texto } : b)));
  }, []);

  const alternarMarcado = useCallback(
    (id: string) => {
      mutar((atual) => atual.map((b) => (b.id === id ? { ...b, marcado: !b.marcado } : b)));
    },
    [mutar],
  );

  const alternarAberto = useCallback((id: string) => {
    // Recolher/expandir um toggle não entra no histórico de undo — não é
    // uma edição de conteúdo, é só um estado de visualização.
    setBlocos((atual) => atual.map((b) => (b.id === id ? { ...b, aberto: !b.aberto } : b)));
  }, []);

  const mudarTipo = useCallback(
    (id: string, tipo: TipoBloco) => {
      mutar((atual) =>
        atual.map((b) => {
          if (b.id !== id) return b;
          if (tipo === "tabela" && !b.celulas) {
            return { ...b, tipo, celulas: [["", ""], ["", ""]] };
          }
          return { ...b, tipo };
        }),
      );
    },
    [mutar],
  );

  const editarCelula = useCallback(
    (id: string, linha: number, coluna: number, valor: string) => {
      setBlocos((atual) =>
        atual.map((b) => {
          if (b.id !== id || !b.celulas) return b;
          const celulas = b.celulas.map((l) => [...l]);
          celulas[linha][coluna] = valor;
          return { ...b, celulas };
        }),
      );
    },
    [],
  );

  const adicionarLinhaTabela = useCallback(
    (id: string) => {
      mutar((atual) =>
        atual.map((b) => {
          if (b.id !== id || !b.celulas) return b;
          const colunas = b.celulas[0]?.length ?? 2;
          return { ...b, celulas: [...b.celulas, Array(colunas).fill("")] };
        }),
      );
    },
    [mutar],
  );

  const adicionarColunaTabela = useCallback(
    (id: string) => {
      mutar((atual) =>
        atual.map((b) => {
          if (b.id !== id || !b.celulas) return b;
          return { ...b, celulas: b.celulas.map((l) => [...l, ""]) };
        }),
      );
    },
    [mutar],
  );

  /** Insere um bloco novo logo após `depoisDeId` (ou no fim, se omitido) e
   * devolve o id do bloco criado, para o chamador focar nele. */
  const inserirApos = useCallback(
    (depoisDeId: string | null, tipo: TipoBloco = "texto") => {
      const bloco = novoBloco(tipo);
      mutar((atual) => {
        if (depoisDeId === null) return [...atual, bloco];
        const i = atual.findIndex((b) => b.id === depoisDeId);
        if (i === -1) return [...atual, bloco];
        return [...atual.slice(0, i + 1), bloco, ...atual.slice(i + 1)];
      });
      return bloco.id;
    },
    [mutar],
  );

  const apagarBloco = useCallback(
    (id: string) => {
      mutar((atual) => {
        const restante = atual.filter((b) => b.id !== id);
        return restante.length ? restante : [novoBloco()];
      });
    },
    [mutar],
  );

  const duplicarBloco = useCallback(
    (id: string) => {
      mutar((atual) => {
        const i = atual.findIndex((b) => b.id === id);
        if (i === -1) return atual;
        const copia: BlocoCaderno = { ...atual[i], id: crypto.randomUUID() };
        return [...atual.slice(0, i + 1), copia, ...atual.slice(i + 1)];
      });
    },
    [mutar],
  );

  const moverBloco = useCallback(
    (id: string, direcao: -1 | 1) => {
      mutar((atual) => {
        const i = atual.findIndex((b) => b.id === id);
        const j = i + direcao;
        if (i === -1 || j < 0 || j >= atual.length) return atual;
        const copia = [...atual];
        [copia[i], copia[j]] = [copia[j], copia[i]];
        return copia;
      });
    },
    [mutar],
  );

  /** Funde o bloco `id` com o anterior (texto concatenado, bloco atual
   * removido) — o "Backspace no início de um bloco vazio" do editor. Lê
   * `blocos` do closure (não de dentro do updater) para poder devolver o id
   * do bloco anterior de forma síncrona, e o chamador focar nele. */
  const fundirComAnterior = useCallback(
    (id: string): string | null => {
      const i = blocos.findIndex((b) => b.id === id);
      if (i <= 0) return null;
      const idAnterior = blocos[i - 1].id;
      mutar((atual) => {
        const j = atual.findIndex((b) => b.id === id);
        if (j <= 0) return atual;
        const anterior = atual[j - 1];
        const fundido = { ...anterior, texto: anterior.texto + atual[j].texto };
        return [...atual.slice(0, j - 1), fundido, ...atual.slice(j + 1)];
      });
      return idAnterior;
    },
    [blocos, mutar],
  );

  return {
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
  };
}
