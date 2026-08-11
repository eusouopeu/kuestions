import type { FormatoId, TipoId } from "./constants";

/** Configuração de geração de um bloco. */
export interface Config {
  materia: string;
  materiaCustom: string;
  topico: string;
  /** Tipos de cobrança selecionados. 1 = fixo; 2+ = sorteado por questão. */
  tipos: TipoId[];
  formato: FormatoId;
  nivel: number; // 1–5
}

/** Questão como devolvida pelo modelo (e como é persistida). */
export interface Questao {
  enunciado: string;
  formato: "ce" | "mc";
  /** null em Certo/Errado; 5 strings ("A) …" … "E) …") em múltipla escolha. */
  alternativas: string[] | null;
  /** "C"/"E" em CE; "A"–"E" em MC. */
  gabarito: string;
  conceitos: string[];
  comentario: string;
  /** Explicação do erro específico de cada alternativa errada, letra → texto. */
  explicacoes_erradas: Record<string, string>;
  dispositivo: string | null;
  /** Tipo de cobrança efetivo desta questão (relevante quando `tipos` tem 2+ selecionados). */
  tipo_cobranca?: TipoId;
}

/** Linha de `questoes_respondidas` lida do banco. */
export interface QuestaoRespondida extends Questao {
  id: number;
  bloco_id: number | null;
  /** Nível de dificuldade (1–5) do bloco de origem; null para questões
   * importadas ou geradas do banco, que não passam por Config.nivel. */
  nivel: number | null;
  materia: string;
  /** Tópico do bloco de origem (cfg.topico) — usado para calcular a tag da nota. */
  topico: string | null;
  /** "" quando a questão foi carregada mas nunca respondida (bloco
   * abandonado) — nesse caso `acertou` é sempre false. */
  resposta: string;
  acertou: boolean;
  revisada: boolean;
  /** Usuário sinalizou que a questão em si (enunciado/gabarito) está errada. */
  reportada: boolean;
  /** Categoria escolhida ao reportar — ver MotivoReport em lib/repo.ts. */
  motivo_report: string | null;
  ts: string;
}

/** Linha de `blocos`. */
export interface Bloco {
  id: number;
  ts: string;
  materia: string;
  topico: string | null;
  tipo: string;
  formato: string;
  nivel: number;
  total_acertos: number;
  total_questoes: number;
  por_sub: number[];
  aprovado: boolean;
}

/**
 * Linha de `conceitos_salvos` — uma nota criada ao selecionar um trecho de
 * texto de uma questão. `termo`/`definicao` (nomes antigos, do fluxo de chip
 * de conceito) não são mais lidos pelo app; sobrevivem só como colunas
 * mortas para não exigir DROP COLUMN em todo aparelho já com o app instalado.
 */
export interface ConceitoSalvo {
  id: number;
  materia: string;
  /** Digitado pelo usuário ao salvar a seleção. */
  titulo: string;
  /** O trecho selecionado na questão (editável antes de salvar). */
  corpo: string;
  /** Assunto do bloco de origem, resumido a ≤3 palavras hifenizadas. */
  tag: string;
  questao_origem_id: number | null;
  ts: string;
}

export type StatusSub = "idle" | "carregando" | "ok" | "erro";
