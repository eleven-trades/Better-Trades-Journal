# BETTERTRADES

BETTERTRADES is a free, offline-first Windows trading journal by Eleventrades. It is a standalone Tauri desktop application: React renders the interface and Rust provides the native window, compressed backup/restore, file dialogs, and external-link handling.

## Features

- P&L dashboard, Monday-first calendars, weekly totals and trade-time analytics
- Full trade inspection, strategies, rules, psychology and automated mistake reviews
- Weekly improvement journals with guided prompts and screenshots
- Up to six embedded screenshots per trade or weekly review
- Themes, UI sizing, EST/local-time selection and fullscreen mode
- Compressed `.bettertrades` backup and complete restore
- Local-only data stored under Windows Local AppData; images remain embedded rather than loose files

## Development

### Windows prerequisites

Install these once on a new development PC:

1. [Git for Windows](https://git-scm.com/download/win)
2. [Node.js LTS](https://nodejs.org/en/download)
3. [Rust via rustup](https://rustup.rs/)
4. [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) with **Desktop development with C++**, the current MSVC x64/x86 toolset and a Windows 11 SDK selected
5. VS Code is optional but recommended

Verify the toolchain in PowerShell:

```powershell
git --version
node --version
npm --version
rustc --version
cargo --version
```

### Restore the project on a new PC

```powershell
git clone https://github.com/eleven-trades/Better-Trades-Journal.git
cd Better-Trades-Journal
npm install
npm run desktop
```

The GitHub repository protects the source code, not personal journal entries. Use **Settings → Backup journal** inside BETTERTRADES to preserve trades, strategies, weekly reviews and embedded screenshots separately.

### Everyday development

```powershell
npm install
npm run desktop
```

Useful commands:

```powershell
npm run build           # Type-check and build the frontend
npm run lint            # Static checks
npm run portable        # Standalone development executable
npm run package:windows # NSIS .exe and MSI installers
```

The portable executable is written to `src-tauri/target/release/bettertrades.exe`. Installers are written below `src-tauri/target/release/bundle/`.

## Project structure

- `src/` — React interface, analytics and journal workflows
- `src/assets/` — BETTERTRADES visual assets
- `src-tauri/src/` — Rust desktop and backup commands
- `src-tauri/capabilities/` — least-privilege native permissions
- `src-tauri/icons/` — Windows/application bundle icons
- `public/` — static frontend assets

## Git workflow

Before starting a feature:

```powershell
git pull
git switch -c feature/short-description
```

After testing it:

```powershell
git add .
git commit -m "Describe the completed change"
git push -u origin feature/short-description
```

Never commit `.bettertrades` backups, AppData, private trade screenshots, broker credentials, API keys, `node_modules`, `dist`, or `src-tauri/target`.

## MT5 local-sync test

The local connector is included at `connectors/mt5/BETTERTRADES_Sync.mq5`. It exports closed deals only; it does not use the network, place trades, or read/store your broker password.

1. Install and sign in to the official MetaTrader 5 desktop application.
2. In MT5 choose **File → Open Data Folder**.
3. Open `MQL5/Experts`, create a `BETTERTRADES` folder, and copy `BETTERTRADES_Sync.mq5` into it.
4. Open MetaEditor, compile the file, then return to MT5.
5. Refresh Expert Advisors in Navigator and drag **BETTERTRADES_Sync** onto any chart.
6. Keep MT5 open and allow the EA to run. It refreshes the local export every 10 seconds.
7. In BETTERTRADES open **Settings → MetaTrader 5 local sync → Check for trades**. Review the preview, then import.

The shared export is `%APPDATA%\MetaQuotes\Terminal\Common\Files\BETTERTRADES\closed_trades.csv`. Imports are deduplicated using the MT5 deal ID. Imported trades begin with zero planned risk because MT5 history does not reliably contain the trader's original intended risk; edit each imported trade to add risk, strategy rules, psychology, notes, and screenshots.

## Data and privacy

The application does not require an account or cloud connection. Operational journal data uses `%LOCALAPPDATA%\bettertrades\data`. Backups are gzip-compressed into one `.bettertrades` file containing settings, trades, strategies, notes, weekly reviews and embedded photos. Compression prevents loose photo files but is not encryption; someone with application-level tooling and access to the backup could theoretically decode it.

Version 1.0.3.
