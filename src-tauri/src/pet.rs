use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HitRegion {
    pub x_pct: f64,
    pub y_pct: f64,
    pub w_pct: f64,
    pub h_pct: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PetPrefs {
    pub size: u32,
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub distraction_enabled: bool,
    pub visible: bool,
    #[serde(default)]
    pub ju_muted_until: Option<i64>,
}

impl Default for PetPrefs {
    fn default() -> Self {
        Self {
            size: 128,
            x: None,
            y: None,
            distraction_enabled: false,
            visible: true,
        }
    }
}

static PREFS: Mutex<Option<PetPrefs>> = Mutex::new(None);
static ALERT_QUEUE: Mutex<Vec<serde_json::Value>> = Mutex::new(Vec::new());

fn support_dir() -> PathBuf {
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home).join("Library/Application Support/com.manoelfreitas.junto");
        }
    }
    PathBuf::from("run")
}

fn prefs_path() -> PathBuf {
    support_dir().join("pet.json")
}

pub fn load_prefs() -> PetPrefs {
    let path = prefs_path();
    if let Ok(raw) = fs::read_to_string(&path) {
        if let Ok(p) = serde_json::from_str(&raw) {
            return p;
        }
    }
    PetPrefs::default()
}

pub fn save_prefs(p: &PetPrefs) -> Result<(), String> {
    let path = prefs_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, serde_json::to_string_pretty(p).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}

pub fn size_px(label: &str) -> u32 {
    match label {
        "S" => 96,
        "L" => 160,
        _ => 128,
    }
}

pub fn ensure_ju_window(app: &AppHandle) -> Result<(), String> {
    if app.get_webview_window("ju").is_some() {
        return Ok(());
    }
  let prefs = load_prefs();
    let size = prefs.size;
    let url = if cfg!(debug_assertions) {
        tauri::WebviewUrl::External(
            tauri::Url::parse("http://localhost:1420/pet.html").map_err(|e| e.to_string())?,
        )
    } else {
        tauri::WebviewUrl::App("pet.html".into())
    };
    let _win = WebviewWindow::builder(app, "ju", url)
        .title("Ju")
        .inner_size(size as f64, size as f64)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .visible(prefs.visible)
        .focused(false)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(target_os = "macos")]
pub fn apply_click_through(win: &WebviewWindow, _ignore: bool) {
    let _ = win.set_ignore_cursor_events(true);
}

#[cfg(not(target_os = "macos"))]
pub fn apply_click_through(_win: &WebviewWindow, _ignore: bool) {}

#[tauri::command]
pub fn ju_hit_region(
    app: AppHandle,
    region: HitRegion,
) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("ju") {
        #[cfg(target_os = "macos")]
        {
            let _ = region;
            apply_click_through(&win, true);
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = region;
            apply_click_through(&win, true);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn ju_pet_ready(app: AppHandle) -> Result<(), String> {
    let prefs = load_prefs();
    if let Some(win) = app.get_webview_window("ju") {
        apply_click_through(&win, true);
        let _ = win.emit("ju-visibility", serde_json::json!({ "visible": prefs.visible }));
        flush_alert_queue(&app)?;
    }
    Ok(())
}

#[tauri::command]
pub fn ju_set_size(app: AppHandle, size: String) -> Result<(), String> {
    let px = size_px(&size);
    let mut prefs = load_prefs();
    prefs.size = px;
    save_prefs(&prefs)?;
    if let Some(win) = app.get_webview_window("ju") {
        let _ = win.set_size(tauri::PhysicalSize::new(px, px));
    }
    Ok(())
}

#[tauri::command]
pub fn ju_toggle_visible(app: AppHandle) -> Result<(), String> {
    let mut prefs = load_prefs();
    prefs.visible = !prefs.visible;
    save_prefs(&prefs)?;
    if let Some(win) = app.get_webview_window("ju") {
        if prefs.visible {
            let _ = win.show();
        } else {
            let _ = win.hide();
        }
        let _ = win.emit("ju-visibility", serde_json::json!({ "visible": prefs.visible }));
    }
    Ok(())
}

pub fn emit_ju_state(app: &AppHandle, payload: serde_json::Value) -> Result<(), String> {
    let hide = should_hide_ju(app);
    if hide {
        if let Some(win) = app.get_webview_window("ju") {
            let _ = win.hide();
        }
        if payload.get("alert").and_then(|v| v.as_bool()) == Some(true) {
            let mut q = ALERT_QUEUE.lock().map_err(|e| e.to_string())?;
            q.push(payload);
        }
        return Ok(());
    }
    if let Some(win) = app.get_webview_window("ju") {
        let _ = win.show();
        let _ = win.emit("ju-state", payload);
    }
    Ok(())
}

fn flush_alert_queue(app: &AppHandle) -> Result<(), String> {
    let mut q = ALERT_QUEUE.lock().map_err(|e| e.to_string())?;
    let items: Vec<_> = q.drain(..).collect();
    drop(q);
    for payload in items {
        let _ = emit_ju_state(app, payload);
    }
    Ok(())
}

pub fn ju_mute_hours(app: &AppHandle, hours: f64) -> Result<(), String> {
    let until = chrono::Utc::now().timestamp_millis() + (hours * 3_600_000.0) as i64;
    let mut prefs = load_prefs();
    prefs.ju_muted_until = Some(until);
    save_prefs(&prefs)?;
    let _ = app.emit(
        "ju-mute",
        serde_json::json!({ "until": until }),
    );
    Ok(())
}

#[tauri::command]
pub fn ju_mute_status() -> Result<Option<i64>, String> {
    Ok(load_prefs().ju_muted_until)
}

fn ju_is_muted() -> bool {
    if let Some(until) = load_prefs().ju_muted_until {
        return chrono::Utc::now().timestamp_millis() < until;
    }
    false
}

fn should_hide_ju(app: &AppHandle) -> bool {
    let snap = crate::presence::snapshot();
    if snap.meeting || snap.fullscreen || ju_is_muted() {
        return true;
    }
    #[cfg(target_os = "macos")]
    {
        if let Some(win) = app.get_webview_window("popover") {
            if win.is_fullscreen().unwrap_or(false) {
                return true;
            }
        }
        if let Some(win) = app.get_webview_window("ju") {
            if win.is_fullscreen().unwrap_or(false) {
                return true;
            }
        }
    }
    false
}

pub fn sync_ju_visibility_loop(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(std::time::Duration::from_secs(2));
        let prefs = load_prefs();
        if !prefs.visible {
            continue;
        }
        let hide = should_hide_ju(&app);
        if let Some(win) = app.get_webview_window("ju") {
            if hide {
                let _ = win.hide();
            } else {
                let _ = win.show();
                let _ = flush_alert_queue(&app);
            }
        }
    });
}

#[tauri::command]
pub fn set_distraction_enabled(enabled: bool) -> Result<(), String> {
    let mut prefs = load_prefs();
    prefs.distraction_enabled = enabled;
    save_prefs(&prefs)
}

#[tauri::command]
pub fn get_pet_prefs() -> Result<PetPrefs, String> {
    Ok(load_prefs())
}