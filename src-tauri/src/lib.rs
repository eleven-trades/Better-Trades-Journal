use std::{env, fs, io::{Read, Write}, path::PathBuf, process::Command};
use flate2::{Compression, read::GzDecoder, write::GzEncoder};
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Mt5SyncResult {
  found: bool,
  path: String,
  content: String,
  modified_at: Option<u64>,
}

fn mt5_export_path() -> Result<PathBuf, String> {
  let roaming = env::var_os("APPDATA").ok_or("Windows APPDATA is unavailable")?;
  Ok(PathBuf::from(roaming)
    .join("MetaQuotes")
    .join("Terminal")
    .join("Common")
    .join("Files")
    .join("BETTERTRADES")
    .join("closed_trades.csv"))
}

#[tauri::command]
fn sync_mt5() -> Result<Mt5SyncResult, String> {
  let path = mt5_export_path()?;
  if !path.exists() {
    return Ok(Mt5SyncResult {
      found: false,
      path: path.to_string_lossy().into_owned(),
      content: String::new(),
      modified_at: None,
    });
  }
  let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
  let modified_at = metadata.modified().ok()
    .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
    .map(|duration| duration.as_secs());
  Ok(Mt5SyncResult {
    found: true,
    path: path.to_string_lossy().into_owned(),
    content: fs::read_to_string(&path).map_err(|e| e.to_string())?,
    modified_at,
  })
}

#[tauri::command]
fn install_mt5_connector() -> Result<Vec<String>, String> {
  let roaming = env::var_os("APPDATA").ok_or("Windows APPDATA is unavailable")?;
  let terminal_root = PathBuf::from(roaming).join("MetaQuotes").join("Terminal");
  if !terminal_root.exists() {
    return Err("MetaTrader 5 data folder was not found. Install and open MT5 once, then try again.".into());
  }
  let source = include_str!("../../connectors/mt5/BETTERTRADES_Sync.mq5");
  let mut installed = Vec::new();
  for entry in fs::read_dir(&terminal_root).map_err(|e| e.to_string())? {
    let profile = entry.map_err(|e| e.to_string())?.path();
    let experts = profile.join("MQL5").join("Experts");
    if !experts.is_dir() { continue; }
    let destination_dir = experts.join("BETTERTRADES");
    fs::create_dir_all(&destination_dir).map_err(|e| e.to_string())?;
    let destination = destination_dir.join("BETTERTRADES_Sync.mq5");
    fs::write(&destination, source).map_err(|e| e.to_string())?;
    installed.push(destination.to_string_lossy().into_owned());
  }
  if installed.is_empty() {
    Err("No MT5 terminal profile was found. Open MT5 once, then try again.".into())
  } else {
    let editor = env::var_os("ProgramFiles")
      .map(PathBuf::from)
      .map(|path| path.join("MetaTrader 5").join("MetaEditor64.exe"))
      .filter(|path| path.exists());
    if let Some(editor) = editor {
      Command::new(editor)
        .arg(&installed[0])
        .spawn()
        .map_err(|e| format!("Exporter installed, but MetaEditor could not be opened: {e}"))?;
    }
    Ok(installed)
  }
}

#[tauri::command]
fn open_journal_data_folder() -> Result<String, String> {
  let local = env::var_os("LOCALAPPDATA").ok_or("Windows Local AppData is unavailable")?;
  let path = PathBuf::from(local).join("com.eleventrades.bettertrades");
  fs::create_dir_all(&path).map_err(|e| e.to_string())?;
  Command::new("explorer.exe").arg(&path).spawn().map_err(|e| e.to_string())?;
  Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn backup_data(path: String, payload: String) -> Result<(), String> {
  let mut encoder = GzEncoder::new(Vec::new(), Compression::best());
  encoder.write_all(payload.as_bytes()).map_err(|e| e.to_string())?;
  let bytes = encoder.finish().map_err(|e| e.to_string())?;
  fs::write(path, bytes).map_err(|e| e.to_string())
}

#[tauri::command]
fn restore_data(path: String) -> Result<String, String> {
  let bytes = fs::read(path).map_err(|e| e.to_string())?;
  let mut decoder = GzDecoder::new(bytes.as_slice());
  let mut payload = String::new();
  decoder.read_to_string(&mut payload).map_err(|e| e.to_string())?;
  Ok(payload)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![backup_data, restore_data, sync_mt5, install_mt5_connector, open_journal_data_folder])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
