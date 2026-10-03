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

## Padrões compartilhados

Este projeto segue os padrões comuns aos apps do Pedro, documentados em
`../_shared/tech-standards.md` (stack, testes, commit/push/release, skill
`/caveman` obrigatória, subagentes, leitura de dependências) e
`../_shared/design-standards.md` + `../_shared/minimalismo.md` (visual,
ícones, estética minimalista, "ajuda recolhida"). As seções abaixo cobrem só o
que é específico deste projeto.

### Particularidades deste projeto

- Ícones: já usa **Heroicons** (`@heroicons/react`) em todo o app
  (`QuestaoCard`, `Rail`, `Calculadora` etc.) — alinhado ao padrão
  compartilhado, não precisa migrar.
- Estilização real: apesar do padrão compartilhado ser Tailwind CSS, este
  projeto usa **inline styles via `theme.ts`** em todo lugar — divergência
  conhecida e aceita por ora; não introduzir Tailwind no meio do código atual
  sem migração explícita.
- "Ajuda recolhida": este projeto já é a referência do padrão — `Cartao`
  (`src/views/DadosTab.tsx`) esconde a explicação (`ajuda`) atrás de um botão
  `QuestionMarkCircleIcon`, só visível sob toque. Reaproveitar esse mesmo
  padrão para qualquer funcionalidade nova que precise de explicação.

## Schema SQLite

