use crate::pet;
use serde_json::Value;
use std::collections::HashSet;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

static DOMAIN_SINCE: Mutex<Option<(String, Instant)>> = Mutex::new(None);
static DENIED_BROWSERS: Mutex<HashSet<String>> = Mutex::new(HashSet::new());
static WARNED_DENY: Mutex<HashSet<String>> = Mutex::new(HashSet::new());

const DISTRACTION_CONTINUOUS: Duration = Duration::from_secs(180);

#[derive(Debug, Clone)]
struct TabInfo {
    browser: String,
    url: String,
}

#[cfg(target_os = "macos")]
fn active_browser_tab() -> Option<TabInfo> {
    use std::process::Command;
    for (browser, script) in [
        (
            "Chrome",
            r#"tell application "Google Chrome" to get URL of active tab of front window"#,
        ),
        (
            "Safari",
            r#"tell application "Safari" to get URL of front document"#,
        ),
    ] {
        if DENIED_BROWSERS
            .lock()
            .ok()
            .map(|s| s.contains(browser))
            .unwrap_or(false)
        {
            continue;
        }
        let out = Command::new("osascript").args(["-e", script]).output().ok()?;
        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            if stderr.contains("-1743") || stderr.contains("not allowed assistive") {
                if let Ok(mut w) = WARNED_DENY.lock() {
                    if w.insert(browser.to_string()) {
                        let _ = emit_permission_warn(browser);
                    }
                }
                if let Ok(mut d) = DENIED_BROWSERS.lock() {
                    d.insert(browser.to_string());
                }
            }
            continue;
        }
        let url = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if url.is_empty() {
            continue;
        }
        return Some(TabInfo {
            browser: browser.to_string(),
            url,
        });
    }
    None
}

#[cfg(not(target_os = "macos"))]
fn active_browser_tab() -> Option<TabInfo> {
    None
}

fn emit_permission_warn(browser: &str) -> Result<(), String> {
    use tauri::async_runtime::Handle;
    if let Ok(handle) = Handle::try_current() {
        let _ = handle.emit(
            "automation-permission",
            serde_json::json!({
                "browser": browser,
                "message": format!("Sem permissão de Automação no {browser}. O sensor de distração não vai funcionar neste navegador."),
            }),
        );
    }
    Ok(())
}

fn domain_from_url(url: &str) -> String {
    let lower = url.to_lowercase();
    if let Ok(parsed) = url::Url::parse(&lower) {
        if let Some(host) = parsed.host_str() {
            return host.strip_prefix("www.").unwrap_or(host).to_string();
        }
    }
    lower
        .split('/')
        .nth(2)
        .unwrap_or("")
        .strip_prefix("www.")
        .unwrap_or("")
        .to_string()
}

fn matches_distraction(url: &str) -> bool {
    let u = url.to_lowercase();
    const PATS: &[&str] = &[
        "youtube.com/shorts",
        "instagram.com/reel",
        "tiktok.com",
        "twitter.com",
        "x.com",
        "facebook.com",
        "reddit.com",
        "netflix.com",
        "twitch.tv",
    ];
    PATS.iter().any(|p| u.contains(p))
}

pub fn poll_distraction(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(15));
        let prefs = pet::load_prefs();
        if !prefs.distraction_enabled {
            continue;
        }
        let Some(tab) = active_browser_tab() else {
            if let Ok(mut g) = DOMAIN_SINCE.lock() {
                *g = None;
            }
            continue;
        };
        if !matches_distraction(&tab.url) {
            if let Ok(mut g) = DOMAIN_SINCE.lock() {
                *g = None;
            }
            continue;
        }
        let domain = domain_from_url(&tab.url);
        let now = Instant::now();
        let should_fire = {
            let mut guard = DOMAIN_SINCE.lock().ok();
            let Some(ref mut slot) = guard else {
                continue;
            };
            match slot.as_ref() {
                Some((d, since)) if d == &domain => {
                    if now.duration_since(*since) >= DISTRACTION_CONTINUOUS {
                        *slot = None;
                        true
                    } else {
                        false
                    }
                }
                _ => {
                    *slot = Some((domain.clone(), now));
                    false
                }
            }
        };
        if should_fire {
            let meta = if domain.contains("short") || domain.contains("tiktok") {
                "scroll"
            } else {
                "isso"
            };
            let payload = serde_json::json!({ "meta": meta });
            let _ = app.emit("distraction-detected", &payload);
            let _ = app.emit_to("ju", "distraction-detected", payload.clone());
            let _ = pet::emit_ju_state(
                &app,
                serde_json::json!({
                    "juState": "calling",
                    "alert": true,
                    "balloon": format!("Ainda em {meta}?"),
                }),
            );
        }
    });
}

#[tauri::command]
pub fn distraction_response(
    app: AppHandle,
    choice: String,
) -> Result<(), String> {
    let _payload = match choice.as_str() {
        "pause" => Value::String("pause".into()),
        "back" => Value::String("back".into()),
        _ => Value::Null,
    };
    let _ = app.emit("ju-action", serde_json::json!({ "distraction": choice }));
    Ok(())
}

#[tauri::command]
pub fn automation_permission_hint(browser: String) -> Result<Value, String> {
    Ok(serde_json::json!({
        "browser": browser,
        "denied": DENIED_BROWSERS.lock().map(|s| s.contains(&browser)).unwrap_or(false),
    }))
}