# Instruções para Claude neste projeto

## Commit, push e APK automáticos

Sempre que uma mudança for implementada no código do app (qualquer alteração
em `src/`, `android/` fora dos diretórios de build, `capacitor.config.ts`,
`proxy/` etc.), ao final da tarefa faça automaticamente, sem precisar que o
usuário peça de novo:

1. **Commit** das mudanças relevantes, com mensagem descrevendo o que mudou
   (seguir o estilo dos commits já existentes no repositório — mensagens em
   português, resumindo as funcionalidades/correções).
2. **Push** para `origin/main`.
3. **Gerar o APK atualizado**:
   ```bash
   npm run build
   npx cap sync android
   cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew assembleDebug
   ```
   O APK fica em `android/app/build/outputs/apk/debug/app-debug.apk`. Envie o
   arquivo ao usuário ao final (ex.: via SendUserFile), não só avise que foi
   gerado.

Só pule esse fluxo se o usuário pedir explicitamente para não commitar/subir,
ou se a mudança for puramente exploratória (sem edição de arquivo) — nesse
caso não há o que commitar.

### Nota sobre o JDK

Este ambiente tem Java 17 como padrão do sistema (`/usr/libexec/java_home`),
mas o Capacitor 7 (`@capacitor/android`) exige **Java 21** para compilar
(`sourceCompatibility JavaVersion.VERSION_21` no `capacitor-android/build.gradle`).
Um JDK 21 já está instalado via Homebrew em
`/opt/homebrew/opt/openjdk@21` (formula `openjdk@21`, keg-only — não symlinkado
no `java_home` do sistema). Não é preciso `sudo` nem reinstalar nada: basta
exportar `JAVA_HOME=/opt/homebrew/opt/openjdk@21` antes de rodar `gradlew`.
Se esse caminho não existir mais neste Mac, rode `brew install openjdk@21` (não
exige sudo; o symlink em `/Library/Java/JavaVirtualMachines` sugerido pelo
Homebrew é opcional e não é necessário para este fluxo).

## Backend/infra

- `git remote origin` aponta para `https://github.com/eusouopeu/kuestions.git`,
  branch `main`. Nunca force-push nem reescreva histórico sem pedido explícito.
- O diretório `docs/` na raiz é conteúdo pré-existente do usuário, não gerado
  por sessões de código — não mexer nele a menos que pedido.

## Skill obrigatória

SEMPRE usar a skill `/caveman` (modo de comunicação ultra-comprimido) em toda resposta neste projeto.


## Padrões técnicos e visuais obrigatórios

- Sempre usar **TypeScript**, **Tailwind CSS**, ícones **Lucide** e fonte **Montserrat** com
  espaçamento entrelinhas (line-height) de 1.5.
- Dar preferência a **botões-ícone** em vez de botões com texto.
- Exceção já consolidada no código: ícones usam **`@heroicons/react`**, não Lucide — todo o app já
  usa Heroicons (`QuestaoCard`, `Rail`, `Calculadora`, etc.); manter esse pacote em vez de
  misturar duas bibliotecas de ícone no mesmo projeto. Estilo (inline styles via `theme.ts`, não
  Tailwind) segue o mesmo raciocínio — o projeto não usa classes Tailwind em lugar nenhum.

## Testes

- Por rodada de alterações, realizar apenas os **2 ou 3 testes mais essenciais** — não mais que isso.
- Esses testes devem ser **elaborados ANTES** da implementação das mudanças de código, para que não
  sejam enviesados pelo resultado da implementação.


## Commit, push e atualização do CLAUDE.md

- A cada rodada em que o código do app/site for alterado, deve ser feito o **commit** e o **push**
  para o repositório remoto no GitHub.
- Nessa mesma rodada, atualizar o conteúdo deste **CLAUDE.md** no que couber (novas convenções,
  decisões, mudanças de stack, etc.), mantendo-o coerente com o estado atual do projeto.

## Proibição de leitura de dependências

- NUNCA ler arquivos de dependências (ex.: `node_modules/`, `dist/`, `build/`, pastas de vendor
  ou qualquer artefato gerado/instalado) para obter contexto. Usar apenas o código-fonte do
  próprio projeto.

## Schema SQLite

