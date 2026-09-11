/**
 * Pré-geração de blocos em segundo plano (rec. 12) — até aqui "Gerar bloco"
 * sempre exigia rede + chave de API NO MOMENTO do estudo (ver GerarView).
 * `talvezPreGerarBloco` gera 1 bloco inteiro (Q_POR_BLOCO questões, mesmos
 * 4 sub-blocos de sempre) e guarda em `blocos_pendentes` (ver
 * lib/repo/blocosPendentes.ts) enquanto o usuário já está online e dentro
 * do teto — GerarView.iniciarBloco consome esse bloco pronto, sem chamar a
 * API de novo, inclusive offline.
 *
 * Config escolhida com os MESMOS critérios que já orientam a tela
 * (materiaSugerida, pontuarTopicos por lacuna, sugerirNivel) — sem repetir
 * a config do usuário nem depender dela, já que é chamado sem o usuário
 * estar olhando pra tela de configuração.
 */
import { MATERIAS, Q_POR_BLOCO, Q_POR_SUB } from "./constants";
import { gerarSubBloco } from "./anthropic";
import { getComExplicacoesIA } from "./preferenciasGeracao";
import { escolherMateriaSugerida } from "./materiaSugerida";
import { TOPICOS_POR_MATERIA, pontuarTopicos, rotuloTopico } from "./topicos";
import { escolherPonderado } from "./pontuacaoTopicos";
import { sugerirNivel } from "./sugestao";
import { temCredencial } from "./secure";
import { getTetoMensal, situacaoTeto } from "./custo";
import {
  contarBlocosPendentes,
  criarBlocoPendente,
  listarBlocos,
  pontosPorTopico,
  resumoCusto,
} from "./repo";
import { gabaritosCEDe, padroesDe, tamanhosSubs } from "./blocoUtils";
import type { Config, Questao } from "./types";

/** No máximo 2 blocos prontos na fila de cada vez — o suficiente para
 * cobrir "o próximo bloco" sem acumular conteúdo que nunca vai ser
 * consumido (e que, se a matéria/tópico sugeridos mudarem, empata custo de
 * API gasto à toa). */
export const MAX_BLOCOS_PENDENTES = 2;

async function escolherConfigPreGeracao(): Promise<Config & { materia: string }> {
  const materia = (await escolherMateriaSugerida(MATERIAS)) ?? MATERIAS[0];

  // Mesmo direcionamento de "Todos os tópicos" em GerarView: sorteio
  // ponderado pelo tópico com pontuação mais fraca, só quando a matéria tem
  // lista fixa de tópicos (ver TOPICOS_POR_MATERIA).
  let topico = "";
  if (TOPICOS_POR_MATERIA[materia]) {
    try {
      const linhas = await pontosPorTopico(materia);
      const pontuados = pontuarTopicos(materia, linhas);
      const escolhido = pontuados && escolherPonderado(pontuados);
      if (escolhido) topico = rotuloTopico(escolhido);
    } catch (e) {
      console.error("pré-geração: escolher tópico", e);
    }
  }

  // Mesma sugestão de nível da tela de configuração (rec. 8).
  let nivel = 3;
  try {
    const ultimos = (await listarBlocos(materia, 3)).filter((b) => b.nivel >= 1);
    const sugestao = ultimos.length ? sugerirNivel(ultimos) : null;
    if (sugestao) nivel = sugestao.nivel;
  } catch (e) {
    console.error("pré-geração: sugerir nível", e);
  }

  return { materia, materiaCustom: "", topico, tipos: ["abstrato"], formato: "misto", nivel };
}

/**
 * Gera 1 bloco inteiro e guarda em `blocos_pendentes`. Silencioso e sem
 * gravação parcial: chamado depois de eventos que não esperam por ele (ver
 * `proxima()` em GerarView) — qualquer falha (offline, sem chave, sem
 * orçamento, sub-bloco que não gerou) só vai pro console, e um bloco pela
 * metade nunca entra na fila (não serviria de nada meio pronto).
 */
export async function talvezPreGerarBloco(): Promise<void> {
  try {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (!(await temCredencial())) return;
    if ((await contarBlocosPendentes()) >= MAX_BLOCOS_PENDENTES) return;

    const [custo, teto] = await Promise.all([resumoCusto(), getTetoMensal()]);
    // "perto"/"estourado" (≥80% do teto, ver situacaoTeto): não gasta API
    // sem o usuário estar ali pedindo — o mesmo ponto em que a tela de
    // configuração já pede confirmação antes de um bloco pedido de propósito.
    if (["perto", "estourado"].includes(situacaoTeto(custo.mes, teto))) return;

    const cfg = await escolherConfigPreGeracao();
    const comExplicacoes = await getComExplicacoesIA();

    const tams = tamanhosSubs(Q_POR_BLOCO, Q_POR_SUB);
    const subs: Questao[][] = [];
    for (let i = 0; i < tams.length; i++) {
      const qs = await gerarSubBloco(
        cfg,
        i,
        padroesDe(subs, i),
        gabaritosCEDe(subs, i),
        comExplicacoes,
        tams[i],
      );
      subs.push(qs);
    }
    await criarBlocoPendente(cfg, subs.flat());
  } catch (e) {
    console.error("pré-geração de bloco", e);
  }
}
