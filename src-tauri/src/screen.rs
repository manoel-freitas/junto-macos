use std::sync::atomic::{AtomicBool, Ordering};

static LOCKED: AtomicBool = AtomicBool::new(false);
static PREV_LOCKED: AtomicBool = AtomicBool::new(false);

pub fn is_screen_locked() -> bool {
    LOCKED.load(Ordering::Relaxed)
}

#[cfg(target_os = "macos")]
fn query_screen_locked() -> bool {
    use std::process::Command;
    Command::new("/usr/sbin/ioreg")
        .args(["-n", "Root", "-d1", "-k", "CGSSessionScreenIsLocked"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).contains("= Yes"))
        .unwrap_or(false)
}

#[cfg(not(target_os = "macos"))]
fn query_screen_locked() -> bool {
    false
}

/// Chamar periodicamente; emite `junto-unlock` na transição bloqueado → desbloqueado.
pub fn poll_screen_lock(app: &tauri::AppHandle) {
    let locked = query_screen_locked();
    LOCKED.store(locked, Ordering::Relaxed);
    let prev = PREV_LOCKED.swap(locked, Ordering::Relaxed);
    if prev && !locked {
        let _ = app.emit("junto-unlock", ());
    }
}