# Navegação Unificada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar as abas Blocos+Questões numa só (6 sub-views, ícone-apenas), tirar texto das abas no mobile e mover a nav principal pro rail lateral no desktop, e adicionar botões de tema/tamanho-texto no topo mobile.

**Architecture:** `abas.ts` perde a entrada `blocos`; o conteúdo das 3 sub-views de `BlocosTab.tsx` migra pra dentro de `QuestoesTab.tsx`, que passa a expor 6 opções num único `Segmented` com o novo prop `iconeApenas`. `TabBar.tsx` (mobile) e `RailLateral.tsx` (desktop) passam a ser as duas únicas superfícies de nav principal — `NavPill.tsx` é desconectado de `App.tsx` sem ser apagado. Dois componentes de botão (`BotaoTema`, `BotaoTamanhoTexto`) ficam compartilhados entre `RailLateral` e `Shell`.

**Tech Stack:** React 18 + TypeScript, Vite, Vitest (`environment: "node"`, sem plugin de React — só funções puras são testadas, nenhum componente é renderizado em teste).

**Spec:** [docs/superpowers/specs/2026-08-30-navegacao-unificada-design.md](../specs/2026-08-30-navegacao-unificada-design.md)

## Global Constraints

- TypeScript, Tailwind não se aplica aqui (app usa estilos inline via `theme.ts`, não Tailwind) — seguir o padrão inline existente, não introduzir Tailwind.
- Ícones Lucide não se aplicam aqui — o projeto usa `@heroicons/react/24/outline` de forma consistente; manter essa biblioteca.
- Fonte Montserrat / line-height 1.5 já vêm de `theme.ts` (`mono`/`disp`) — não redefinir estilos de fonte nos componentes novos.
- Preferência por botões-ícone sobre botões com texto — todos os componentes novos deste plano são botões-ícone.
- Testes: só funções puras, ambiente `node` (ver `vitest.config.ts`) — nenhuma task deste plano deve tentar renderizar um componente React em teste.
- Commit por task, mensagens em português no estilo já usado no repo.

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `src/components/abas.ts` | Modificar — remove `blocos` de `ABAS` |
| `src/lib/questoesInicial.ts` | Criar — função pura `escolherViewInicial` |
| `src/lib/questoesInicial.test.ts` | Criar |
| `src/lib/acessibilidade.ts` | Modificar — exporta `PROXIMA_ESCALA` |
| `src/lib/acessibilidade.test.ts` | Criar |
| `src/components/abas.test.ts` | Criar |
| `src/components/Segmented.tsx` | Modificar — novo prop `iconeApenas` |
| `src/views/QuestoesTab.tsx` | Reescrever — absorve `BlocosTab` |
| `src/views/BlocosTab.tsx` | Apagar |
| `src/App.tsx` | Modificar — `TODAS_ABAS`, remove rota `blocos`, remove `NavPill` |
| `src/views/NotasTab.tsx` | Modificar — `OPCOES_MODO` ganha ícones |
| `src/components/TabBar.tsx` | Modificar — remove label |
| `src/components/BotaoTema.tsx` | Criar — extraído de `RailLateral.tsx` |
| `src/components/BotaoTamanhoTexto.tsx` | Criar |
| `src/components/RailLateral.tsx` | Modificar — usa `BotaoTema`, ganha ícones de aba |
| `src/components/Shell.tsx` | Modificar — header mobile ganha os 2 botões |

---

## Task 1: Função pura da view inicial de Questões

**Files:**
- Create: `src/lib/questoesInicial.ts`
- Test: `src/lib/questoesInicial.test.ts`

**Interfaces:**
- Produces: `export type ViewQuestoes = "gerar" | "banco" | "importar" | "refazer" | "simulado" | "blocos-anteriores"` e `export function escolherViewInicial(temCredencial: boolean): ViewQuestoes` — usada por Task 6 (`QuestoesTab.tsx`).

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/questoesInicial.test.ts
import { describe, expect, it } from "vitest";
import { escolherViewInicial } from "./questoesInicial";

