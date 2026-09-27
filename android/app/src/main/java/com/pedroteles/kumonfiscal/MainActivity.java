package com.pedroteles.kumonfiscal;

import android.view.ActionMode;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.View;
import android.widget.PopupMenu;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Suprime a barra flutuante de seleção de texto nativa do Android/Samsung
    // (Copiar, Colar, Compartilhar…). Ela é chrome do sistema, desenhada fora
    // da árvore do DOM — nenhum z-index da WebView consegue ficar acima dela,
    // o que fazia o botão "+ Salvar nota" (SelecaoNota.tsx) ficar encoberto.
    //
    // A WebView pede essa barra via View.startActionMode(callback,
    // TYPE_FLOATING), que sobe até a DecorView e chega aqui em
    // onWindowStartingActionMode — sobrescrever Activity.startActionMode (a
    // tentativa anterior) não pega esse caminho. Também não dá para devolver
    // null: aí a DecorView cria a barra padrão, e se a criação falhasse o
    // Chromium limparia a seleção. Por isso devolvemos um ActionMode "mudo",
    // que existe para a WebView (a seleção continua ativa, com as alças) mas
    // não desenha nada na tela.
    @Override
    public ActionMode onWindowStartingActionMode(ActionMode.Callback callback, int type) {
        if (type != ActionMode.TYPE_FLOATING) {
            return super.onWindowStartingActionMode(callback, type);
        }
        ActionModeInvisivel modo = new ActionModeInvisivel(callback);
        callback.onCreateActionMode(modo, modo.getMenu());
        return modo;
    }

    private class ActionModeInvisivel extends ActionMode {
        private final ActionMode.Callback callback;
        private final Menu menu;
        private boolean finalizado = false;

        ActionModeInvisivel(ActionMode.Callback callback) {
            this.callback = callback;
            this.menu = new PopupMenu(MainActivity.this, getWindow().getDecorView()).getMenu();
            setType(ActionMode.TYPE_FLOATING);
        }

        @Override public void setTitle(CharSequence title) {}
        @Override public void setTitle(int resId) {}
        @Override public void setSubtitle(CharSequence subtitle) {}
        @Override public void setSubtitle(int resId) {}
        @Override public void setCustomView(View view) {}
        @Override public CharSequence getTitle() { return null; }
        @Override public CharSequence getSubtitle() { return null; }
        @Override public View getCustomView() { return null; }
        @Override public Menu getMenu() { return menu; }
        @Override public MenuInflater getMenuInflater() { return new MenuInflater(MainActivity.this); }

        @Override
        public void invalidate() {
            if (!finalizado) callback.onPrepareActionMode(this, menu);
        }

        @Override
        public void finish() {
            if (finalizado) return;
            finalizado = true;
            callback.onDestroyActionMode(this);
        }
    }
}