- `SCHEMA_VERSION` em `src/lib/db.ts` precisa ser bumpada para o `version` mais alto de
  `MIGRATIONS` (`src/lib/migrations.ts`) toda vez que uma migração nova é adicionada —
  `migrate()` sai cedo (`if (atual >= SCHEMA_VERSION) return`) sem rodar nada além disso.
  `SCHEMA_VERSION` estava presa em 15 com `MIGRATIONS` já em 16 (a migração de `pdfs.pasta` nunca
  rodava em quem já tinha o banco na versão 15); corrigido para 17 junto da migração da tabela
  `simulados`. Atualmente na versão 18 (migração 18: `questoes_respondidas.facilidade`, fator de
  facilidade por questão — ver `lib/repo/leitner.ts` — e tabela `blocos_pendentes`, fila de blocos
  pré-gerados em segundo plano — ver `lib/preGeracao.ts`).
- `@capacitor/local-notifications` foi adicionado (lembrete diário de revisão, ver
  `src/lib/lembretes.ts`) — rodar `npx cap sync android`/`ios` depois de puxar essa mudança.

## Ícone do app

- Fonte: `resources/icon-foreground.png` (RGBA, com transparência) + fundo sólido branco
  (`resources/icon-background.png`/`.svg`, `#FFFFFF`). `resources/icon.png` e os PNGs em
  `android/app/src/main/res/mipmap-*/` (`ic_launcher.png`, `ic_launcher_round.png`,
  `ic_launcher_background.png`) e `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
  são gerados compondo o foreground sobre esse fundo branco com PIL (`Image.alpha_composite`), um por
  densidade — não existe `@capacitor/assets`/`cordova-res` instalado no projeto, a composição é
  manual. `android/app/src/main/res/drawable/ic_launcher_background.xml` (vetor com grade teal) é
  vestígio do template padrão do Capacitor e não é referenciado por `ic_launcher.xml`/`_round.xml`
  (que apontam para `@mipmap/ic_launcher_background`, o PNG) — não precisa mexer nele.
- Ao trocar o ícone de novo: regenerar todas as densidades acima a partir do novo foreground/fundo,
  não só um arquivo — um mipmap desatualizado aparece como ícone errado só em certas resoluções de
  tela.

## Revisão e repetição espaçada (Leitner)

- `INTERVALOS_LEITNER_DIAS`/`CAIXA_MAX_ERRO_PERIGOSO` em `src/lib/repo/leitner.ts` — compartilhado
  entre questões (`registrarRevisao`, `src/lib/repo/questoes.ts`) e notas (`registrarRevisaoNota`,
  `src/lib/repo/notas.ts`).
- `registrarRevisao(id, acertou, tempoMs?)` modula o avanço de caixa por tempo e confiança: lento
  (tempo > 2× a média geral) não avança; acerto original com confiança "certeza" (e não perigoso)
  avança 2 caixas; caso comum avança 1. Todo call-site que chama `registrarRevisao` deve repassar o
  `tempoMs` que vem de `onResponder` (terceiro parâmetro) — sem isso a modulação por lentidão nunca
  dispara.
- Fila unificada "vence hoje" (questões pendentes + notas pendentes numa sequência só) vive em
  `src/views/RevisaoDiariaView.tsx`, entrada pelo painel no topo de `QuestoesTab.tsx`. `Refazer`
  (questões) e `Notas → Revisão` continuam existindo como entradas separadas — a fila unificada é um
  atalho, não substitui as duas.
- Tutor da questão (`perguntarSobreQuestao`, `src/lib/anthropic.ts`) só aparece dentro de
  `FilaRevisaoDrill.tsx` (Refazer, Blocos anteriores, fila unificada) — nunca ao responder pela
  primeira vez (Gerar/Do banco/Importar/Simulado usam `QuestaoCard` direto). Teto de
  `MAX_PERGUNTAS_TUTOR` (3) perguntas por questão, e bloqueado se o teto mensal de custo já
  estourou (`situacaoTeto`).
- Selo de pendências no ícone da aba Questões (`src/lib/badgePendencias.ts`, opcional, padrão
  desligado, toggle em Ajustes → Geração) soma `contarQuestoesPendentes()` +
  `contarNotasPendentes(null)`. Recalculado em `App.tsx` a cada troca de aba — inclusive a
  preferência `badgeAtivo` em si, porque é a única forma de captar o toggle feito em Ajustes sem um
  canal de estado dedicado entre as duas telas.
- Dedupe na importação (`enunciadosExistentes`/`normalizarEnunciado`, `src/lib/repo/questoes.ts`):
  checagem por enunciado normalizado (trim + minúsculas + espaços colapsados), só avisa, não
  bloqueia — usado em `ImportarView.tsx` antes de `iniciarBlocoReal`.

## Aulas e blocos por matéria (tópico específico da geração por IA)

- `TOPICOS_POR_MATERIA`/`TITULOS_BLOCO_POR_MATERIA` em `src/lib/topicos.ts`: lista fixa de
  aulas/blocos por matéria, extraída da coluna "#"/"Tarefas" dos planos de estudo
  (`Bancos de dados/Planos de estudo/*.md`, fora do repo — linhas do tipo `Aula`, ignorando
  `Questões`/`simulado`). Alimenta o dropdown "Tópico específico" (aula específica/bloco de
  aulas) em `GerarView.tsx`; matéria sem entrada aqui continua com o campo de texto livre.
- Cada matéria é declarada em `DEFINICOES_MATERIA` como lista de blocos (`{ titulo, aulas: string[] }`,
  na ordem do plano) — o código de cada aula (`"<bloco>.<aula>"`, ex. `"2.3"`) é gerado a partir da
  posição, não copiado do "#" bruto do plano (que numera Aula/Questões juntas e varia de fonte).
  A chave de cada matéria tem que bater exatamente com uma entrada de `MATERIAS`
  (`src/lib/constants.ts`) — não com o nome da área homônima no banco de questões
  (`AREAS_BANCO`/`src/data/banco_questoes.json`), que é um universo separado (ex.: matéria
  `"Informática"` aqui vs. área `"Noções de Informática"` no banco).
- Padrão de rótulo (`rotuloTopico`/`rotuloBloco`, únicas funções que devem formatar isso — não
  reimplementar noutro lugar): aula = `"[<código>] <nome>"` (ex. `"[1.2] Elasticidades"`); bloco =
  `"[<número>] <título> (<n> aulas)"` (ex. `"[2] Balanço Patrimonial (BP) (8 aulas)"`). O valor
  salvo em `Config.topico`/`questoes_respondidas.topico` continua vindo de `descricaoBloco`
  (texto livre pro prompt), que também ganhou o título do bloco.
- Título de bloco, quando a matéria tem banco de questões real cobrindo a mesma área (Direito
  Administrativo, Direito Constitucional, Direito Tributário, Estatística, Economia, Finanças
  Públicas, Matemática Financeira, Auditoria, Contabilidade Geral, Contabilidade Pública, Informática):
  usar o mesmo texto do campo `bloco` de `banco_questoes.json` pra aquele grupo de aulas — mesma
  fonte (Estratégia Concursos, curso SEFAZ-BA), evita nome divergente pro mesmo bloco em dois
  lugares do app. Bloco sem cobertura no banco (ex. Direito Administrativo Bloco 8, legislação
  estadual da Bahia) tem título inventado, comentado como tal no código.

## Matéria sugerida (padrão sutil de dropdown) e áreas ocultas do banco

- `lib/materiaSugerida.ts` (`escolherMateriaSugerida`) sorteia 1 entre as 5 matérias/áreas com
  menos questões respondidas (`materiasMenosRespondidas`, `lib/repo/questoes.ts`, baseada em
  `contarTodasPorMateria` — só conta blocos de verdade, `bloco_id IS NOT NULL`, então não conta
  Simulado). Usado como valor **padrão** de matéria (GerarView) e área (GerarBancoView) ao abrir a
  tela — sutil: não é um seletor visível, só troca o item pré-selecionado do dropdown; o usuário
  pode trocar normalmente. Candidata sem nenhuma resposta ainda conta como 0 (fica entre as
  piores). GerarBancoView aplica o sorteio só sobre `areasBanco()` (já filtrada, ver abaixo).
- `lib/banco.ts`: `AREAS_OCULTAS` remove do dropdown "Área" de GerarBancoView (via `areasBanco()`)
  as áreas do banco fora do núcleo de auditor fiscal estadual: "Administração Pública",
  "Administração Geral e Pública" (duas variantes de rótulo pra área equivalente na fonte),
  "Direito Civil e Empresarial", "Direito Penal", "Direito Previdenciário", "Língua Inglesa". Só oculta do
  dropdown — a questão continua em `BANCO`/`POR_ID` e abre normalmente se reaberta via
  Refazer/Blocos anteriores/Simulado (não quebra histórico já respondido dessas áreas antes do
  filtro existir). `MATERIAS` (`lib/constants.ts`, tab Gerar por IA) já não tinha nenhuma dessas
  matérias — não precisou de filtro equivalente lá.


## Importação de notas do Prova do Crime

- `lib/importarNotas.ts` (`lerNotasImportadas`/`importarNotas`): importa `{ origem, caso, notas: [{ materia, corpo, tag }] }`, formato exportado pelo app Prova do Crime (`/Users/pedro/Codigos/Apps/Prova do crime`, `lib/caso/exportacao.ts`). `corpo` precisa de `::` (flashcard básico). Botão-ícone em Notas, ao lado da exportação CSV. Mudou o formato de um lado → mudar do outro.

## Layout preservado do enunciado

- Enunciado, texto de apoio e alternativas do banco real trazem quebras de linha
  significativas (itens "I., II., III.", linhas de tabela): 686 das 2.440 questões de
  `src/data/banco_questoes.json` têm `\n` no enunciado e 166 nas alternativas. Render em
  tela cheia usa `textoPreservado` (`whiteSpace: "pre-wrap"`, `src/theme.ts`) +
  `normalizarLayoutTexto` (`src/lib/texto.ts`, só tira espaço em fim de linha, pontas e
  colapsa 3+ linhas em branco em duas — recuo no começo da linha é preservado):
  `QuestaoCard`, `ResumoQuestaoRespondida`, `Opcao`, `SimuladoView`.
- Prévias recortadas em 2 linhas (busca global, `RelatorioSimulado`, lista de revisão do
  simulado quando recolhida) usam `resumirEmLinha` — com as quebras preservadas o recorte
  mostraria só a primeira linha de uma tabela em vez do começo da pergunta. Ao expandir
  (`aberta`), volta a `pre-wrap` + `normalizarLayoutTexto`.

## Barra superior, calculadora e encerramento de bloco

- O header do `Shell` (`src/components/Shell.tsx`) é `position: sticky; top: 0` com fundo
  `C.paper` e margem/padding laterais negativos para cobrir a largura toda ao rolar — título da
  aba, busca, tema e as ferramentas (calculadora/cronômetro) seguem acessíveis no meio de uma
  questão longa.
- Calculadora (`src/components/Calculadora.tsx`): duas linhas apenas — campo de entrada
  (`<input inputMode="text">`, teclado virtual nativo; o motor em `lib/calculadora.ts` já aceita
  `*`, `/`, `,`, `%`, `×`, `÷`) e linha de resultado. O teclado próprio de 20 teclas foi removido
  (ocupava metade da tela do celular). A expressão vive em `src/lib/calculadoraEstado.ts`, fora do
  componente, para sobreviver ao fechar/reabrir; o popover da calculadora é `semifixo`
  (`FerramentasFlutuantes.tsx`) — só fecha pelo próprio botão-ícone, clique fora não derruba.
- Encerrar bloco / pular questão: o X do `Rail` encerra o bloco onde estiver e `onPular` do
  `QuestaoCard` (botão-ícone `ForwardIcon`, só antes de revelar) pula a questão. Em ambos os
  casos **nada é gravado** para as questões não respondidas — antes o abandono as inseria com
  `resposta = ''`, o que as jogava em "Refazer" e nas estatísticas sem nunca terem sido lidas.
  Sem linha gravada, elas não contam em estatística, não entram na fila de revisão e continuam
  inéditas para novos blocos (inclusive `idsBancoRespondidos`, que alimenta `vistas` no banco).
- Cada view do drill (`GerarView`, `GerarBancoView`, `ImportarView`) mantém um contador
  `respondidas`; ao fechar, `atualizarTotalQuestoesBloco` ajusta `total_questoes` para esse número
  e `aprovadoNoBloco(acertos, respondidas)` (`lib/blocoUtils.ts`) decide a aprovação — senão um
  bloco encerrado na 5ª de 12 apareceria como 4/12 na aba Dados. `blocoRascunho` guarda
  `respondidas` (opcional; rascunho antigo cai em `qIdx`).
- `questoesNaoRespondidas` (blocoUtils) foi removida junto com o antigo abandono.

## Explicação dos cartões da aba Dados

- `Cartao` (`src/views/DadosTab.tsx`) tem duas props de texto distintas: `legenda` (dado dinâmico
  sempre visível, ex. contagem de tópicos em "Cobertura de tópicos") e `ajuda` (explicação do que o
  cartão mostra). `ajuda` fica recolhida atrás de um botão-ícone `QuestionMarkCircleIcon` no
  extremo direito da linha do título; o toque abre uma caixinha no fluxo do cartão (empurra o
  conteúdo, não é popover/popup/overlay) e o segundo toque fecha. Explicação nova de cartão vai em
  `ajuda`, não em `legenda`.