describe("escolherViewInicial", () => {
  it("abre em banco quando não há credencial", () => {
    expect(escolherViewInicial(false)).toBe("banco");
  });

  it("abre em gerar quando há credencial", () => {
    expect(escolherViewInicial(true)).toBe("gerar");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/questoesInicial.test.ts`
Expected: FAIL — `Cannot find module './questoesInicial'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/questoesInicial.ts
/**
 * Decide a sub-view inicial da aba Questões unificada (ver
 * views/QuestoesTab.tsx). Sem credencial de API, "Gerar com IA" é a única
 * das 6 sub-views que não funciona — a aba abre em "Do banco", que
 * funciona offline e sem credencial nenhuma (ver lib/banco.ts).
 */
export type ViewQuestoes =
  | "gerar"
  | "banco"
  | "importar"
  | "refazer"
  | "simulado"
  | "blocos-anteriores";

export function escolherViewInicial(temCredencial: boolean): ViewQuestoes {
  return temCredencial ? "gerar" : "banco";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/questoesInicial.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/questoesInicial.ts src/lib/questoesInicial.test.ts
git commit -m "Extrai lógica pura de view inicial da aba Questões unificada"
```

---

## Task 2: Ciclo de escala como tabela exportada

**Files:**
- Modify: `src/lib/acessibilidade.ts`
- Test: `src/lib/acessibilidade.test.ts` (criar)

**Interfaces:**
- Produces: `export const PROXIMA_ESCALA: Record<Escala, Escala>` — usada por Task 9 (`BotaoTamanhoTexto.tsx`).

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/acessibilidade.test.ts
import { describe, expect, it } from "vitest";
import { PROXIMA_ESCALA } from "./acessibilidade";

describe("PROXIMA_ESCALA", () => {
  it("cicla 100 -> 110 -> 125 -> 100", () => {
    expect(PROXIMA_ESCALA[100]).toBe(110);
    expect(PROXIMA_ESCALA[110]).toBe(125);
    expect(PROXIMA_ESCALA[125]).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/acessibilidade.test.ts`
Expected: FAIL — `PROXIMA_ESCALA is not exported`

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/acessibilidade.ts`, right after the `ESCALAS` export (after line 25):

```typescript
/** Ciclo usado pelo botão de tamanho de texto no topo mobile (ver
 * components/BotaoTamanhoTexto.tsx) — mesmo padrão de PROXIMO_TEMA em
 * RailLateral.tsx. */
export const PROXIMA_ESCALA: Record<Escala, Escala> = {
  100: 110,
  110: 125,
  125: 100,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/acessibilidade.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/lib/acessibilidade.ts src/lib/acessibilidade.test.ts
git commit -m "Exporta ciclo de escala PROXIMA_ESCALA de lib/acessibilidade"
```

---

## Task 3: Remover `blocos` de `ABAS`

**Files:**
- Modify: `src/components/abas.ts`
- Test: `src/components/abas.test.ts` (criar)

**Interfaces:**
- Consumes: nenhuma (arquivo de dados puro).
- Produces: `ABAS` com 4 entradas, ids `["questoes", "notas", "dados", "ajustes"]`, nessa ordem — usado por Task 7 (`App.tsx`), Task 10 (`TabBar.tsx`), Task 11 (`RailLateral.tsx`).

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/abas.test.ts
import { describe, expect, it } from "vitest";
import { ABAS } from "./abas";

describe("ABAS", () => {
  it("tem 4 abas, sem 'blocos', na ordem questoes/notas/dados/ajustes", () => {
    expect(ABAS.map((a) => a.id)).toEqual(["questoes", "notas", "dados", "ajustes"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/abas.test.ts`
Expected: FAIL — recebe `["blocos", "questoes", "notas", "dados", "ajustes"]`

- [ ] **Step 3: Write minimal implementation**

In `src/components/abas.ts`: remove the `blocos` entry (lines 26-32) and remove `RectangleStackIcon` from the import if no longer used elsewhere in the file (check before removing — `RectangleStackIcon` is only used by the `blocos` entry in this file, safe to drop). Update the `Aba` union type on line 10: `export type Aba = "questoes" | "notas" | "dados" | "ajustes";`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/abas.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/components/abas.ts src/components/abas.test.ts
git commit -m "Remove aba Blocos de ABAS — unificada em Questões"
```

---

## Task 4: `Segmented` ganha prop `iconeApenas`

**Files:**
- Modify: `src/components/Segmented.tsx`

**Interfaces:**
- Consumes: nada novo.
- Produces: prop opcional `iconeApenas?: boolean` no componente `Segmented` — usado por Task 6 (`QuestoesTab.tsx`, com `iconeApenas={true}`).

Sem teste automatizado nesta task — é mudança de renderização (JSX), e o projeto não testa componentes (ver Global Constraints). Verificação é visual, feita na Task 6 ao integrar.

- [ ] **Step 1: Modificar `Segmented.tsx`**

Replace the full file with:

```typescript
import type { ReactNode } from "react";
import { C, mono } from "../theme";

/**
 * Seletor de duas ou mais views. Usado no topo da aba Questões (Gerar novas /
 * Refazer erradas) e como filtro de ordenação na aba Notas. `icone` é
 * opcional — só a aba Questões usa, para diferenciar visualmente seus
 * modos (que não são abas de verdade, e por isso pedem um reforço além do
 * texto para o usuário situar-se rápido em qual fluxo está).
 *
 * `iconeApenas` esconde o texto do label (mantido como `title`/`aria-label`
 * para acessibilidade) — usado pela aba Questões unificada, que tem 6
 * opções e precisa caber numa pílula só sem estourar a largura no mobile.
 */
// `T extends string | number`: além dos ids textuais (abas, ordenação), a
// escala da interface em Ajustes usa números (100/110/125) como id.
export default function Segmented<T extends string | number>({
  valor,
  opcoes,
  onChange,
  iconeApenas = false,
}: {
  valor: T;
  opcoes: { id: T; label: string; icone?: (cor: string) => ReactNode }[];
  onChange: (id: T) => void;
  iconeApenas?: boolean;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: 0,
        border: `1.5px solid ${C.line}`,
        borderRadius: 8,
        overflow: "hidden",
        background: C.card,
      }}
    >
      {opcoes.map((o) => {
        const ativo = o.id === valor;
        const cor = ativo ? "#fff" : C.ink;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={ativo}
            aria-label={o.label}
            title={iconeApenas ? o.label : undefined}
            onClick={() => onChange(o.id)}
            style={{
              ...mono,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              flex: 1,
              fontSize: 12,
              fontWeight: ativo ? 600 : 400,
              padding: o.icone ? "9px 4px 8px" : "10px 6px",
              border: "none",
              cursor: "pointer",
              background: ativo ? C.realce : "transparent",
              color: cor,
              transition: "background .12s",
            }}
          >
            {o.icone?.(cor)}
            {!iconeApenas && o.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Segmented.tsx
git commit -m "Segmented ganha prop iconeApenas para pílulas de 6+ opções"
```

---

## Task 5: Ícones na pílula de Notas

**Files:**
- Modify: `src/views/NotasTab.tsx`

Sem teste automatizado — mudança puramente de apresentação (ícones num array de opções já existente), sem lógica nova a isolar.

- [ ] **Step 1: Adicionar ícones a `OPCOES_MODO`**

In `src/views/NotasTab.tsx`, update the import on lines 2-7 to add the new icons:

```typescript
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  LightBulbIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
```

Replace `OPCOES_MODO` (lines 33-38) with:

```typescript
const OPCOES_MODO: { id: ModoNotas; label: string; icone: (cor: string) => ReactNode }[] = [
  {
    id: "conceitos",
    label: "Conceitos",
    icone: (cor) => <LightBulbIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />,
  },
  {
    id: "caderno",
    label: "Caderno",
    icone: (cor) => <BookOpenIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />,
  },
  {
    id: "mapas",
    label: "Mapas",
    icone: (cor) => <MapIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />,
  },
  {
    id: "tarefas",
    label: "Tarefas",
    icone: (cor) => (
      <ClipboardDocumentListIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />
    ),
  },
];
```

`ReactNode` needs importing — add it to the existing `import { useCallback, useEffect, useState, type ReactNode } from "react";` on line 1 (already there — check before editing; if missing, add `type ReactNode`).

- [ ] **Step 2: Commit**

```bash
git add src/views/NotasTab.tsx
git commit -m "Adiciona ícones à pílula de sub-abas de Notas"
```

---

## Task 6: `QuestoesTab.tsx` absorve `BlocosTab.tsx`

**Files:**
- Modify: `src/views/QuestoesTab.tsx` (reescrita completa)
- Delete: `src/views/BlocosTab.tsx`

**Interfaces:**
- Consumes: `escolherViewInicial`, `ViewQuestoes` de `src/lib/questoesInicial.ts` (Task 1); `Segmented` com `iconeApenas` (Task 4); `temCredencial` de `../lib/secure`; `blocosNaSemana` de `../lib/repo`; `getMetas`, `META_GERAL`, `rotuloMeta` de `../lib/metas`.
- Produces: `export default function QuestoesTab({ onDados, onAjustes }: { onDados: () => void; onAjustes: () => void }): JSX.Element` — usado por Task 7 (`App.tsx`).

Sem teste automatizado nesta task — é composição de JSX já coberta pelas Tasks 1 (lógica de view inicial, testada) e 4 (Segmented, sem teste por ser JSX puro). A verificação é o `npm run build` da Task 12 e checagem visual manual.

- [ ] **Step 1: Escrever `QuestoesTab.tsx`**

Replace the full file with (this merges `MetasSemanais` and the 3 views from the old `BlocosTab.tsx` with the 3 views already in `QuestoesTab.tsx`):

```typescript
import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CircleStackIcon,
  ClockIcon,
  RectangleStackIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { C, cartao, mono } from "../theme";
import Shell from "../components/Shell";
import Segmented from "../components/Segmented";
import GerarView from "./GerarView";
import GerarBancoView from "./GerarBancoView";
import ImportarView from "./ImportarView";
import RefazerView from "./RefazerView";
import SimuladoView from "./SimuladoView";
import BlocosAnterioresView from "./BlocosAnterioresView";
import { blocosNaSemana } from "../lib/repo";
import { getMetas, META_GERAL, rotuloMeta } from "../lib/metas";
import { temCredencial } from "../lib/secure";
import { escolherViewInicial, type ViewQuestoes } from "../lib/questoesInicial";

/**
 * Progresso das metas semanais configuradas em Ajustes (ver lib/metas.ts) —
 * a meta geral ("Todas as matérias") e as por matéria vêm do MESMO mapa, e
 * por isso aparecem na mesma lista, com a geral no topo. Some inteira quando
 * não há nenhuma meta configurada.
 *
 * Recolhida por padrão quando há mais de uma: expandida, uma barra por meta
 * já domina a tela de abertura da aba.
 */
function MetasSemanais() {
  const [metas, setMetas] = useState<{ chave: string; alvo: number; naSemana: number }[] | null>(
    null,
  );
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    getMetas()
      .then(async (mapa) => {
        const entradas = Object.entries(mapa).sort(([a], [b]) =>
          a === META_GERAL ? -1 : b === META_GERAL ? 1 : a.localeCompare(b, "pt-BR"),
        );
        setMetas(
          await Promise.all(
            entradas.map(async ([chave, alvo]) => ({
              chave,
              alvo,
              naSemana: await blocosNaSemana(chave === META_GERAL ? null : chave).catch(() => 0),
            })),
          ),
        );
      })
      .catch(() => setMetas([]));
  }, []);

  if (!metas || metas.length === 0) return null;

  const batidas = metas.filter((m) => m.naSemana >= m.alvo).length;
  const todasBatidas = batidas === metas.length;
  const aberto = expandido || metas.length === 1;

  const barra = (m: { chave: string; alvo: number; naSemana: number }) => {
    const batida = m.naSemana >= m.alvo;
    return (
      <div key={m.chave} style={{ padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 5,
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, flex: 1 }}>{rotuloMeta(m.chave)}</span>
          <span style={{ ...mono, fontSize: 11, color: batida ? C.ok : C.sub, flexShrink: 0 }}>
            {m.naSemana}/{m.alvo} bloco{m.alvo === 1 ? "" : "s"}
            {batida ? " ✓" : ""}
          </span>
        </div>
        <div style={{ height: 5, background: C.line, borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, Math.round((m.naSemana / m.alvo) * 100))}%`,
              background: batida ? C.ok : C.caneta,
              borderRadius: 3,
              transition: "width 0.25s ease",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ ...cartao, padding: "10px 12px", marginTop: 8, marginBottom: 18 }}>
      {metas.length > 1 ? (
        <button
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            textAlign: "left",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <span style={{ ...mono, fontSize: 10, color: C.sub, letterSpacing: 0.8 }}>
            METAS SEMANAIS · {metas.length}
          </span>
          <span
            style={{
              ...mono,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: todasBatidas ? C.ok : C.sub,
              flexShrink: 0,
            }}
          >
            {batidas}/{metas.length} batida{metas.length === 1 ? "" : "s"}
            {todasBatidas ? " ✓" : ""}
            <span style={{ fontSize: 9 }}>{expandido ? "▲" : "▼"}</span>
          </span>
        </button>
      ) : (
        <span style={{ ...mono, fontSize: 10, color: C.sub, letterSpacing: 0.8 }}>
          METAS SEMANAIS
        </span>
      )}

      {aberto && <div style={{ marginTop: 8 }}>{metas.map(barra)}</div>}
    </div>
  );
}

/**
 * Aba Questões, unificada (ex-Blocos + ex-Questões, ver spec
 * docs/superpowers/specs/2026-08-30-navegacao-unificada-design.md): monta
 * bloco novo (Gerar/Do banco/Importar) e pratica o que já existe
 * (Refazer/Simulado/Blocos anteriores) num único seletor de 6 opções,
 * ícone-apenas — cabe numa pílula só sem estourar largura no mobile.
 */
export default function QuestoesTab({
  onDados,
  onAjustes,
}: {
  onDados: () => void;
  onAjustes: () => void;
}) {
  const [view, setView] = useState<ViewQuestoes>("gerar");

  useEffect(() => {
    temCredencial()
      .then((tem) => setView(escolherViewInicial(tem)))
      .catch(() => {});
  }, []);

  return (
    <Shell titulo="Questões">
      <MetasSemanais />

      <div style={{ marginBottom: 18 }}>
        <Segmented
          valor={view}
          iconeApenas
          opcoes={[
            {
              id: "gerar",
              label: "Gerar",
              icone: (cor) => <SparklesIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />,
            },
            {
              id: "banco",
              label: "Do banco",
              icone: (cor) => (
                <CircleStackIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />
              ),
            },
            {
              id: "importar",
              label: "Importar",
              icone: (cor) => (
                <ArrowUpTrayIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />
              ),
            },
            {
              id: "refazer",
              label: "Refazer",
              icone: (cor) => <ArrowPathIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />,
            },
            {
              id: "simulado",
              label: "Simulado",
              icone: (cor) => <ClockIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />,
            },
            {
              id: "blocos-anteriores",
              label: "Blocos anteriores",
              icone: (cor) => (
                <RectangleStackIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />
              ),
            },
          ]}
          onChange={setView}
        />
      </div>

      {view === "gerar" && <GerarView onDados={onDados} onAjustes={onAjustes} />}
      {view === "banco" && <GerarBancoView />}
      {view === "importar" && <ImportarView />}
      {view === "refazer" && <RefazerView />}
      {view === "simulado" && <SimuladoView />}
      {view === "blocos-anteriores" && <BlocosAnterioresView />}
    </Shell>
  );
}
```

- [ ] **Step 2: Apagar `BlocosTab.tsx`**

```bash
rm src/views/BlocosTab.tsx
```

- [ ] **Step 3: Commit**

```bash
git add -A src/views/QuestoesTab.tsx src/views/BlocosTab.tsx
git commit -m "Unifica Blocos e Questões numa aba só com 6 sub-views"
```

---

## Task 7: `App.tsx` — nova lista de abas e roteamento

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `QuestoesTab` de Task 6 (assinatura `{ onDados, onAjustes }`); `Aba` de `abas.ts` (Task 3, via `TabBar`/`NavPill` re-export).

Sem teste automatizado — composição de roteamento, verificada pelo build (Task 12) e checagem visual.

- [ ] **Step 1: Atualizar `App.tsx`**

In `src/App.tsx`:

1. Remove the `BlocosTab` import (line 6) and the `NavPill` import (line 4) — `NavPill` is desconnected per the spec, not deleted, so just stop importing/rendering it here.
2. Update line 21: `const TODAS_ABAS: Aba[] = ["questoes", "notas", "dados", "ajustes"];`
3. Update line 32: `const [aba, setAba] = useState<Aba>("questoes");`
4. Update line 38: `const [visitadas, setVisitadas] = useState<Set<Aba>>(new Set(["questoes"]));`
5. Replace the tab-rendering block (old lines 111-117):

```typescript
            {a === "questoes" && (
              <QuestoesTab onDados={() => trocar("dados")} onAjustes={() => trocar("ajustes")} />
            )}
            {a === "notas" && (
              <NotasTab ativa={aba === "notas"} onQuestoes={() => trocar("questoes")} />
            )}
```

6. Replace the final nav line (old line 145):

```typescript
      {largo ? <RailLateral aba={aba} onChange={trocar} /> : <TabBar aba={aba} onChange={trocar} />}
```

(`RailLateral` gains `aba`/`onChange` props in Task 11 — this line will not compile until Task 11 lands; that's expected mid-plan, the plan is sequential on one branch.)

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "App.tsx roteia para aba Questões unificada"
```

---

## Task 8: `TabBar.tsx` sem texto (mobile)

**Files:**
- Modify: `src/components/TabBar.tsx`

Sem teste automatizado — mudança de renderização pura (remoção de um `<span>`), sem lógica.

- [ ] **Step 1: Remover label**

Replace the `<button>` body in `src/components/TabBar.tsx` (lines 34-58) with:

```typescript
        return (
          <button
            key={a.id}
            onClick={() => onChange(a.id)}
            aria-label={a.label}
            title={a.label}
            aria-current={ativo ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {a.icone(cor, 24)}
          </button>
        );
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TabBar.tsx
git commit -m "TabBar mobile mostra só ícone, sem label"
```

---

## Task 9: `BotaoTema` e `BotaoTamanhoTexto` compartilhados

**Files:**
- Create: `src/components/BotaoTema.tsx`
- Create: `src/components/BotaoTamanhoTexto.tsx`

**Interfaces:**
- Consumes: `getTema`, `setTema`, `type Tema` de `../lib/tema` (para `BotaoTema`); `getEscala`, `setEscala`, `PROXIMA_ESCALA` de `../lib/acessibilidade` (Task 2, para `BotaoTamanhoTexto`).
- Produces: `export default function BotaoTema(): JSX.Element` e `export default function BotaoTamanhoTexto(): JSX.Element` — usados por Task 10 (`RailLateral.tsx`) e Task 11 (`Shell.tsx`).

Sem teste automatizado — JSX puro reaproveitando lógica já testada (Task 2) ou já existente (`lib/tema.ts`).

- [ ] **Step 1: Criar `BotaoTema.tsx`**

Extracted verbatim from `RailLateral.tsx` (lines 86-133), as a standalone file:

```typescript
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { C } from "../theme";
import { getTema, setTema, type Tema } from "../lib/tema";

const PROXIMO_TEMA: Record<Tema, Tema> = {
  sistema: "claro",
  claro: "escuro",
  escuro: "sistema",
};

/** Botão-ícone de tema (sol/lua), ciclo sistema → claro → escuro. Usado no
 * rail lateral (desktop, ver RailLateral.tsx) e no topo da tela no mobile
 * (ver Shell.tsx) — mesmo componente, mesmo estado persistido em
 * lib/tema.ts. */
export default function BotaoTema() {
  const [tema, setTemaLocal] = useState<Tema>("sistema");

  useEffect(() => {
    getTema().then(setTemaLocal);
  }, []);

  async function alternar() {
    const proximo = PROXIMO_TEMA[tema];
    await setTema(proximo);
    setTemaLocal(proximo);
  }

  const escuro =
    tema === "escuro" ||
    (tema === "sistema" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={alternar}
      aria-label={`Tema: ${tema}. Clique para alternar.`}
      title={`Tema: ${tema}`}
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        border: "1.5px solid transparent",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {escuro ? (
        <MoonIcon width={19} height={19} stroke={C.sub} strokeWidth={1.8} />
      ) : (
        <SunIcon width={19} height={19} stroke={C.sub} strokeWidth={1.8} />
      )}
    </button>
  );
}
```

- [ ] **Step 2: Criar `BotaoTamanhoTexto.tsx`**

```typescript
import { useEffect, useState } from "react";
import { C, mono } from "../theme";
import { getEscala, setEscala, PROXIMA_ESCALA, type Escala } from "../lib/acessibilidade";

/** Botão-ícone de tamanho de texto, ciclo 100 → 110 → 125 → 100 (ver
 * lib/acessibilidade.ts). Ícone "Aa" customizado — heroicons não tem ícone
 * de tamanho de fonte. Usado no topo da tela no mobile (ver Shell.tsx). */
export default function BotaoTamanhoTexto() {
  const [escala, setEscalaLocal] = useState<Escala>(100);

  useEffect(() => {
    getEscala().then(setEscalaLocal);
  }, []);

  async function alternar() {
    const proxima = PROXIMA_ESCALA[escala];
    await setEscala(proxima);
    setEscalaLocal(proxima);
  }

  return (
    <button
      onClick={alternar}
      aria-label={`Tamanho de texto: ${escala}%. Clique para alternar.`}
      title={`Tamanho de texto: ${escala}%`}
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        border: "1.5px solid transparent",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ ...mono, display: "flex", alignItems: "baseline", gap: 1, color: C.sub }}>
        <span style={{ fontSize: 11, fontWeight: 700 }}>A</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>A</span>
      </span>
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BotaoTema.tsx src/components/BotaoTamanhoTexto.tsx
git commit -m "Extrai BotaoTema e cria BotaoTamanhoTexto como componentes compartilhados"
```

---

## Task 10: `RailLateral.tsx` — ícones de aba + reuso de `BotaoTema`

**Files:**
- Modify: `src/components/RailLateral.tsx`

**Interfaces:**
- Consumes: `BotaoTema` de Task 9; `ABAS`, `type Aba` de `../components/abas` (Task 3).
- Produces: `export default function RailLateral({ aba, onChange }: { aba: Aba; onChange: (a: Aba) => void }): JSX.Element` — usado por Task 7 (`App.tsx`).

Sem teste automatizado — JSX puro, verificado por build + checagem visual.

- [ ] **Step 1: Reescrever `RailLateral.tsx`**

Replace the full file with:

```typescript
import { useEffect, useRef, useState } from "react";
import { CalculatorIcon, ClockIcon } from "@heroicons/react/24/outline";
import { C } from "../theme";
import { TecladoCalculadora } from "./Calculadora";
import Cronometro from "./Cronometro";
import BuscaGlobal from "./BuscaGlobal";
import BotaoTema from "./BotaoTema";
import { ABAS, type Aba } from "./abas";

export const RAIL_LARGURA = 52;
const LARGURA = RAIL_LARGURA;

/** Um ícone do rail com popover flutuante ao lado — calculadora e cronômetro
 * usam este padrão; fecha ao clicar fora ou apertar Escape. */
function ItemComPopover({
  icone,
  rotulo,
  largura,
  children,
}: {
  icone: React.ReactNode;
  rotulo: string;
  largura: number;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setAberto((a) => !a)}
        aria-label={rotulo}
        aria-expanded={aberto}
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          border: `1.5px solid ${aberto ? C.caneta : "transparent"}`,
          background: aberto ? C.canetaSoft : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icone}
      </button>
      {aberto && (
        <div
          style={{
            position: "absolute",
            left: LARGURA + 6,
            top: 0,
            width: largura,
            background: C.card,
            border: `1.5px solid ${C.line}`,
            borderRadius: 12,
            padding: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
            zIndex: 60,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Rail vertical do layout largo (ver useLayoutLargo em lib/plataforma.ts):
 * busca, abas principais, calculadora e cronômetro flutuam por cima do
 * conteúdo em vez de disputar espaço com ele. As abas principais
 * (Questões/Notas/Dados/Ajustes) migraram aqui da antiga NavPill (pílula
 * flutuante no topo) — ver spec
 * docs/superpowers/specs/2026-08-30-navegacao-unificada-design.md.
 */
export default function RailLateral({
  aba,
  onChange,
}: {
  aba: Aba;
  onChange: (a: Aba) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: LARGURA,
        borderRight: `1.5px solid ${C.line}`,
        background: C.card,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "16px 7px",
      }}
    >
      <BuscaGlobal />

      <div style={{ width: 24, height: 1.5, background: C.line, margin: "4px 0" }} />

      {ABAS.map((a) => {
        const ativo = a.id === aba;
        return (
          <button
            key={a.id}
            onClick={() => onChange(a.id)}
            aria-label={a.label}
            title={a.label}
            aria-current={ativo ? "page" : undefined}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: `1.5px solid ${ativo ? C.caneta : "transparent"}`,
              background: ativo ? C.canetaSoft : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {a.icone(ativo ? C.caneta : C.sub, 19)}
          </button>
        );
      })}

      <div style={{ width: 24, height: 1.5, background: C.line, margin: "4px 0" }} />

      <ItemComPopover
        icone={<CalculatorIcon width={19} height={19} stroke={C.sub} strokeWidth={1.8} />}
        rotulo="Calculadora"
        largura={220}
      >
        <TecladoCalculadora />
      </ItemComPopover>

      <ItemComPopover
        icone={<ClockIcon width={19} height={19} stroke={C.sub} strokeWidth={1.8} />}
        rotulo="Cronômetro"
        largura={140}
      >
        <Cronometro />
      </ItemComPopover>

      <div style={{ flex: 1 }} />

      <BotaoTema />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RailLateral.tsx
git commit -m "RailLateral ganha ícones de aba principal, migrados da NavPill"
```

---

## Task 11: `Shell.tsx` — botões tema/tamanho no header mobile

**Files:**
- Modify: `src/components/Shell.tsx`

**Interfaces:**
- Consumes: `BotaoTema`, `BotaoTamanhoTexto` de Task 9.

Sem teste automatizado — JSX puro.

- [ ] **Step 1: Atualizar `Shell.tsx`**

Add imports after line 3 (`import BuscaGlobal from "./BuscaGlobal";`):

```typescript
import BotaoTema from "./BotaoTema";
import BotaoTamanhoTexto from "./BotaoTamanhoTexto";
```

Replace the mobile header block (lines 50-54):

```typescript
        {!largo && (
          <div style={{ marginTop: 2, flexShrink: 0, display: "flex", gap: 4 }}>
            <BuscaGlobal />
            <BotaoTema />
            <BotaoTamanhoTexto />
          </div>
        )}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Shell.tsx
git commit -m "Shell mobile ganha botões de tema e tamanho de texto no header"
```

---

## Task 12: App.tsx — desconectar `NavPill`, build final

**Files:**
- Modify: `src/App.tsx` (confirmação final da Task 7 — `RailLateral` agora aceita `aba`/`onChange`, então a linha final já escrita na Task 7 compila)

- [ ] **Step 1: Rodar typecheck e build**

Run: `npm run build`
Expected: exit 0, sem erros de TypeScript. Se houver erro de import não usado (ex.: `NavPill` ainda importado em algum lugar), remover o import — `NavPill.tsx` deve ficar como arquivo órfão, sem nenhum import ativo no resto do app (confirma o "desconectado, não apagado" da spec).

- [ ] **Step 2: Rodar suíte de testes completa**

Run: `npm run test`
Expected: todos os testes passam, incluindo os novos das Tasks 1-3.

- [ ] **Step 3: Rodar dev server e checar visualmente**

Run: `npm run dev`, abrir no navegador em duas larguras (< 900px e ≥ 900px, ver `LARGURA_MINIMA` em `lib/plataforma.ts`):
- Mobile: 4 ícones sem texto na tab bar embaixo; aba Questões abre com pílula de 6 ícones; header de cada aba mostra busca+tema+tamanho à direita do título.
- Desktop: rail lateral à esquerda mostra busca, 4 ícones de aba, calculadora, cronômetro, tema (nessa ordem); nenhuma pílula flutuante no topo.

- [ ] **Step 4: Commit final (se houver ajustes)**

```bash
git add -A
git commit -m "Ajustes finais de build/typecheck da navegação unificada"
```

(Só commitar se o Step 1 ou 2 exigiu correções — se tudo passou de primeira nas tasks anteriores, não há o que commitar aqui.)

---

## Self-Review

**Cobertura da spec:**
- Item 1 (unificação Blocos+Questões, 6 sub-views, ícone-apenas) → Tasks 1, 4, 6, 7. ✓
- Item 2 (ícones na pílula de Notas) → Task 5. ✓
- Item 3 (abas no rail lateral desktop) → Tasks 10, 7. ✓
- Item 5 (mobile sem texto nas abas) → Task 8. ✓
- Item 6 (botões tema/tamanho no topo mobile) → Tasks 2, 9, 11. ✓
- "NavPill não apagado, só desconectado" → Task 7 (remove import/render) + Task 12 Step 1 (confirma órfão). ✓
- Testes essenciais da spec (3) → Tasks 1, 3, 2 respectivamente (adaptados de "testar componente renderizado" para "testar a função pura por trás", já que o projeto não roda testes de componente — ver Global Constraints). ✓

**Placeholders:** nenhum "TBD"/"depois" — toda task tem código completo. A única ressalva textual é a nota na Task 10 avisando para não deixar `ItemAba` (rascunho descartado) no arquivo final — não é um placeholder, é uma instrução negativa explícita com o código certo ao lado.

**Consistência de tipos:** `ViewQuestoes` (Task 1) usado igual em Task 6. `Aba` (Task 3, sem `"blocos"`) usado igual em Tasks 7, 8, 10. `Escala`/`PROXIMA_ESCALA` (Task 2) usado igual em Task 9. `RailLateral({ aba, onChange })` definido na Task 10 e consumido na Task 7 com os mesmos nomes de prop.
