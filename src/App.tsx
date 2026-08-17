import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { C, mono, TAB_BAR_H } from "./theme";
import TabBar, { type Aba } from "./components/TabBar";
import BlocosTab from "./views/BlocosTab";
import QuestoesTab from "./views/QuestoesTab";
import NotasTab from "./views/NotasTab";
import AjustesTab from "./views/AjustesTab";
import { getDB } from "./lib/db";
import { temCredencial } from "./lib/secure";
import { aplicarTema, getTema } from "./lib/tema";
import Botao from "./components/Botao";
import OfflineBanner from "./components/OfflineBanner";

// A aba Dados carrega recharts (~537 kB). Fora do bundle inicial: o app abre
// em Questões, e quem nunca abrir Dados nunca baixa o gráfico.
const DadosTab = lazy(() => import("./views/DadosTab"));

const TODAS_ABAS: Aba[] = ["blocos", "questoes", "notas", "dados", "ajustes"];

/**
 * A abertura do banco (e a migração do schema) acontece antes de qualquer tela
 * montar: as views assumem que `getDB()` já resolveu. Sem credencial, o app
 * abre em Ajustes — é a única coisa acionável nesse estado.
 */
export default function App() {
  const [pronto, setPronto] = useState(false);
  const [erroBoot, setErroBoot] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("blocos");
  // Cada aba, uma vez visitada, permanece MONTADA (só escondida via CSS) — ver
  // trocar(). Isso é o que corrige o bug de perder o drill em andamento ao
  // trocar de aba: antes, a renderização condicional desmontava a aba inteira
  // (junto com o estado do sub-bloco atual, respostas, etc.) toda vez que o
  // usuário saía dela.
  const [visitadas, setVisitadas] = useState<Set<Aba>>(new Set(["blocos"]));
  // Como as 4 abas compartilham o scroll da JANELA (nenhuma tem seu próprio
  // container com overflow), trocar de aba sem isto deixa o scroll "vazado"
  // de uma para a outra — ex.: rolar até o fim de Notas e abrir Questões já
  // aberto no meio da tela. Guardamos o scrollY de cada aba ao sair dela e
  // restauramos ao voltar.
  const scrollPorAba = useRef<Partial<Record<Aba, number>>>({});

  useEffect(() => {
    getTema().then(aplicarTema);
    getDB()
      .then(() => temCredencial())
      .then((tem) => {
        if (!tem) {
          setAba("ajustes");
          setVisitadas((v) => new Set(v).add("ajustes"));
        }
        setPronto(true);
      })
      .catch((e: unknown) => {
        setErroBoot(e instanceof Error ? e.message : "Falha ao abrir o banco de dados.");
      });
  }, []);

  function trocar(a: Aba) {
    scrollPorAba.current[aba] = window.scrollY;
    setAba(a);
    setVisitadas((v) => (v.has(a) ? v : new Set(v).add(a)));
  }

  useEffect(() => {
    window.scrollTo(0, scrollPorAba.current[aba] ?? 0);
  }, [aba]);

  if (erroBoot) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 1, marginBottom: 8 }}>
          ERRO NA INICIALIZAÇÃO
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: C.ink }}>{erroBoot}</p>
        <Botao tipo="fantasma" onClick={() => location.reload()} style={{ marginTop: 16 }}>
          Recarregar
        </Botao>
      </div>
    );
  }

  if (!pronto) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", ...mono, fontSize: 13, color: C.sub }}>
        Abrindo banco de dados…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.paper, paddingBottom: TAB_BAR_H }}>
      <OfflineBanner />
      {TODAS_ABAS.map((a) => {
        if (!visitadas.has(a)) return null;
        // display:none em vez de desmontar: preserva o estado interno de cada
        // aba (o drill de Questões, a navegação de pastas em Notas, etc.).
        return (
          <div key={a} style={{ display: aba === a ? "block" : "none" }}>
            {a === "blocos" && (
              <BlocosTab onDados={() => trocar("dados")} onAjustes={() => trocar("ajustes")} />
            )}
            {a === "questoes" && <QuestoesTab />}
            {a === "notas" && (
              <NotasTab ativa={aba === "notas"} onQuestoes={() => trocar("blocos")} />
            )}
            {a === "dados" && (
              <Suspense
                fallback={
                  <div
                    style={{
                      padding: "80px 24px",
                      textAlign: "center",
                      ...mono,
                      fontSize: 13,
                      color: C.sub,
                    }}
                  >
                    Carregando gráficos…
                  </div>
                }
              >
                <DadosTab
                  ativa={aba === "dados"}
                  onQuestoes={() => trocar("blocos")}
                  onAjustes={() => trocar("ajustes")}
                />
              </Suspense>
            )}
            {a === "ajustes" && <AjustesTab ativa={aba === "ajustes"} />}
          </div>
        );
      })}
      <TabBar aba={aba} onChange={trocar} />
    </div>
  );
}
