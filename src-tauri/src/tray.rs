use crate::panel::{hide_popover, show_popover_with_focus};
use crate::pet;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

fn icon_path(state: &str) -> &'static str {
    match state {
        "session" => "icons/tray/session.png",
        "checkin" => "icons/tray/checkin.png",
        "paused" => "icons/tray/paused.png",
        "ajuste" => "icons/tray/ajuste.png",
        _ => "icons/tray/idle.png",
    }
}

pub fn build_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let path = app.path().resource_dir()?.join(icon_path("idle"));
    let icon = Image::from_path(path).unwrap_or_else(|_| {
        Image::from_bytes(include_bytes!("../icons/tray/idle.png")).expect("idle icon")
    });

    let menu = Menu::with_items(
        app,
        &[
            &MenuItem::with_id(app, "ju_s", "Ju tamanho P", true, None::<&str>)?,
            &MenuItem::with_id(app, "ju_m", "Ju tamanho M", true, None::<&str>)?,
            &MenuItem::with_id(app, "ju_l", "Ju tamanho G", true, None::<&str>)?,
            &MenuItem::with_id(app, "ju_toggle", "Mostrar/ocultar Ju (⌥⌘J)", true, None::<&str>)?,
        ],
    )?;

    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .icon_as_template(true)
        .tooltip("Junto")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "ju_s" => {
                let _ = pet::ju_set_size(app.clone(), "S".into());
            }
            "ju_m" => {
                let _ = pet::ju_set_size(app.clone(), "M".into());
            }
            "ju_l" => {
                let _ = pet::ju_set_size(app.clone(), "L".into());
            }
            "ju_toggle" => {
                let _ = pet::ju_toggle_visible(app.clone());
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("popover") {
                    if win.is_visible().unwrap_or(false) {
                        let _ = hide_popover(&win);
                    } else {
                        let _ = show_popover_with_focus(app);
                    }
                } else {
                    let _ = show_popover_with_focus(app);
                }
            }
        })
        .build(app)?;

    Ok(())
}

pub fn set_tray_state(app: &AppHandle, icon_state: &str, title: &str) -> Result<(), String> {
    let tray = app.tray_icons().into_iter().next();
    if let Some(tray) = tray {
        let path = app
            .path()
            .resource_dir()
            .map_err(|e| e.to_string())?
            .join(icon_path(icon_state));
        if let Ok(img) = Image::from_path(&path) {
            let _ = tray.set_icon(Some(img));
        }
        let _ = tray.set_icon_as_template(icon_state == "idle");
        if !title.is_empty() {
            let _ = tray.set_title(Some(title));
        } else {
            let _ = tray.set_title(None::<&str>);
        }
    }
    Ok(())
}