/**
 * Sugestão de nível de dificuldade ao ABRIR a tela de configuração de uma
 * matéria — complementa a progressão automática já existente em GerarView
 * (que só se aplica DENTRO de uma sessão, ao encadear "novo bloco, mesma
 * configuração"). Sem isto, voltar à matéria depois de dias sempre reabria no
 * último nível escolhido manualmente, mesmo tendo aprovado ou reprovado o
 * último bloco daquela matéria específica.
 *
 * Função pura (sem SQL) — recebe os últimos blocos já respondidos daquela
 * matéria (mais recente primeiro, mesma ordem de `listarBlocos`) e decide.
 * Mesmo padrão de preverAprovacao/estimarNotaProvavel em repo.ts.
 *
 * REC. 8 — média dos últimos blocos, não só o último: olhar um único bloco
 * fazia a sugestão oscilar com a sorte de uma prova só (um bloco ruim
 * isolado derrubava a progressão de quem vinha indo bem). A decisão agora é
 * por MAIORIA entre até 3 blocos recentes (aprovados vs. reprovados) — um
 * bloco ruim cercado de bons continua subindo; só maioria de reprovações
 * segura o nível. `pctMedio` (média simples dos %) entra só no texto do
 * motivo, não na decisão.
 */
export interface SugestaoNivel {
  nivel: number;
  motivo: string;
}

interface BlocoResumo {
  nivel: number;
  total_acertos: number;
  total_questoes: number;
  aprovado: boolean;
}

/** No máximo 3 blocos entram na média — janela curta o bastante para
 * reagir a uma mudança real de desempenho, longa o bastante para um bloco
 * isolado não decidir sozinho. */
const MAX_BLOCOS_CONSIDERADOS = 3;

export function sugerirNivel(ultimosBlocos: BlocoResumo[] | null): SugestaoNivel | null {
  const blocos = (ultimosBlocos ?? [])
    .filter((b) => b.total_questoes > 0)
    .slice(0, MAX_BLOCOS_CONSIDERADOS);
  if (!blocos.length) return null;

  const nivelAtual = blocos[0].nivel;
  const aprovados = blocos.filter((b) => b.aprovado).length;
  const reprovados = blocos.length - aprovados;
  const pctMedio =
    blocos.reduce((soma, b) => soma + b.total_acertos / b.total_questoes, 0) / blocos.length;
  const percentualFmt = `${Math.round(pctMedio * 100)}%`;
  const amostra = blocos.length === 1 ? "seu último bloco" : `seus últimos ${blocos.length} blocos`;

  if (aprovados >= reprovados) {
    if (nivelAtual >= 5) {
      return {
        nivel: 5,
        motivo: `Desempenho bom em ${amostra} desta matéria (${percentualFmt} de média) — já no nível máximo.`,
      };
    }
    const nivel = nivelAtual + 1;
    return {
      nivel,
      motivo: `Desempenho bom em ${amostra} desta matéria (${percentualFmt} de média) — sugerido subir para o nível ${nivel}.`,
    };
  }

  return {
    nivel: nivelAtual,
    motivo: `${amostra[0].toUpperCase()}${amostra.slice(1)} desta matéria ficaram abaixo de 80% (${percentualFmt} de média) — sugerido continuar no nível ${nivelAtual} para consolidar.`,
  };
}
