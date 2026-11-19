mod automation;
mod logstore;
mod panel;
mod pet;
mod presence;
mod sidecar;
mod tray;

use logstore::SessionRecord;
use panel::show_popover_nonactivating;
use serde_json::Value;
use tauri::{Emitter, Manager};
use tauri_plugin_shell::ShellExt;

#[cfg(target_os = "macos")]
fn set_accessory_policy() {
    use cocoa::appkit::NSApplication;
    use cocoa::appkit::NSApplicationActivationPolicy::NSApplicationActivationPolicyAccessory;
    use cocoa::base::nil;
    use objc::{msg_send, sel, sel_impl};
    unsafe {
        let app = NSApplication::sharedApplication(nil);
        let _: () = msg_send![app, setActivationPolicy: NSApplicationActivationPolicyAccessory];
    }
}

#[cfg(not(target_os = "macos"))]
fn set_accessory_policy() {}

#[tauri::command]
fn junto_sync(app: tauri::AppHandle, payload: Value) -> Result<(), String> {
    if let Some(icon) = payload.get("iconState").and_then(|v| v.as_str()) {
        let title = payload
            .get("trayTitle")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        tray::set_tray_state(&app, icon, title)?;
    }
    if payload.get("action").and_then(|v| v.as_str()) == Some("save_session") {
        if let Some(rec) = payload.get("record") {
            let record: SessionRecord =
                serde_json::from_value(rec.clone()).map_err(|e| e.to_string())?;
            logstore::append_record(record)?;
        }
    }
    if let Some(phase) = payload.get("phase").and_then(|v| v.as_str()) {
        if phase == "mid" {
            let _ = show_popover_nonactivating(&app);
        }
    }
    if payload.get("action").and_then(|v| v.as_str()) == Some("open_mic_settings") {
        let shell = app.shell();
        let _ = shell.open(
            "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Microphone",
            None,
        );
    }
    if payload.get("action").and_then(|v| v.as_str()) == Some("open_automation_settings") {
        let shell = app.shell();
        let _ = shell.open(
            "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Automation",
            None,
        );
    }
    if payload.get("action").and_then(|v| v.as_str()) == Some("olvt_restart") {
        sidecar::stop();
        let _ = sidecar::start();
    }
    if let Some(ju_state) = payload.get("juState") {
        let balloon = payload.get("juBalloon").and_then(|v| v.as_str());
        let alert = payload.get("juAlert").and_then(|v| v.as_bool()).unwrap_or(false);
        let body = serde_json::json!({
            "juState": ju_state,
            "balloon": balloon,
            "alert": alert,
        });
        let _ = pet::emit_ju_state(&app, body);
    }
    if let Some(enabled) = payload
        .get("distractionEnabled")
        .and_then(|v| v.as_bool())
    {
        pet::set_distraction_enabled(enabled)?;
    }
    Ok(())
}

#[tauri::command]
fn presence_snapshot() -> presence::PresenceSnapshot {
    presence::snapshot()
}

#[tauri::command]
fn engine_status() -> serde_json::Value {
    serde_json::json!({
        "olvt": sidecar::health_port(),
        "ollama": sidecar::ollama_health(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            junto_sync,
            presence_snapshot,
            engine_status,
            pet::ju_hit_region,
            pet::ju_pet_ready,
            pet::ju_set_size,
            pet::ju_toggle_visible,
            pet::set_distraction_enabled,
            pet::get_pet_prefs,
            automation::distraction_response,
            automation::automation_permission_hint,
        ])
        .setup(|app| {
            set_accessory_policy();
            tray::build_tray(app.handle())?;
            pet::ensure_ju_window(app.handle())?;
            pet::sync_ju_visibility_loop(app.handle().clone());
            #[cfg(target_os = "macos")]
            {
                let _ = sidecar::start();
                automation::poll_distraction(app.handle().clone());
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };
                let shortcut =
                    Shortcut::new(Some(Modifiers::ALT | Modifiers::SUPER), Code::KeyJ);
                let handle = app.handle().clone();
                app.global_shortcut().on_shortcut(shortcut, move |app, _s, event| {
                    if event.state == ShortcutState::Pressed {
                        let _ = pet::ju_toggle_visible(app.clone());
                    }
                    let _ = handle;
                })?;
            }
            let handle = app.handle().clone();
            std::thread::spawn(move || loop {
                std::thread::sleep(std::time::Duration::from_secs(2));
                let snap = presence::snapshot();
                let engine = serde_json::json!({
                    "olvt": sidecar::health_port(),
                    "ollama": sidecar::ollama_health(),
                    "loading": !sidecar::health_port(),
                    "loadPercent": if sidecar::health_port() { 100 } else { 30 },
                });
                let _ = handle.emit("junto-presence", &snap);
                let _ = handle.emit("junto-engine", &engine);
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error building tauri")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                sidecar::stop();
            }
            let _ = app_handle;
        });
}