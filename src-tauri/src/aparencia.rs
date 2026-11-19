use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

use crate::sidecar;

static DOWNLOAD_CANCEL: AtomicBool = AtomicBool::new(false);
static PREVIEW_GEN: Mutex<u64> = Mutex::new(0);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GestureRefJson {
    pub group: String,
    pub index: u32,
    pub file: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledModel {
    pub olvt_name: String,
    pub model3: String,
    pub no_recolor: bool,
    pub gestures: HashMap<String, Option<GestureRefJson>>,
    #[serde(default)]
    pub model_dict: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AparenciaFile {
    pub active_id: String,
    #[serde(default)]
    pub license_accepted: Vec<String>,
    #[serde(default)]
    pub installed: HashMap<String, InstalledModel>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AparenciaStatus {
    pub active_id: String,
    pub installed: Vec<InstalledRow>,
    pub license_accepted: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledRow {
    pub id: String,
    #[serde(flatten)]
    pub model: InstalledModel,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitPayload {
    pub id: String,
    pub olvt_name: String,
    pub no_recolor: bool,
    pub model3_relative: String,
    pub gestures: HashMap<String, Option<GestureRefJson>>,
    pub model_dict: Value,
    pub persist_active: bool,
    #[serde(default)]
    pub license_accepted: Vec<String>,
}

fn repo_root() -> PathBuf {
    sidecar::repo_root()
}

fn vendor_root() -> PathBuf {
    repo_root().join("vendor/Open-LLM-VTuber")
}

pub fn aparencia_path() -> PathBuf {
    if let Ok(p) = std::env::var("JUNTO_APARENCIA") {
        return PathBuf::from(p);
    }
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home)
                .join("Library/Application Support/com.manoelfreitas.junto/aparencia.json");
        }
    }
    repo_root().join("run/aparencia.json")
}

fn load_aparencia() -> AparenciaFile {
    let path = aparencia_path();
    if !path.exists() {
        return default_aparencia();
    }
    let raw = fs::read_to_string(&path).unwrap_or_default();
    serde_json::from_str(&raw).unwrap_or_else(|_| default_aparencia())
}

fn default_aparencia() -> AparenciaFile {
    let mut installed = HashMap::new();
    if model3_exists("mao", "mao_pro") {
        installed.insert(
            "mao".into(),
            InstalledModel {
                olvt_name: "mao_pro".into(),
                model3: "live2d-models/mao_pro/runtime/mao_pro.model3.json".into(),
                no_recolor: false,
                gestures: HashMap::new(),
                model_dict: Value::Null,
            },
        );
    }
    AparenciaFile {
        active_id: "mao".into(),
        license_accepted: vec![],
        installed,
    }
}

fn model3_exists(id: &str, olvt_name: &str) -> bool {
    let p = vendor_root().join(format!(
        "live2d-models/{olvt_name}/runtime/{stem}.model3.json",
        stem = if olvt_name == "shizuku" {
            "shizuku".into()
        } else if olvt_name == "mao_pro" {
            "mao_pro".into()
        } else {
            olvt_name.to_string()
        }
    ));
    if p.is_file() {
        return true;
    }
    let alt = vendor_root().join(format!("live2d-models/{olvt_name}/{olvt_name}.model3.json"));
    alt.is_file() || scan_installed(id).is_some()
}

fn scan_installed(id: &str) -> Option<PathBuf> {
    let olvt = catalog_olvt_name(id)?;
    let base = vendor_root().join("live2d-models").join(&olvt);
    find_model3(&base).map(|p| p.strip_prefix(vendor_root()).unwrap().to_path_buf())
}

fn catalog_olvt_name(id: &str) -> Option<&'static str> {
    zip_meta(id).map(|z| z.olvt_name)
}

struct ZipMeta {
    olvt_name: &'static str,
    zip_url: Option<&'static str>,
}

const CATALOG_IDS: &[&str] = &[
    "mao", "hiyori", "haru", "haru_greeter", "kei", "rice", "miara", "epsilon", "shizuku",
    "hibiki", "izumi", "ren", "jin", "chitose", "gantzert", "miku", "tsumiki", "wanko",
    "tororo", "koharu", "nito", "mark", "unity", "zundamon",
];

fn zip_meta(id: &str) -> Option<ZipMeta> {
    Some(match id {
        "mao" => ZipMeta { olvt_name: "mao_pro", zip_url: None },
        "hiyori" => ZipMeta { olvt_name: "hiyori", zip_url: Some("https://cubism.live2d.com/sample-data/bin/hiyori/hiyori_en.zip") },
        "haru" => ZipMeta { olvt_name: "haru", zip_url: Some("https://cubism.live2d.com/sample-data/bin/haru/haru_ja.zip") },
        "haru_greeter" => ZipMeta { olvt_name: "haru_greeter", zip_url: Some("https://cubism.live2d.com/sample-data/bin/haru_greeter/haru_greeter_ja.zip") },
        "kei" => ZipMeta { olvt_name: "kei", zip_url: Some("https://cubism.live2d.com/sample-data/bin/kei/kei_en.zip") },
        "rice" => ZipMeta { olvt_name: "rice", zip_url: Some("https://cubism.live2d.com/sample-data/bin/rice/rice_en.zip") },
        "miara" => ZipMeta { olvt_name: "miara", zip_url: Some("https://cubism.live2d.com/sample-data/bin/miara/miara_en.zip") },
        "epsilon" => ZipMeta { olvt_name: "epsilon", zip_url: Some("https://cubism.live2d.com/sample-data/bin/epsilon/epsilon_ja.zip") },
        "shizuku" => ZipMeta { olvt_name: "shizuku", zip_url: Some("https://cubism.live2d.com/sample-data/bin/shizuku/shizuku_ja.zip") },
        "hibiki" => ZipMeta { olvt_name: "hibiki", zip_url: Some("https://cubism.live2d.com/sample-data/bin/hibiki/hibiki_ja.zip") },
        "izumi" => ZipMeta { olvt_name: "izumi", zip_url: Some("https://cubism.live2d.com/sample-data/bin/izumi/izumi_ja.zip") },
        "ren" => ZipMeta { olvt_name: "ren", zip_url: Some("https://cubism.live2d.com/sample-data/bin/ren/ren_en.zip") },
        "jin" => ZipMeta { olvt_name: "jin", zip_url: Some("https://cubism.live2d.com/sample-data/bin/natori/natori_en.zip") },
        "chitose" => ZipMeta { olvt_name: "chitose", zip_url: Some("https://cubism.live2d.com/sample-data/bin/chitose/chitose_ja.zip") },
        "gantzert" => ZipMeta { olvt_name: "gantzert", zip_url: Some("https://cubism.live2d.com/sample-data/bin/gantzert_felixander/gantzert_felixander_ja.zip") },
        "miku" => ZipMeta { olvt_name: "miku", zip_url: Some("https://cubism.live2d.com/sample-data/bin/miku/miku_ja.zip") },
        "tsumiki" => ZipMeta { olvt_name: "tsumiki", zip_url: Some("https://cubism.live2d.com/sample-data/bin/tsumiki/tsumiki_ja.zip") },
        "wanko" => ZipMeta { olvt_name: "wanko", zip_url: Some("https://cubism.live2d.com/sample-data/bin/wanko/wanko_ja.zip") },
        "tororo" => ZipMeta { olvt_name: "tororo", zip_url: Some("https://cubism.live2d.com/sample-data/bin/tororo_hijiki/tororo_hijiki_ja.zip") },
        "koharu" => ZipMeta { olvt_name: "koharu", zip_url: Some("https://cubism.live2d.com/sample-data/bin/koharu_haruto/koharu_haruto_ja.zip") },
        "nito" => ZipMeta { olvt_name: "nito", zip_url: Some("https://cubism.live2d.com/sample-data/bin/nito/nito_ja.zip") },
        "mark" => ZipMeta { olvt_name: "mark", zip_url: Some("https://cubism.live2d.com/sample-data/bin/mark/mark_en.zip") },
        "unity" => ZipMeta { olvt_name: "unity", zip_url: Some("https://cubism.live2d.com/sample-data/bin/unitychan/unitychan_ja.zip") },
        "zundamon" => ZipMeta { olvt_name: "zundamon", zip_url: Some("https://cubism.live2d.com/sample-data/bin/zundamon/zundamon_ja.zip") },
        _ => return None,
    })
}

pub fn find_model3_in_tree(root: &Path) -> Option<PathBuf> {
    find_model3(root)
}

fn find_model3(root: &Path) -> Option<PathBuf> {
    if !root.exists() {
        return None;
    }
    let mut candidates: Vec<PathBuf> = Vec::new();
    walk_model3(root, &mut candidates);
    if candidates.is_empty() {
        return None;
    }
    candidates.sort_by_key(|p| {
        let s = p.to_string_lossy();
        let not_runtime = !s.contains("/runtime/");
        (not_runtime, s.len())
    });
    Some(candidates[0].clone())
}

fn walk_model3(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(read) = fs::read_dir(dir) else {
        return;
    };
    for ent in read.flatten() {
        let path = ent.path();
        if path.is_dir() {
            walk_model3(&path, out);
        } else if path
            .file_name()
            .and_then(|n| n.to_str())
            .is_some_and(|n| n.ends_with(".model3.json"))
        {
            out.push(path);
        }
    }
}

pub fn validate_model3_json(raw: &str, model3_path: &Path) -> Result<Value, String> {
    let v: Value = serde_json::from_str(raw).map_err(|e| e.to_string())?;
    let moc = v
        .pointer("/FileReferences/Moc")
        .and_then(|x| x.as_str())
        .ok_or("model3 sem FileReferences.Moc")?;
    let moc_path = model3_path.parent().unwrap_or(Path::new("")).join(moc);
    if !moc_path.is_file() {
        return Err(format!("moc ausente: {}", moc_path.display()));
    }
    Ok(v)
}

pub fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let tmp = path.with_extension("tmp");
    fs::write(&tmp, bytes).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())
}

