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
  `simulados`. Atualmente na versão 17.
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