- `SCHEMA_VERSION` em `src/lib/db.ts` precisa ser bumpada para o `version` mais alto de
  `MIGRATIONS` (`src/lib/migrations.ts`) toda vez que uma migração nova é adicionada —
  `migrate()` sai cedo (`if (atual >= SCHEMA_VERSION) return`) sem rodar nada além disso.
  `SCHEMA_VERSION` estava presa em 15 com `MIGRATIONS` já em 16 (a migração de `pdfs.pasta` nunca
  rodava em quem já tinha o banco na versão 15); corrigido para 17 junto da migração da tabela
  `simulados`. Atualmente na versão 20 (migração 20: `questoes_respondidas.causa_erro`, ver "Ritmo,
  prova, causa do erro…" abaixo; migração 19: `banco_hash`/`enunciado_editado` em
  `questoes_respondidas`, ver "Banco de questões" abaixo; migração 18: `questoes_respondidas.facilidade`, fator de
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
- Tutor da questão (`perguntarSobreQuestao`, `src/lib/anthropic.ts`; UI em
  `components/TutorQuestao.tsx`): botão-ícone de balão na barra de ações do `QuestaoCard`, em
  todo drill que usa o card (Gerar, Do banco, Importar, revisão — Simulado não usa o card).
  Antes de revelar (`respondida: false`) o prompt não leva gabarito nem comentário e proíbe dizer
  qual alternativa está certa; depois de revelar, o mesmo histórico segue com o gabarito. Teto de
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

## Revisão: embaralhar, slider, pular e corrigir enunciado

- `FilaRevisaoDrill` passa `embaralhar` ao `QuestaoCard`: a ordem das alternativas de múltipla
  escolha é embaralhada (`ordemEmbaralhada`, `src/lib/embaralhar.ts`) com o gabarito sempre saindo
  da letra original. É só exibição — internamente as letras seguem as originais (`onResponder`,
  explicações gravadas e gabarito não mudam); o prefixo "A) " do texto é reescrito com a letra
  exibida (`rotularAlternativa`) e o gabarito/rótulos das explicações usam `letraExibida`. CE
  nunca embaralha.
- Revisão agora usa o slider de confiança (`pedirConfianca` padrão) só como gesto de envio — a
  confiança recebida é ignorada pelos handlers (`registrarRevisao` usa a confiança ORIGINAL).
- Pular na revisão (`onPular={onProxima}`) avança sem gravar nada: caixa de Leitner inalterada.
- Lápis (corrigir enunciado) e pular ficam na barra de rodapé do `QuestaoCard`, à direita; a
  prop `acoesExtras` ocupa o resto da linha (na revisão, o botão "Tirar dúvida" do tutor, que
  `FilaRevisaoDrill` passa por ali em vez de renderizar abaixo do card).
- Botão-ícone de lápis no `QuestaoCard` corrige o enunciado em qualquer drill. Com linha já gravada
  (`origemId`) persiste na hora via `atualizarEnunciadoRespondida`; na primeira resposta de um
  bloco a correção fica local e é persistida logo após `onResponder` devolver o id. Só altera
  `questoes_respondidas`, não o JSON do banco fixo.
- Bloco padrão: `Q_POR_BLOCO = 10` (`src/lib/constants.ts`), usado como padrão de GerarView,
  GerarBancoView e da pré-geração; `tamanhosSubs` reparte em [3, 3, 2, 2].

## Menu nativo de seleção de texto (Android)

- `MainActivity.onWindowStartingActionMode` devolve, para `TYPE_FLOATING`, um `ActionMode` "mudo"
  (sem UI) — a seleção continua ativa, mas a barra Copiar/Compartilhar do sistema não aparece por
  cima do botão "+ Salvar nota" (`SelecaoNota`). Sobrescrever `Activity.startActionMode` (tentativa
  anterior) não interceptava o pedido da WebView. Não devolver `null` ali: a DecorView criaria a
  barra padrão. No iOS continua só o `WebkitTouchCallout: none` do card.

## Banco de questões (`banco/`)

- `banco/` é o antigo projeto separado de extração de provas, incorporado com o histórico (um
  commit por prova, via subtree merge). `banco/kuestion_db_1.json` é a **única** fonte do banco
  fixo: `lib/banco.ts` importa esse arquivo direto (não existe mais `src/data/banco_questoes.json`),
  então qualquer mudança nele entra no próximo build/APK sem cópia manual.
- Ao extrair/incorporar/editar questões, seguir `banco/CLAUDE.md` (formatação do enunciado) e
  `banco/instrucoes/` (README primeiro), conferindo `banco/historico.md`/`banco/steps.md`. Scripts em
  `banco/provas_sefaz_auditor_fiscal/_scripts/` (`merge.py` grava em `banco/kuestion_db_1.json`);
  PDFs e imagens de página ficam fora do git (`banco/.gitignore`). Mudança no JSON conta como
  mudança do app: vale o fluxo commit/push/APK do topo deste arquivo.
- Sincronização com questões já respondidas (`lib/sincronizarBanco.ts`, chamada no boot em
  `App.tsx`): cada linha de `questoes_respondidas` guarda cópia de enunciado/alternativas/gabarito;
  quando o hash do JSON (`__BANCO_VERSAO__`, calculado em `vite.config.ts`) difere do gravado em
  Preferences, reaplica o conteúdo do banco às linhas com `banco_id`. Só essas três colunas (+
  `banco_hash`/`enunciado_editado`) mudam — `acertou`, `resposta`, caixa de Leitner, datas,
  facilidade, tempo e confiança nunca, então estatísticas e agenda de revisão ficam intactas.
  Enunciado corrigido pelo lápis (`enunciado_editado = 1`) vence o do banco; linha anterior à
  migração 19 com texto divergente em alguma palavra é tratada como corrigida pelo
  usuário (diferença só de espaços/quebras de linha = formatação do banco, atualiza). Gabarito/alternativas
  alterados apagam o cache `explicacoes_banco` daquela questão (o `comentario` já gravado na linha
  fica).

## Aulas e blocos por matéria (tópico específico da geração por IA)

- `TOPICOS_POR_MATERIA`/`TITULOS_BLOCO_POR_MATERIA` em `src/lib/topicos.ts`: lista fixa de
  aulas/blocos por matéria, extraída da coluna "#"/"Tarefas" dos planos de estudo
  (`banco/Planos de estudo/*.md` — linhas do tipo `Aula`, ignorando
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

## Definir termo e marcar questão como errada

- `SelecaoNota` (menu flutuante da seleção de texto) ganhou, ao lado de "+ Salvar nota", um
  botão-ícone `LightBulbIcon` "Definir": chama `definirTermo` (`lib/anthropic.ts`, effort low, usa o
  enunciado como contexto) e mostra a definição numa folha inferior com dois botões-ícone —
  `BookmarkIcon` salva como nota (`"termo :: definição"`, tag do bloco) e `XMarkIcon` descarta sem
  gravar nada.
- `QuestaoCard`: botão-ícone `ExclamationTriangleIcon` ao lado de editar/pular (só antes de revelar,
  em questão do banco ou com linha gravada). Marca a questão como inviável (`lib/questoesInviaveis.ts`,
  `@capacitor/preferences`, carregado no boot em `App.tsx`; `questoesFiltradas` em `banco.ts` a exclui
  de sorteio/contagem), reporta se já houver linha (`reportarQuestao`, motivo "enunciado") e pula.
  Não altera o JSON do banco nem cria linha em `questoes_respondidas`.

## Ritmo, prova, causa do erro, banca, bloco do dia e caderno de erros

- Contas puras em `lib/ritmo.ts` (`calcularRitmo`, `projetarAteProva`, `alocacaoVsEdital`), testadas
  em `lib/ritmo.test.ts` junto com `lib/blocoMisto.ts`. Datas "AAAA-MM-DD" UTC, mesma convenção de
  `atividadePorDia`.
- Card "Ritmo/ano" (aba Dados): últimos 7 dias × 365/7, seta ↑/↓ com a variação contra os 7 dias
  anteriores. Cartão "Até a prova": data e meta opcional em Ajustes → Prova (`lib/prova.ts`,
  Preferences); sem meta, o alvo são as inéditas do banco. Sem data, vira um link para Ajustes.
- "Tempo × edital (30 dias)": fatia das questões por matéria vs. fatia do peso do edital; universo =
  `areasBanco()` + matérias praticadas. Só na visão "Todas as matérias".
- Causa do erro (`lib/causaErro.ts`): botão-ícone `TagIcon` na barra de ações do `QuestaoCard`, só
  depois de errar e com linha gravada; grava em `causa_erro` (tocar a mesma causa limpa). Cartão
  "Causas do erro" na aba Dados.
- Banca: o JSON do banco não tem banca — `lib/bancas.ts` mapeia `instituicao + ano` → banca
  (conferido nos PDFs). Prova nova entra como "Banca não identificada" até ganhar linha no mapa;
  SEFAZ-PA 2021 não tem a banca na capa.
- Bloco do dia (`lib/blocoMisto.ts`): opção especial no dropdown "Área" de `GerarBancoView`; reparte
  as questões entre áreas por peso do edital × fraqueza (prior de Laplace) e intercala (round-robin).
  A linha de `blocos` usa `MATERIA_MISTA`; cada resposta grava a área real. `materiasComDados` ignora
  `MATERIA_MISTA`.
- Notas ↔ questão: `QuestaoCard` lista as notas da questão sob o selo "📝" (toque abre) e vincula
  (`vincularNotasAQuestao`) as notas salvas antes da primeira resposta, quando ainda não havia id.
  `RevisaoNotas` mostra "Ver questão de origem" depois de revelar (reusa `QuestaoOrigem` de `NotaCard`).
- Caderno de erros (`lib/cadernoErros.ts`, jsPDF, Helvetica/Latin-1 — símbolos fora disso são
  trocados em `limpar`): cartão no fim da aba Dados, respeita o filtro de matéria, período escolhido no
  cartão. Figuras vêm de `lib/figuras.ts` (glob de `banco/imagens`, compartilhado com `TextoQuestao`).

## Tamanho do texto, formato, bloco rápido e rascunho (Do banco)

- Seletor "Tamanho do texto" em `GerarBancoView` (Qualquer / Curto ≤ 600 / Curtíssimo ≤ 350
  caracteres, `TAMANHOS_TEXTO` em `lib/banco.ts`): vira `maxCaracteres` no `FiltroBanco` e vale
  também para o bloco do dia. `caracteresDeLeitura` soma texto de apoio + enunciado + alternativas
  (espaços colapsados); figura (`![`) ou tabela (`<table`) = Infinity, nunca entra. Não muda o
  tópico gravado nem reseta ao trocar de área.
- `caracteresDaQuestao` (mesma conta para uma `Questao` do app, texto de apoio via `bancoId`) alimenta
  a revisão "só curtas" (botão-ícone de raio no painel "vence hoje", `RevisaoDiariaView soCurtas`,
  teto `TETO_CURTO`) e o cartão "Acerto por tamanho do texto" da aba Dados
  (`respostasComTexto` + `agruparPorTamanho` em `useDadosAgregados`).
- Bloco com teto de texto (e revisão só curtas) passa `explicacaoEnxuta` ao `QuestaoCard`: depois
  de revelar, só a primeira frase do comentário (`primeiraFrase`, `lib/texto.ts`) e "Ver explicação
  completa".
- Seletor "Formato" (Todos / Múltipla escolha / Certo/Errado) no mesmo lugar: `formato` no
  `FiltroBanco`, também no bloco do dia.
- Rascunho do bloco do banco (`lib/blocoBancoRascunho.ts`, um só, chave própria em Preferences):
  gravado a cada lote/resposta; aviso "Bloco em andamento" em Do banco com Continuar/Descartar
  (descartar fecha a linha de `blocos` com o que foi respondido). Questão já respondida não volta:
  o rascunho guarda `qIdx + 1` quando o gabarito da atual já foi revelado.
- Bloco rápido (`lib/blocoRapido.ts`): 5 questões até `TETO_CURTISSIMO` de várias áreas
  (`selecionarMisto` com `filtroRapido`), explicação enxuta. O PRÓXIMO fica preparado em
  Preferences (ids) com as explicações já no cache `explicacoes_banco` — feito ao abrir Do banco
  com rede e o toggle de explicações ligado — para abrir completo offline. Sem rede, falha de
  `gerarExplicacoes` não trava mais o bloco (segue sem explicação nova).
- Atalho do ícone no Android (toque longo → "Bloco rápido"): `res/xml/shortcuts.xml` + meta-data
  no `MainActivity` do manifest, URL `kuestions://bloco-rapido`, lida em `lib/atalhos.ts`
  (`getLaunchUrl` + `appUrlOpen`, chamado no boot em `App.tsx`). QuestoesTab troca para Do banco e
  GerarBancoView consome o pedido.

## Voz e tempo de prova

- Leitura em voz alta (`lib/acessibilidade.ts`): no app nativo usa
  `@capacitor-community/text-to-speech` (v6, Capacitor 7) — a WebView do Android expõe
  `speechSynthesis` sem vozes e ficava muda; no navegador segue a Web Speech API. Lê também o texto
  de apoio. Rodar `npx cap sync` depois de puxar.
- Tempo por questão na prova: Ajustes → Prova (`minutosPorQuestao` em `lib/prova.ts`, padrão
  `MINUTOS_POR_QUESTAO_PADRAO` = 3). Comparado ao tempo médio no cartão "Tempo médio por questão"
  (Dados; marca vertical por matéria) e no resultado do bloco do banco.
