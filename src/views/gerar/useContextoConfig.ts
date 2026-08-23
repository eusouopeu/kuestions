/**
 * Tudo o que a TELA DE CONFIGURAÇÃO de GerarView precisa saber do banco antes
 * de o usuário disparar um bloco — histórico recente, credencial, lacunas do
 * edital e custo — reunido num hook próprio. GerarView passou a acumular
 * efeitos assíncronos entre o estado do drill e o layout; aqui eles ficam
 * juntos, e a view volta a tratar só do drill e do desenho.
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
  topicosPraticadosPorMateria,
} from "../../lib/repo";
import { getPesosEdital, PESO_PADRAO } from "../../lib/edital";
import { lacunasDoEdital, type LacunaEdital } from "../../lib/topicos";
import { getTetoMensal } from "../../lib/custo";
import { sugerirNivel, type SugestaoNivel } from "../../lib/sugestao";
import { temCredencial } from "../../lib/secure";
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
  // Tópicos do edital com zero prática, mas só dentro de matéria já
  // trabalhada (ver lacunasDoEdital em lib/topicos.ts).
  const [lacunas, setLacunas] = useState<LacunaEdital[]>([]);
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
    Promise.all([topicosPraticadosPorMateria(), resumoPorMateria(null), getPesosEdital()])
      .then(([praticados, fatias, pesos]) => {
        const acertoPorMateria = Object.fromEntries(
          fatias.map((f) => [f.chave, { total: f.total, pct: f.pct }]),
        );
        setLacunas(lacunasDoEdital(praticados, acertoPorMateria, pesos, PESO_PADRAO));
      })
      .catch(() => setLacunas([]));
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

  return { hist, temChave, sugestaoNivel, lacunas, custoMes, tetoMes, custoEstimado };
}
