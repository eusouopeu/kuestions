/**
 * Caderno de erros em PDF (aba Dados → "Caderno de erros"): as questões
 * erradas de uma matéria/período, com texto de apoio, alternativas, a
 * resposta dada, o gabarito, a causa do erro marcada, o comentário, a
 * explicação da alternativa escolhida e as notas tiradas da questão — para
 * revisar fora do app ou imprimir.
 *
 * jsPDF com a Helvetica embutida (sem fonte externa): cobre Latin-1, então
 * acentos do português saem certos; símbolos fora disso (≤, →, “ ”) são
 * trocados por equivalentes ASCII em `limpar`. Figuras do banco
 * ("![desc](arquivo)") entram como imagem; tabelas Markdown viram linhas de
 * texto com as células separadas por " | ".
 */
import { jsPDF } from "jspdf";
import { blocosTexto } from "./blocosTexto";
import { buscarQuestaoBanco, garantirBanco, nomeDaProva } from "./banco";
import { labelCausaErro } from "./causaErro";
import { exportarArquivoBinario } from "./exportar";
import { urlFigura } from "./figuras";
import { listarErradasParaCaderno, notasPorQuestoes } from "./repo";
import { dataCurta, normalizarLayoutTexto, slugify } from "./texto";
import type { QuestaoRespondida } from "./types";

const MARGEM = 16;
const LARGURA_PAGINA = 210;
const ALTURA_PAGINA = 297;
const LARGURA_TEXTO = LARGURA_PAGINA - 2 * MARGEM;
const PT_PARA_MM = 25.4 / 72;
const ENTRELINHA = 1.3;

const TROCAS: [RegExp, string][] = [
  [/[“”„]/g, '"'],
  [/[‘’‚]/g, "'"],
  [/[–—−]/g, "-"],
  [/•/g, "-"],
  [/≤/g, "<="],
  [/≥/g, ">="],
  [/≠/g, "!="],
  [/→/g, "->"],
  [/←/g, "<-"],
  [/…/g, "..."],
  [/ /g, " "],
];

/** Só Latin-1 sobrevive à fonte padrão do PDF. */
function limpar(t: string): string {
  let s = t;
  for (const [rx, v] of TROCAS) s = s.replace(rx, v);
  return s.replace(/[^\n\x20-\xff]/g, "?");
}

async function dataURLDe(url: string): Promise<{ dados: string; w: number; h: number } | null> {
  try {
    const blob = await (await fetch(url)).blob();
    const dados = await new Promise<string>((ok, erro) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result));
      r.onerror = erro;
      r.readAsDataURL(blob);
    });
    const dim = await new Promise<{ w: number; h: number }>((ok, erro) => {
      const img = new Image();
      img.onload = () => ok({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = erro;
      img.src = dados;
    });
    return { dados, ...dim };
  } catch {
    return null;
  }
}

class Escritor {
  doc = new jsPDF({ unit: "mm", format: "a4" });
  y = MARGEM;

  private alturaLinha(tamanho: number): number {
    return tamanho * PT_PARA_MM * ENTRELINHA;
  }

  garantirEspaco(mm: number) {
    if (this.y + mm > ALTURA_PAGINA - MARGEM) {
      this.doc.addPage();
      this.y = MARGEM;
    }
  }

  texto(t: string, opts: { tamanho?: number; negrito?: boolean; cor?: [number, number, number]; recuo?: number } = {}) {
    const tamanho = opts.tamanho ?? 10;
    const recuo = opts.recuo ?? 0;
    this.doc.setFont("helvetica", opts.negrito ? "bold" : "normal");
    this.doc.setFontSize(tamanho);
    this.doc.setTextColor(...(opts.cor ?? [20, 20, 20]));
    const linhas = this.doc.splitTextToSize(limpar(t), LARGURA_TEXTO - recuo) as string[];
    const h = this.alturaLinha(tamanho);
    for (const l of linhas) {
      this.garantirEspaco(h);
      this.doc.text(l, MARGEM + recuo, this.y + tamanho * PT_PARA_MM);
      this.y += h;
    }
  }

  espaco(mm: number) {
    this.y += mm;
  }

  regua() {
    this.garantirEspaco(4);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(MARGEM, this.y, LARGURA_PAGINA - MARGEM, this.y);
    this.y += 4;
  }

  async imagem(arquivo: string, descricao: string) {
    const url = urlFigura(arquivo);
    const img = url ? await dataURLDe(url) : null;
    if (!img) {
      this.texto(`[figura: ${descricao || arquivo}]`, { cor: [120, 120, 120] });
      return;
    }
    // px a 96 dpi em mm; recorte grande fica limitado à largura do texto.
    const w = Math.min(LARGURA_TEXTO, img.w * (25.4 / 96));
    const h = (w * img.h) / img.w;
    const hFinal = Math.min(h, ALTURA_PAGINA - 2 * MARGEM);
    const wFinal = (hFinal * img.w) / img.h;
    this.garantirEspaco(hFinal + 2);
    const formato = img.dados.startsWith("data:image/png") ? "PNG" : img.dados.startsWith("data:image/webp") ? "WEBP" : "JPEG";
    this.doc.addImage(img.dados, formato, MARGEM, this.y, wFinal, hFinal);
    this.y += hFinal + 2;
  }