fn upsert_model_dict(entry: &Value) -> Result<(), String> {
    let dict_path = vendor_root().join("model_dict.json");
    let list: Vec<Value> = if dict_path.exists() {
        serde_json::from_str(&fs::read_to_string(&dict_path).unwrap_or_default())
            .unwrap_or_default()
    } else {
        vec![]
    };
    let name = entry
        .get("name")
        .and_then(|v| v.as_str())
        .ok_or("model_dict entry sem name")?;
    let mut out: Vec<Value> = list.into_iter().filter(|e| e.get("name") != Some(&Value::String(name.into()))).collect();
    out.push(entry.clone());
    let bytes = serde_json::to_vec_pretty(&out).map_err(|e| e.to_string())?;
    atomic_write(&dict_path, &bytes)
}

fn save_aparencia(data: &AparenciaFile) -> Result<(), String> {
    let bytes = serde_json::to_vec_pretty(data).map_err(|e| e.to_string())?;
    atomic_write(&aparencia_path(), &bytes)
}

fn post_live2d_switch(model_name: &str) -> Result<(), String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| e.to_string())?;
    let res = client
        .post("http://127.0.0.1:12393/junto/live2d")
        .json(&serde_json::json!({ "modelName": model_name }))
        .send()
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("OLVT respondeu {}", res.status()));
    }
    Ok(())
}

