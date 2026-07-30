import type { FormatoId, TipoId } from "./constants";

/** Configuração de geração de um bloco. */
export interface Config {
  materia: string;
  materiaCustom: string;
  topico: string;
  tipo: TipoId;
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
  /** Tipo de cobrança efetivo desta questão (relevante quando tipo = misturado). */
  tipo_cobranca?: TipoId;
}

/** Linha de `questoes_respondidas` lida do banco. */
export interface QuestaoRespondida extends Questao {
  id: number;
  bloco_id: number | null;
  sub: string; // "A"–"D"
  carga_conceitual: number; // 1–4
  materia: string;
  /** Tópico do bloco de origem (cfg.topico) — usado para calcular a tag da nota. */
  topico: string | null;
  resposta: string;
  acertou: boolean;
  revisada: boolean;
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
