use tauri::{AppHandle, Manager, WebviewWindow};

/// Mostra o popover sem forçar foco (check-in automático).
pub fn show_popover_nonactivating(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("popover")
        .ok_or("janela popover ausente")?;
    window.show().map_err(|e| e.to_string())?;
    #[cfg(target_os = "macos")]
    {
        let _ = window.set_focus(false);
    }
    Ok(())
}

/// Clique no ícone da barra: permite foco para teclado.
pub fn show_popover_with_focus(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("popover")
        .ok_or("janela popover ausente")?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus(true).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn hide_popover(window: &WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}