  /** Texto de questão com tabelas e figuras (ver lib/blocosTexto.ts). */
  async textoQuestao(t: string, opts: { recuo?: number } = {}) {
    for (const b of blocosTexto(normalizarLayoutTexto(t))) {
      if (b.tipo === "paragrafo") this.texto(b.texto, opts);
      else if (b.tipo === "imagem") await this.imagem(b.arquivo, b.descricao);
      else {
        if (b.cabecalho) this.texto(b.cabecalho.join(" | "), { ...opts, negrito: true });
        for (const l of b.linhas) this.texto(l.join(" | "), opts);
      }
      this.espaco(1.5);
    }
  }
}

async function escreverQuestao(e: Escritor, q: QuestaoRespondida, n: number, notas: string[]) {
  const qb = q.bancoId ? buscarQuestaoBanco(q.bancoId) : null;
  e.garantirEspaco(20);
  const origem = [q.materia, qb ? nomeDaProva(qb) : null, dataCurta(q.ts)].filter(Boolean).join(" · ");
  e.texto(`${n}. ${origem}`, { tamanho: 9, negrito: true, cor: [110, 60, 160] });
  e.espaco(1);
  if (qb?.texto_apoio) await e.textoQuestao(qb.texto_apoio);
  await e.textoQuestao(q.enunciado);

  if (q.formato === "ce") {
    e.texto("( ) Certo   ( ) Errado", { recuo: 4 });
  } else {
    for (const alt of q.alternativas ?? []) await e.textoQuestao(alt, { recuo: 4 });
  }
  e.espaco(1);

  const resposta = q.formato === "ce" ? (q.resposta === "C" ? "Certo" : "Errado") : q.resposta;
  const gabarito = q.formato === "ce" ? (q.gabarito === "C" ? "Certo" : "Errado") : q.gabarito;
  e.texto(`Sua resposta: ${resposta}    Gabarito: ${gabarito}`, { negrito: true });
  if (q.causa_erro) e.texto(`Causa do erro: ${labelCausaErro(q.causa_erro)}`, { cor: [180, 40, 40] });

  if (q.comentario) {
    e.espaco(1);
    e.texto("Comentário", { tamanho: 9, negrito: true, cor: [90, 90, 90] });
    e.texto(q.comentario);
  }
  const porQue = q.explicacoes_erradas?.[q.resposta];
  if (porQue) {
    e.espaco(1);
    e.texto(`Por que ${resposta} está errada`, { tamanho: 9, negrito: true, cor: [90, 90, 90] });
    e.texto(porQue);
  }
  if (notas.length) {
    e.espaco(1);
    e.texto("Suas notas", { tamanho: 9, negrito: true, cor: [90, 90, 90] });
    for (const nota of notas) e.texto(`- ${nota.replace(/\s*::\s*/, ": ")}`, { recuo: 2 });
  }
  e.espaco(3);
  e.regua();
}

export const PERIODOS_CADERNO = [
  { id: 7, label: "Últimos 7 dias" },
  { id: 30, label: "Últimos 30 dias" },
  { id: 90, label: "Últimos 90 dias" },
  { id: 0, label: "Todo o histórico" },
] as const;

/** Gera e entrega o PDF. Devolve quantas questões entraram (0 = nada a
 * exportar, nenhum arquivo gerado). */
export async function exportarCadernoErros(materia: string | null, dias: number): Promise<number> {
  const desde = dias ? new Date(Date.now() - dias * 86_400_000).toISOString() : null;
  const [erradas] = await Promise.all([listarErradasParaCaderno(materia, desde), garantirBanco()]);
  if (!erradas.length) return 0;
  const notas = await notasPorQuestoes(erradas.map((q) => q.id));

  const e = new Escritor();
  const periodo = PERIODOS_CADERNO.find((p) => p.id === dias)?.label ?? `Últimos ${dias} dias`;
  e.texto("Caderno de erros", { tamanho: 18, negrito: true });
  e.texto(
    `${materia ?? "Todas as matérias"} · ${periodo} · ${erradas.length} ${erradas.length === 1 ? "questão" : "questões"} · gerado em ${dataCurta(new Date().toISOString())}`,
    { tamanho: 9, cor: [110, 110, 110] },
  );
  e.espaco(4);
  e.regua();
  for (let i = 0; i < erradas.length; i++) {
    await escreverQuestao(e, erradas[i], i + 1, notas.get(erradas[i].id) ?? []);
  }

  const bytes = new Uint8Array(e.doc.output("arraybuffer"));
  const sufixo = slugify(materia ?? "todas");
  const data = new Date().toISOString().slice(0, 10);
  await exportarArquivoBinario(`caderno-de-erros-${sufixo}-${data}.pdf`, bytes, "application/pdf");
  return erradas.length;
}
