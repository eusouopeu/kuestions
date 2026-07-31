package com.pedroteles.kumonfiscal;

import android.view.ActionMode;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Suprime a barra de seleção de texto nativa do Android/Samsung (Copiar,
    // Colar, Compartilhar…). Ela é chrome do sistema, desenhada fora da árvore
    // do DOM — nenhum z-index da WebView consegue ficar acima dela, o que fazia
    // o botão "+ Salvar nota" (SelecaoNota.tsx) ficar encoberto. A seleção de
    // texto em si continua funcionando normalmente; só o toolbar flutuante do
    // sistema some, deixando o campo livre para o toolbar próprio do app.
    @Override
    public ActionMode startActionMode(ActionMode.Callback callback) {
        return null;
    }

    @Override
    public ActionMode startActionMode(ActionMode.Callback callback, int type) {
        return null;
    }
}
