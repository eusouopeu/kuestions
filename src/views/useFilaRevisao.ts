/**
 * Fila de revisão paginada, compartilhada por RefazerView e
 * BlocosAnterioresView — as duas telas reabrem questões já respondidas
 * (sem chamar a API) e diferiam só na origem da fila (matéria/conceito numa,
 * matéria numa bloco fechado noutra) e no filtro aplicado antes de buscar;
 * toda a mecânica de paginação, avanço e saída era código idêntico duplicado
 * entre elas. `Fonte` é o tipo que a tela usa para identificar QUAL fila abrir
 * (uma string de matéria, ou um objeto {tipo, valor} — RefazerView usa o
 * segundo para distinguir matéria de conceito).
 */
import { useState } from "react";
import { idsComNota } from "../lib/repo";
import type { QuestaoRespondida } from "../lib/types";

/** Tamanho do lote carregado por vez — evita trazer para a memória de uma só
 * vez um histórico que só cresce (ver listarErradas/listarTodasPorMateria). */
const LOTE = 150;

export function useFilaRevisao<Fonte>(
  buscarPagina: (fonte: Fonte, opts: { limite?: number; offset?: number }) => Promise<QuestaoRespondida[]>,
) {
  const [fonte, setFonte] = useState<Fonte | null>(null);
  const [fila, setFila] = useState<QuestaoRespondida[] | null>(null);
  const [temMaisLotes, setTemMaisLotes] = useState(false);
  const [carregandoLote, setCarregandoLote] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revisadasAgora, setRevisadasAgora] = useState(0);
  const [comNota, setComNota] = useState<Set<number>>(new Set());
  const [erro, setErro] = useState<string | null>(null);

  async function abrir(f: Fonte) {
    setErro(null);
    try {
      const qs = await buscarPagina(f, { limite: LOTE });
      if (!qs.length) {
        setErro("Nenhuma questão nesse filtro.");
        return;
      }
      setFonte(f);
      setFila(qs);
      setTemMaisLotes(qs.length === LOTE);
      setIdx(0);
      setRevisadasAgora(0);
      idsComNota(qs.map((q) => q.id))
        .then(setComNota)
        .catch(() => setComNota(new Set()));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar as questões.");
    }
  }

  /** Busca o próximo lote e o anexa à fila em vez de recarregar tudo do
   * zero — é o que torna a paginação transparente para quem revisa. */
  async function carregarProximoLote(): Promise<QuestaoRespondida[]> {
    if (!temMaisLotes || carregandoLote || !fonte) return [];
    setCarregandoLote(true);
    try {
      const proximas = await buscarPagina(fonte, { limite: LOTE, offset: fila?.length ?? 0 });
      setFila((f) => (f ? [...f, ...proximas] : proximas));
      setTemMaisLotes(proximas.length === LOTE);
      idsComNota(proximas.map((q) => q.id))
        .then((novos) => setComNota((s) => new Set([...s, ...novos])))
        .catch(() => {});
      return proximas;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar mais questões.");
      return [];
    } finally {
      setCarregandoLote(false);
    }
  }

  function sair() {
    setFila(null);
    setFonte(null);
    setTemMaisLotes(false);
    setComNota(new Set());
  }

  /** Avança para a próxima questão da fila, buscando mais um lote se
   * necessário; chama `aoAcabar` ao chegar no fim (última questão, sem mais
   * lotes, ou lote seguinte vazio apesar do sinal de "tem mais"). */
  async function proxima(aoAcabar: () => void) {
    if (!fila) return;
    const ultima = idx === fila.length - 1 && !temMaisLotes;
    if (ultima) {
      aoAcabar();
      return;
    }
    if (idx === fila.length - 1 && temMaisLotes) {
      const proximas = await carregarProximoLote();
      if (!proximas.length) {
        aoAcabar();
        return;
      }
    }
    setIdx(idx + 1);
  }

  function registrarRevisadaAgora() {
    setRevisadasAgora((n) => n + 1);
  }

  return {
    fonte,
    fila,
    temMaisLotes,
    carregandoLote,
    idx,
    revisadasAgora,
    comNota,
    erro,
    setErro,
    abrir,
    carregarProximoLote,
    sair,
    proxima,
    registrarRevisadaAgora,
  };
}
