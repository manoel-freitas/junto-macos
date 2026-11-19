use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionRecord {
    pub goal: String,
    pub duration_label: String,
    pub started_at: String,
    pub ended_at: String,
    pub focus_ms: u64,
    pub outcome: Option<String>,
    pub active_app: String,
}

fn log_path() -> PathBuf {
    support_log_dir().join("sessions.json")
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DistractionDay {
    pub date: String,
    pub total_ms: u64,
}

fn distraction_log_path() -> PathBuf {
    support_log_dir().join("distraction_log.json")
}

fn support_log_dir() -> PathBuf {
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home)
                .join("Library/Application Support/com.manoelfreitas.junto");
        }
    }
    PathBuf::from("run")
}

pub fn add_distraction_ms(ms: u64) -> Result<(), String> {
    let path = distraction_log_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let mut list: Vec<DistractionDay> = if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&raw).unwrap_or_default()
    } else {
        Vec::new()
    };
    if let Some(row) = list.iter_mut().find(|r| r.date == today) {
        row.total_ms += ms;
    } else {
        list.push(DistractionDay {
            date: today,
            total_ms: ms,
        });
    }
    fs::write(&path, serde_json::to_string_pretty(&list).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}

pub fn append_record(record: SessionRecord) -> Result<(), String> {
    let path = log_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let mut list: Vec<SessionRecord> = if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&raw).unwrap_or_default()
    } else {
        Vec::new()
    };
    list.push(record);
    fs::write(&path, serde_json::to_string_pretty(&list).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}