fn safe_zip_path(name: &str) -> bool {
    let p = Path::new(name);
    !name.contains("..")
        && p.components()
            .all(|c| !matches!(c, Component::ParentDir | Component::RootDir | Component::Prefix(_)))
}

#[tauri::command]
pub fn aparencia_status() -> Result<AparenciaStatus, String> {
    let mut file = load_aparencia();
    for id in CATALOG_IDS {
        if file.installed.contains_key(*id) {
            continue;
        }
        if let Some(rel) = scan_installed(id) {
            let meta = zip_meta(id).unwrap();
            file.installed.insert(
                (*id).into(),
                InstalledModel {
                    olvt_name: meta.olvt_name.into(),
                    model3: rel.to_string_lossy().replace('\\', "/"),
                    no_recolor: matches!(*id, "jin" | "tsumiki"),
                    gestures: HashMap::new(),
                    model_dict: Value::Null,
                },
            );
        }
    }
    let installed: Vec<InstalledRow> = file
        .installed
        .iter()
        .map(|(id, model)| InstalledRow {
            id: id.clone(),
            model: model.clone(),
        })
        .collect();
    Ok(AparenciaStatus {
        active_id: file.active_id,
        installed,
        license_accepted: file.license_accepted,
    })
}

#[tauri::command]
pub fn aparencia_read_model3(id: String) -> Result<Value, String> {
    let file = load_aparencia();
    let rel = file
        .installed
        .get(&id)
        .map(|m| m.model3.clone())
        .or_else(|| scan_installed(&id).map(|p| p.to_string_lossy().replace('\\', "/")))
        .ok_or("modelo não instalado")?;
    let path = vendor_root().join(&rel);
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    validate_model3_json(&raw, &path)?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn aparencia_cancel() -> Result<(), String> {
    DOWNLOAD_CANCEL.store(true, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub fn aparencia_install(app: AppHandle, id: String) -> Result<(), String> {
    let meta = zip_meta(id.as_str()).ok_or("id desconhecido")?;
    if meta.zip_url.is_none() {
        if let Some(rel) = scan_installed(&id) {
            let _ = app.emit(
                "aparencia-done",
                serde_json::json!({
                    "id": id,
                    "ok": true,
                    "model3": rel.to_string_lossy().replace('\\', "/"),
                    "reason": null
                }),
            );
            return Ok(());
        }
        return Err("Mao já vem no app".into());
    }
    let zip_url = meta.zip_url.unwrap().to_string();
    let olvt_name = meta.olvt_name.to_string();
    DOWNLOAD_CANCEL.store(false, Ordering::SeqCst);
    let app2 = app.clone();
    std::thread::spawn(move || {
        let result = download_and_extract(&app2, &id, &zip_url, &olvt_name);
        let _ = app2.emit("aparencia-done", result);
    });
    Ok(())
}

fn download_and_extract(
    app: &AppHandle,
    id: &str,
    zip_url: &str,
    olvt_name: &str,
) -> Value {
    let vendor = vendor_root();
    let models = vendor.join("live2d-models");
    let partial = models.join(format!(".partial-{id}-{}", uuid_simple()));
    let _ = fs::remove_dir_all(&partial);
    let _ = fs::create_dir_all(&partial);

    let cleanup = || {
        let _ = fs::remove_dir_all(&partial);
    };

    if scan_installed(id).is_some() && !zip_url.is_empty() {
        if let Some(rel) = scan_installed(id) {
            cleanup();
            return serde_json::json!({
                "id": id,
                "ok": true,
                "model3": rel.to_string_lossy().replace('\\', "/"),
                "reason": null
            });
        }
    }

    let client = match reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            cleanup();
            return fail_payload(id, &e.to_string());
        }
    };

    let mut resp = match client.get(zip_url).send() {
        Ok(r) => r,
        Err(e) => {
            cleanup();
            return fail_payload(id, &e.to_string());
        }
    };
    if !resp.status().is_success() {
        cleanup();
        return fail_payload(id, &format!("HTTP {}", resp.status()));
    }
    let total = resp.content_length().unwrap_or(0);
    let zip_path = partial.join("pacote.zip");
    let mut file = match fs::File::create(&zip_path) {
        Ok(f) => f,
        Err(e) => {
            cleanup();
            return fail_payload(id, &e.to_string());
        }
    };
    let mut received: u64 = 0;
  let mut buf = [0u8; 65536];
    loop {
        if DOWNLOAD_CANCEL.load(Ordering::SeqCst) {
            cleanup();
            return fail_payload(id, "cancelado");
        }
        let n = match resp.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => n,
            Err(e) => {
                cleanup();
                return fail_payload(id, &e.to_string());
            }
        };
        if file.write_all(&buf[..n]).is_err() {
            cleanup();
            return fail_payload(id, "falha ao gravar zip");
        }
        received += n as u64;
        let _ = app.emit(
            "aparencia-progress",
            serde_json::json!({ "id": id, "received": received, "total": total }),
        );
    }

    if let Err(e) = extract_zip(&zip_path, &partial) {
        cleanup();
        return fail_payload(id, &e);
    }

    let model3 = match find_model3(&partial) {
        Some(p) => p,
        None => {
            cleanup();
            return fail_payload(id, "model3.json não encontrado");
        }
    };
    let raw = match fs::read_to_string(&model3) {
        Ok(s) => s,
        Err(e) => {
            cleanup();
            return fail_payload(id, &e.to_string());
        }
    };
    if let Err(e) = validate_model3_json(&raw, &model3) {
        cleanup();
        return fail_payload(id, &e);
    }

    let dest = models.join(olvt_name);
    let bak = models.join(format!(".bak-{olvt_name}"));
    let _ = fs::remove_dir_all(&bak);
    if dest.exists() {
        if fs::rename(&dest, &bak).is_err() {
            cleanup();
            return fail_payload(id, "não foi possível fazer backup do modelo anterior");
        }
    }

    let publish_ok = publish_extracted(&partial, &dest, &model3);
    if publish_ok.is_err() {
        let _ = fs::remove_dir_all(&dest);
        if bak.exists() {
            let _ = fs::rename(&bak, &dest);
        }
        cleanup();
        return fail_payload(id, &publish_ok.unwrap_err());
    }
    cleanup();
    let _ = fs::remove_dir_all(&bak);

    let final_model3 = find_model3(&dest).unwrap_or(model3);
    let rel = final_model3
        .strip_prefix(&vendor)
        .unwrap_or(&final_model3)
        .to_string_lossy()
        .replace('\\', "/");

    serde_json::json!({
        "id": id,
        "ok": true,
        "model3": rel,
        "model3Json": serde_json::from_str::<Value>(&raw).unwrap_or(Value::Null),
        "reason": null
    })
}

