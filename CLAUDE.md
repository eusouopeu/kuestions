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
