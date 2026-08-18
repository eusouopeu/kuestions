/**
 * Sugestão de nível de dificuldade ao ABRIR a tela de configuração de uma
 * matéria — complementa a progressão automática já existente em GerarView
 * (que só se aplica DENTRO de uma sessão, ao encadear "novo bloco, mesma
 * configuração"). Sem isto, voltar à matéria depois de dias sempre reabria no
 * último nível escolhido manualmente, mesmo tendo aprovado ou reprovado o
 * último bloco daquela matéria específica.
 *
 * Função pura (sem SQL) — recebe o último bloco já respondido daquela
 * matéria (ou null, sem histórico) e decide. Mesmo padrão de preverAprovacao/
 * estimarNotaProvavel em repo.ts.
 */
export interface SugestaoNivel {
  nivel: number;
  motivo: string;
}

export function sugerirNivel(
  ultimoBloco: { nivel: number; total_acertos: number; total_questoes: number; aprovado: boolean } | null,
): SugestaoNivel | null {
  if (!ultimoBloco || !ultimoBloco.total_questoes) return null;

  const placar = `${ultimoBloco.total_acertos}/${ultimoBloco.total_questoes}`;

  if (ultimoBloco.aprovado) {
    if (ultimoBloco.nivel >= 5) {
      return { nivel: 5, motivo: `Você aprovou o último bloco desta matéria (${placar}) — já no nível máximo.` };
    }
    const nivel = ultimoBloco.nivel + 1;
    return { nivel, motivo: `Você aprovou o último bloco desta matéria (${placar}) — sugerido subir para o nível ${nivel}.` };
  }

  return {
    nivel: ultimoBloco.nivel,
    motivo: `Seu último bloco desta matéria ficou abaixo de 90% (${placar}) — sugerido continuar no nível ${ultimoBloco.nivel} para consolidar.`,
  };
}
