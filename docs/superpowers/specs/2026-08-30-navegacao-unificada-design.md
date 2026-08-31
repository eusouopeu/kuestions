# Navegação unificada — Blocos+Questões, ícones, rail desktop

Sub-projeto 1 de 4 (decomposição do pedido de reorganização de UI de
2026-08-30). Cobre os itens 1, 2, 3, 5 e 6 do pedido original. Fora de
escopo aqui: botões flutuantes calculadora/temporizador (sub-projeto 2),
modelo Card/Flashcard (sub-projeto 3), view Caderno com pílula
Páginas/PDFs (sub-projeto 4).

## Motivação

- Blocos e Questões são duas abas de nível principal que, juntas, somam
  6 sub-views (Gerar, Do banco, Importar, Refazer, Simulado, Blocos
  anteriores). Unificar libera uma aba inteira na nav principal — no
  mobile isso é o que permite tirar o texto das abas sem esvaziar a
  barra.
- Nav principal com texto (`NavPill` no desktop, `TabBar` no mobile)
  ocupa espaço que, no mobile, compete com o conteúdo; no desktop, a
  pílula de abas centralizada no topo conflita com os botões
  flutuantes de calculadora/temporizador que o sub-projeto 2 vai
  colocar ali.
- Escala de texto e tema são preferências de leitura frequentes o
  bastante (provas longas, sessões de estudo) para merecer acesso de 1
  toque em toda aba mobile, não só dentro de Ajustes.

## Escopo

### 1. Unificação Blocos + Questões

- Uma aba principal só, id `questoes`, label "Questões" (rótulo já
  existente — não confundir com a antiga aba Blocos).
- Sub-view com 6 opções num `Segmented` `iconeApenas`, na ordem: Gerar,
  Do banco, Importar, Refazer, Simulado, Blocos anteriores.
- `MetasSemanais` (hoje só em `BlocosTab`) migra para o topo da aba
  unificada, antes do `Segmented`, visível em todas as 6 sub-views —
  hoje só aparecia nas 3 de Blocos.
- Regra herdada: sem credencial de API, a aba abre em "Do banco" (a
  única das 6 que funciona 100% offline sem IA). As outras 5 sub-views
  não têm essa restrição — permanecem acessíveis, só não abrem por
  padrão.
- `onDados`/`onAjustes` (navegação cruzada que `BlocosTab` expunha)
  continuam disponíveis para as sub-views que precisam (Gerar).
  `onQuestoes`, usado por `NotasTab` para voltar à prática, passa a
  apontar para a aba unificada.

### 2. Ícones na pílula de Notas

- `OPCOES_MODO` em `NotasTab.tsx` ganha `icone` por opção: Conceitos
  (`LightBulbIcon`), Caderno (`BookOpenIcon`), Mapas (`MapIcon`),
  Tarefas (`ClipboardDocumentListIcon`).
- Mantém o texto (não é `iconeApenas`) — é pílula de conteúdo dentro da
  aba, não nav principal, tem espaço de sobra.

### 3. Abas principais no rail lateral (desktop)

- `RailLateral.tsx` ganha os ícones das abas (`ABAS` de `abas.ts`) no
  topo, abaixo da busca global, cada um só ícone (sem label), ativo
  destacado do mesmo jeito que os `ItemComPopover` hoje (borda +
  fundo `canetaSoft`).
- `NavPill.tsx` para de ser renderizado em `App.tsx`. Arquivo não é
  apagado nesta rodada — o sub-projeto 2 mexe na mesma área do topo
  (botões flutuantes) e pode reaproveitar ou remover de vez; apagar
  agora arriscaria um revert desnecessário.

### 4. Mobile sem texto nas abas

- `TabBar.tsx` remove o `<span>{label}</span>` abaixo do ícone. Ícone
  cresce ligeiramente (de 22 pra ~24px) pra preencher o espaço vertical
  que o texto deixou. `aria-label` já existe e cobre acessibilidade.

### 5. Botões tema e tamanho de texto no topo mobile

- `Shell.tsx`, no header mobile (`!largo`), ao lado do botão de busca
  já existente: 2 novos botões-ícone.
  - **Tema**: reusa o ciclo `sistema → claro → escuro` de
    `RailLateral.tsx` (`BotaoTema` sai de `RailLateral` e vira
    componente compartilhado `components/BotaoTema.tsx`, importado
    nos dois lugares).
  - **Tamanho de texto**: ciclo `100 → 110 → 125 → 100`, reusando
    `lib/acessibilidade.ts` (`getEscala`/`setEscala`). Ícone "Aa"
    customizado (SVG inline com duas letras A de tamanhos diferentes)
    — heroicons não tem ícone de tamanho de fonte.
- Ordem final do header mobile: título (esquerda) — busca, tema,
  tamanho de texto (direita, nessa ordem).

## Fora de escopo (não mexer)

- Calculadora e temporizador continuam em `RailLateral` como estão
  (popover) — reposicionamento é sub-projeto 2.
- `NavPill.tsx` não é apagado, só desconectado.
- Nenhuma mudança em `lib/tema.ts` ou `lib/acessibilidade.ts` além de
  extrair `BotaoTema` para componente compartilhado — a lógica de
  ciclo e persistência já existe e é reaproveitada, não reescrita.

## Componentes e dados

| Arquivo | Mudança |
|---|---|
| `src/components/abas.ts` | `TODAS_ABAS`/`ABAS` perde `blocos`; `questoes` continua |
| `src/views/QuestoesTab.tsx` | Absorve `Segmented` de 6 opções + `MetasSemanais`; recebe `onDados`/`onAjustes` |
| `src/views/BlocosTab.tsx` | Deixa de ser roteado em `App.tsx`; conteúdo (views Gerar/Banco/Importar) vira import direto em `QuestoesTab.tsx`; arquivo removido |
| `src/components/Segmented.tsx` | Novo prop `iconeApenas?: boolean` |
| `src/views/NotasTab.tsx` | `OPCOES_MODO` ganha `icone` por item |
| `src/components/TabBar.tsx` | Remove label; ícone maior |
| `src/components/RailLateral.tsx` | Ganha ícones de abas; `BotaoTema` extraído |
| `src/components/BotaoTema.tsx` | Novo — componente compartilhado |
| `src/components/BotaoTamanhoTexto.tsx` | Novo — ciclo de escala, ícone "Aa" |
| `src/components/Shell.tsx` | Header mobile ganha os 2 botões novos |
| `src/App.tsx` | `TODAS_ABAS` atualizado; não renderiza mais `NavPill` |
| `src/components/NavPill.tsx` | Desconectado de `App.tsx`, arquivo mantido |

## Testes (2-3 essenciais, escritos antes da implementação)

1. Aba `questoes` unificada, sem credencial configurada, abre por
   padrão em "Do banco" (`view === "banco"` no estado inicial).
2. `Segmented` com `iconeApenas={true}` não renderiza texto do label no
   DOM, mas o botão mantém `aria-label`/`title` igual ao label.
3. `useLayoutLargo() === true` → `RailLateral` renderiza os 4 ícones de
   `ABAS`; `useLayoutLargo() === false` → `TabBar` renderiza ícone sem
   `<span>` de texto ao lado.

## Riscos / decisões em aberto

Nenhuma — design fechado com aprovação do usuário em chat
(2026-08-30). Nomeação da aba unificada ("Questões") e escopo dos 3
botões novos (tema, tamanho de texto, ambos reusando lógica
existente) já confirmados.
