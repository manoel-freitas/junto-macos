use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

static SIDECAR: Mutex<Option<Child>> = Mutex::new(None);

pub fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("parent")
        .to_path_buf()
}

pub fn start() -> Result<(), String> {
    let script = repo_root().join("scripts/olvt.sh");
    if !script.exists() {
        return Err("scripts/olvt.sh não encontrado".into());
    }
    let child = Command::new("bash")
        .arg(script)
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("falha ao subir OLVT: {e}"))?;
    *SIDECAR.lock().map_err(|_| "lock")? = Some(child);
    Ok(())
}

pub fn stop() {
    if let Ok(mut guard) = SIDECAR.lock() {
        if let Some(mut child) = guard.take() {
            let _ = child.kill();
        }
    }
}

pub fn health_port() -> bool {
    use std::net::TcpStream;
    TcpStream::connect("127.0.0.1:12393").is_ok()
}

pub fn ollama_health() -> bool {
    use std::net::TcpStream;
    TcpStream::connect("127.0.0.1:11434").is_ok()
}