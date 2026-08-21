/**
 * Tudo o que a TELA DE CONFIGURAÇÃO de GerarView precisa saber do banco antes
 * de o usuário disparar um bloco — histórico recente, credencial, sugestão de
 * nível, prioridade de estudo e custo — reunido num hook próprio. GerarView
 * passou a acumular seis efeitos assíncronos entre o estado do drill e o
 * layout; aqui eles ficam juntos, e a view volta a tratar só do drill e do
 * desenho.
 *
 * Todos recarregam quando a tela de configuração reabre: entre uma visita e
 * outra o usuário pode ter respondido blocos em outra aba (que fica montada,
 * ver App.tsx), mudado o peso do edital em Ajustes ou gastado API.
 */
import { useEffect, useState } from "react";
import {
  custoMedioPorBloco,
  listarBlocos,
  resumoCusto,
  resumoPorMateria,
  ultimaPraticaPorMateria,
} from "../../lib/repo";
import { getPesosEdital } from "../../lib/edital";
import { getTetoMensal } from "../../lib/custo";
import { priorizar, type Prioridade } from "../../lib/prioridade";
import { sugerirNivel, type SugestaoNivel } from "../../lib/sugestao";
import { temCredencial } from "../../lib/secure";
import { MATERIAS } from "../../lib/constants";
import type { Bloco } from "../../lib/types";

export function useContextoConfig({
  ativa,
  /** Matéria já resolvida (com "Outra…" trocada pelo nome digitado). */
  materia,
  /** Quantidade de questões do bloco, para estimar o custo dele. */
  quantidade,
}: {
  ativa: boolean;
  materia: string;
  quantidade: number;
}) {
  const [hist, setHist] = useState<Bloco[]>([]);
  const [temChave, setTemChave] = useState(true);
  const [sugestaoNivel, setSugestaoNivel] = useState<SugestaoNivel | null>(null);
  // "Estudar o que mais importa agora": peso no edital × fraqueza × tempo sem
  // praticar (ver lib/prioridade.ts). Só a primeira colocada interessa — a
  // ideia é substituir a decisão, não oferecer mais um menu.
  const [prioridade, setPrioridade] = useState<Prioridade | null>(null);
  const [custoMes, setCustoMes] = useState(0);
  const [tetoMes, setTetoMes] = useState(0);
  const [custoEstimado, setCustoEstimado] = useState<number | null>(null);

  useEffect(() => {
    if (!ativa) return;
    listarBlocos(null, 5).then(setHist).catch(() => setHist([]));
    temCredencial().then(setTemChave);
    Promise.all([resumoCusto(), getTetoMensal()])
      .then(([c, t]) => {
        setCustoMes(c.mes);
        setTetoMes(t);
      })
      .catch(() => {});
  }, [ativa]);

  useEffect(() => {
    if (!ativa) return;
    Promise.all([resumoPorMateria(null), getPesosEdital(), ultimaPraticaPorMateria()])
      .then(([fatias, pesos, ultimas]) => {
        const entradas = fatias
          // Só matérias da lista fixa: sugerir "Matéria personalizada" não
          // daria uma configuração aplicável em um toque.
          .filter((f) => (MATERIAS as readonly string[]).includes(f.chave))
          .map((f) => ({
            materia: f.chave,
            pct: f.pct,
            total: f.total,
            ultimaPratica: ultimas[f.chave] ?? null,
          }));
        setPrioridade(priorizar(entradas, pesos)[0] ?? null);
      })
      .catch(() => setPrioridade(null));
  }, [ativa]);

  // Custo estimado vem da média real das últimas chamadas de sub-bloco (ver
  // custoMedioPorBloco), não de uma conta teórica de tokens — sem histórico
  // suficiente fica null e a tela simplesmente não promete um número.
  useEffect(() => {
    if (!ativa) return;
    custoMedioPorBloco(quantidade)
      .then(setCustoEstimado)
      .catch(() => setCustoEstimado(null));
  }, [ativa, quantidade]);

  // Sugestão de nível: olha o último bloco JÁ FECHADO desta matéria (gerado
  // por IA — só esses gravam `nivel` 1–5; blocos do banco de questões reais
  // gravam nivel 0 e ficam de fora, ver Bloco.nivel).
  useEffect(() => {
    if (!ativa || !materia) {
      setSugestaoNivel(null);
      return;
    }
    let cancelado = false;
    listarBlocos(materia, 1)
      .then(([ultimo]) => {
        if (cancelado) return;
        setSugestaoNivel(ultimo && ultimo.nivel >= 1 ? sugerirNivel(ultimo) : null);
      })
      .catch(() => {
        if (!cancelado) setSugestaoNivel(null);
      });
    return () => {
      cancelado = true;
    };
  }, [ativa, materia]);

  return { hist, temChave, sugestaoNivel, prioridade, custoMes, tetoMes, custoEstimado };
}