fn publish_extracted(partial: &Path, dest: &Path, model3: &Path) -> Result<(), String> {
    if let Ok(entries) = fs::read_dir(partial) {
        let mut dirs: Vec<PathBuf> = Vec::new();
        let mut files: Vec<PathBuf> = Vec::new();
        for ent in entries.flatten() {
            let p = ent.path();
            if p.file_name().and_then(|n| n.to_str()) == Some("pacote.zip") {
                continue;
            }
            if p.is_dir() {
                dirs.push(p);
            } else if p.is_file() {
                files.push(p);
            }
        }
        if dirs.len() == 1 && files.is_empty() {
            fs::rename(&dirs[0], dest).map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    fs::rename(partial, dest).or_else(|_| {
        fs::create_dir_all(dest).map_err(|e| e.to_string())?;
        copy_dir(partial, dest)
    })
}

fn copy_dir(from: &Path, to: &Path) -> Result<(), String> {
    for ent in fs::read_dir(from).map_err(|e| e.to_string())?.flatten() {
        let dest = to.join(ent.file_name());
        if ent.path().is_dir() {
            fs::create_dir_all(&dest).map_err(|e| e.to_string())?;
            copy_dir(&ent.path(), &dest)?;
        } else {
            fs::copy(ent.path(), &dest).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn extract_zip(zip_path: &Path, dest: &Path) -> Result<(), String> {
    let file = fs::File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        let mut f = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = f.name().to_string();
        if !safe_zip_path(&name) {
            return Err("entrada zip insegura".into());
        }
        let out = dest.join(&name);
        if name.ends_with('/') {
            fs::create_dir_all(&out).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = out.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut outfile = fs::File::create(&out).map_err(|e| e.to_string())?;
            std::io::copy(&mut f, &mut outfile).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn fail_payload(id: &str, reason: &str) -> Value {
    serde_json::json!({
        "id": id,
        "ok": false,
        "reason": reason
    })
}

fn uuid_simple() -> String {
    format!("{:x}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos())
}

#[tauri::command]
pub fn aparencia_commit(app: AppHandle, payload: CommitPayload) -> Result<(), String> {
    let prev = load_aparencia();
    let prev_active = prev.active_id.clone();
    let mut file = prev;
    upsert_model_dict(&payload.model_dict)?;
    let gestures: HashMap<String, Option<GestureRefJson>> = payload.gestures;
    file.installed.insert(
        payload.id.clone(),
        InstalledModel {
            olvt_name: payload.olvt_name.clone(),
            model3: payload.model3_relative.clone(),
            no_recolor: payload.no_recolor,
            gestures,
            model_dict: payload.model_dict.clone(),
        },
    );
    for lic in &payload.license_accepted {
        if !file.license_accepted.contains(lic) {
            file.license_accepted.push(lic.clone());
        }
    }
    if payload.persist_active {
        file.active_id = payload.id.clone();
    }
    save_aparencia(&file)?;

    if let Err(e) = post_live2d_switch(&payload.olvt_name) {
        if payload.persist_active {
            file.active_id = prev_active;
            save_aparencia(&file)?;
        }
        return Err(e);
    }
    let _ = app.emit(
        "ju-live2d-reload",
        serde_json::json!({ "noRecolor": payload.no_recolor }),
    );
    if payload.persist_active {
        let _ = app.emit(
            "ju-appearance",
            serde_json::json!({ "activeId": payload.id, "noRecolor": payload.no_recolor }),
        );
    }
    Ok(())
}

#[tauri::command]
pub fn aparencia_preview(app: AppHandle, payload: CommitPayload) -> Result<(), String> {
    let prev = load_aparencia();
    let restore_id = prev.active_id.clone();
    let restore = prev.installed.get(&restore_id).cloned();
    let gen = {
        let mut g = PREVIEW_GEN.lock().map_err(|_| "lock")?;
        *g += 1;
        *g
    };
    let mut preview = payload;
    preview.persist_active = false;
    aparencia_commit(app.clone(), preview)?;
    let app2 = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(10));
        let cur = PREVIEW_GEN.lock().ok().map(|g| *g).unwrap_or(gen);
        if cur != gen {
            return;
        }
        let Some(inst) = restore else {
            return;
        };
        let _ = post_live2d_switch(&inst.olvt_name);
        let _ = app2.emit(
            "ju-live2d-reload",
            serde_json::json!({ "noRecolor": inst.no_recolor }),
        );
    });
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn find_model3_prefers_runtime() {
        let base = std::env::temp_dir().join(format!("junto-model3-{}", uuid_simple()));
        let _ = fs::remove_dir_all(&base);
        let runtime = base.join("runtime");
        fs::create_dir_all(&runtime).unwrap();
        fs::write(runtime.join("a.model3.json"), "{}").unwrap();
        fs::write(base.join("b.model3.json"), "{}").unwrap();
        let found = find_model3_in_tree(&base).unwrap();
        assert!(found.to_string_lossy().contains("runtime"));
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn safe_zip_rejects_parent() {
        assert!(!safe_zip_path("../etc/passwd"));
        assert!(safe_zip_path("foo/bar.model3.json"));
    }

    #[test]
    fn validate_model3_needs_moc() {
        let dir = std::env::temp_dir().join(format!("junto-v3-{}", uuid_simple()));
        let _ = fs::create_dir_all(&dir);
        let m3 = dir.join("x.model3.json");
        fs::write(&m3, r#"{"FileReferences":{"Moc":"missing.moc3"}}"#).unwrap();
        assert!(validate_model3_json(&fs::read_to_string(&m3).unwrap(), &m3).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn atomic_write_roundtrip() {
        let path = std::env::temp_dir().join(format!("junto-aw-{}.json", uuid_simple()));
        atomic_write(&path, b"{}").unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), "{}");
        let _ = fs::remove_file(&path);
    }
}