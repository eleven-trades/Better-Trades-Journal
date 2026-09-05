import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heading2,
  Highlighter,
  ImagePlus,
  Italic,
  LayoutDashboard,
  List,
  ListOrdered,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Pencil,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Cable,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import bettertradesLogo from "./assets/bettertrades-logo.png";

const XLogo = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      fill="currentColor"
      d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.25-8.29L2.96 2H9.36l4.42 5.84L18.9 2Zm-1.1 17.84h1.73L8.42 4.05H6.57L17.8 19.84Z"
    />
  </svg>
);
const YouTubeLogo = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
    <path
      fill="currentColor"
      d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"
    />
  </svg>
);
const DiscordLogo = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
    <path
      fill="currentColor"
      d="M20.3 4.4A16 16 0 0 0 16.4 3l-.5 1a14 14 0 0 0-7.8 0l-.5-1a16 16 0 0 0-3.9 1.4C1.2 8.1.5 11.7.8 15.3a16 16 0 0 0 4.8 2.4l1.2-1.6-1.9-.9.5-.4c3.7 1.7 9.5 1.7 13.2 0l.5.4-1.9.9 1.2 1.6a16 16 0 0 0 4.8-2.4c.4-4.2-.7-7.8-2.9-10.9ZM8.1 14.2c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Zm7.8 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Z"
    />
  </svg>
);
import "./App.css";

type Page =
  | "Overview"
  | "Calendar"
  | "Trades"
  | "Strategies"
  | "Reviews"
  | "Weekly Improvement"
  | "Settings";
type ThemeName = "emerald" | "purple" | "sky" | "rose" | "amber";
type RangeKey = "week" | "15d" | "1m" | "3m" | "6m" | "1y" | "lifetime";
type Rule = { id: string; text: string };
type Strategy = { id: string; name: string; color: string; rules: Rule[] };
type WeeklyReview = {
  id: string;
  weekStart: string;
  notes: string;
  answers?: string[];
  goals: string;
  screenshots: string[];
};
type Trade = {
  id: string;
  kind?: "trade" | "no-trade";
  date: string;
  symbol: string;
  direction: "Long" | "Short";
  entry: number;
  exit: number;
  quantity: number;
  fees: number;
  pnl: number;
  risk: number;
  strategyId: string;
  followedRules: string[];
  emotion: string;
  notes: string;
  time?: string;
  screenshot?: string;
  screenshots?: string[];
  mt5DealId?: string;
  mt5PositionId?: string;
  mt5Timestamp?: number;
  importedFrom?: "MT5";
};
type AppSettings = {
  accountName: string;
  accountSize: number;
  defaultRiskPercent: number;
  currency: string;
  textScale?: number;
  timeZone?: "EST" | "local";
  mt5Balance?: number;
  mt5Equity?: number;
  mt5Login?: string;
  mt5Server?: string;
};
type Mt5SyncResult = { found: boolean; path: string; content: string; modifiedAt?: number };
type Mt5Import = Omit<Trade, "id" | "strategyId" | "followedRules" | "emotion" | "notes">;
const uid = () => crypto.randomUUID(),
  today = new Date().toISOString().slice(0, 10);
const defaultStrategy: Strategy = {
  id: "breakout",
  name: "Opening Range Breakout",
  color: "#6ee7b7",
  rules: [
    { id: "trend", text: "Trade agrees with the higher-timeframe bias" },
    { id: "level", text: "Entry occurs at a pre-marked level" },
    { id: "confirm", text: "Waited for confirmation before entry" },
    { id: "risk", text: "Stop and target were defined before entry" },
  ],
};
const seedTrades: Trade[] = [
  {
    id: "1",
    date: "2026-08-04",
    symbol: "NQ",
    direction: "Long",
    entry: 23140,
    exit: 23188,
    quantity: 2,
    fees: 5,
    pnl: 187,
    risk: 100,
    strategyId: "breakout",
    followedRules: ["trend", "level", "confirm", "risk"],
    emotion: "Focused",
    notes: "Clean retest and patient entry.",
    time: "09:12",
  },
  {
    id: "2",
    date: "2026-08-07",
    symbol: "ES",
    direction: "Short",
    entry: 6442,
    exit: 6450,
    quantity: 3,
    fees: 7,
    pnl: -127,
    risk: 120,
    strategyId: "breakout",
    followedRules: ["trend", "level"],
    emotion: "Rushed",
    notes: "Entered before confirmation.",
    time: "09:38",
  },
  {
    id: "3",
    date: "2026-08-12",
    symbol: "NQ",
    direction: "Long",
    entry: 23310,
    exit: 23372,
    quantity: 2,
    fees: 5,
    pnl: 243,
    risk: 100,
    strategyId: "breakout",
    followedRules: ["trend", "level", "confirm", "risk"],
    emotion: "Calm",
    notes: "Followed the plan.",
    time: "10:16",
  },
  {
    id: "4",
    date: "2026-08-18",
    symbol: "GC",
    direction: "Long",
    entry: 3391,
    exit: 3386,
    quantity: 2,
    fees: 6,
    pnl: -106,
    risk: 100,
    strategyId: "breakout",
    followedRules: ["level", "risk"],
    emotion: "FOMO",
    notes: "Counter-trend attempt.",
    time: "11:42",
  },
  {
    id: "5",
    date: "2026-08-24",
    symbol: "ES",
    direction: "Long",
    entry: 6478,
    exit: 6491,
    quantity: 3,
    fees: 7,
    pnl: 188,
    risk: 120,
    strategyId: "breakout",
    followedRules: ["trend", "level", "confirm", "risk"],
    emotion: "Focused",
    notes: "Good patience at the open.",
    time: "13:08",
  },
];
function useStored<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "") as T;
    } catch {
      return initial;
    }
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(v)), [key, v]);
  return [v, setV] as const;
}
const journalKeys = [
  "tj-theme",
  "tj-accent",
  "tj-range",
  "tj-sidebar-collapsed",
  "tj-trades",
  "tj-strategies",
  "tj-weekly-reviews",
  "tj-settings",
];
async function backupJournalData() {
  const path = await save({
    title: "Back up BETTERTRADES",
    defaultPath: `BETTERTRADES-backup-${today}.bettertrades`,
    filters: [{ name: "BETTERTRADES backup", extensions: ["bettertrades"] }],
  });
  if (!path) return false;
  const data = Object.fromEntries(
    journalKeys.map((key) => [key, localStorage.getItem(key)]),
  );
  await invoke("backup_data", {
    path,
    payload: JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      data,
    }),
  });
  return true;
}
async function restoreJournalData() {
  const path = await open({
    title: "Restore BETTERTRADES",
    multiple: false,
    filters: [{ name: "BETTERTRADES backup", extensions: ["bettertrades"] }],
  });
  if (!path || Array.isArray(path)) return false;
  const payload = await invoke<string>("restore_data", { path });
  const backup = JSON.parse(payload) as { data: Record<string, string | null> };
  journalKeys.forEach((key) => {
    const value = backup.data[key];
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  });
  window.location.reload();
  return true;
}
const money = (v: number, c = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  }).format(v);
function zonedTradeDate(timestamp: number, zone: "EST" | "local") {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: zone === "EST" ? "America/New_York" : undefined, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp * 1000)).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}
function parseMt5Export(content: string, zone: "EST" | "local"): Mt5Import[] {
  const hasTimestamp = content.split(/\r?\n/).some((line) => line.startsWith("deal_id") && line.includes("close_timestamp"));
  return content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line && !line.startsWith("#") && !line.startsWith("deal_id")).flatMap((line) => {
    const columns = line.split(",").map((value) => value.replace(/^"|"$/g, "").trim());
    if (columns.length < 12) return [];
    const [dealId, positionId, closedAt] = columns;
    const timestamp = hasTimestamp ? +columns[3] : 0;
    const offset = hasTimestamp ? 1 : 0;
    const [symbol, direction, entry, exit, volume, profit, commission, swap, fee] = columns.slice(3 + offset, 12 + offset);
    const [datePart = "", fallbackTime = "00:00"] = closedAt.split(" ");
    const converted = timestamp ? zonedTradeDate(timestamp, zone) : { date: datePart.replaceAll(".", "-"), time: fallbackTime.slice(0, 5) };
    const { date, time } = converted;
    const pnl = [profit, commission, swap, fee].reduce((sum, value) => sum + (+value || 0), 0);
    if (!dealId || !symbol || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    return [{ date, time, symbol, direction: direction === "Short" ? "Short" as const : "Long" as const, entry: +entry || 0, exit: +exit || 0, quantity: +volume || 0, fees: Math.abs((+commission || 0) + (+swap || 0) + (+fee || 0)), pnl, risk: 0, mt5DealId: dealId, mt5PositionId: positionId, mt5Timestamp: timestamp || undefined, importedFrom: "MT5" as const }];
  });
}
function parseMt5Account(content: string) {
  const line = content.replace(/^\uFEFF/, "").split(/\r?\n/).find((row) => row.startsWith("#account,"));
  if (!line) return null;
  const [, login, server, currency, balance, equity] = line.split(",").map((value) => value.replace(/^"|"$/g, "").trim());
  return { login, server, currency, balance: +balance || 0, equity: +equity || 0 };
}
const nav: { page: Page; icon: typeof LayoutDashboard }[] = [
  { page: "Overview", icon: LayoutDashboard },
  { page: "Calendar", icon: CalendarDays },
  { page: "Trades", icon: BookOpen },
  { page: "Strategies", icon: Target },
  { page: "Reviews", icon: Sparkles },
  { page: "Weekly Improvement", icon: CalendarDays },
  { page: "Settings", icon: Settings },
];
const rangeOptions: { value: RangeKey; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "15d", label: "15 days" },
  { value: "1m", label: "1 month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
  { value: "lifetime", label: "Lifetime" },
];
function filterByRange(trades: Trade[], range: RangeKey) {
  if (range === "lifetime") return trades;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  if (range === "week") {
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else {
    const days = { "15d": 15, "1m": 30, "3m": 90, "6m": 180, "1y": 365 }[range];
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
  }
  return trades.filter((t) => {
    const date = new Date(`${t.date}T12:00:00`);
    return date >= start && date <= end;
  });
}
function currentTimeFor(zone: "EST" | "local" = "EST") {
  if (zone === "local") return new Date().toTimeString().slice(0, 5);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}
const psychologyPrompts = [
  {
    text: "Anything can happen. Your edge lives across a series of trades.",
    author: "Mark Douglas",
  },
  {
    text: "Take the loss well; protecting your mind protects the next decision.",
    author: "Tom Hougaard",
  },
  {
    text: "The goal is excellent execution, not certainty about the outcome.",
    author: "Trading principle",
  },
  {
    text: "Patience is a position. You do not have to trade every movement.",
    author: "Trading psychology",
  },
  {
    text: "Risk small enough that one trade cannot change who you become.",
    author: "Risk principle",
  },
];
function PsychologyPrompt() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % psychologyPrompts.length),
      60000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const quote = psychologyPrompts[index];
  return (
    <div className="psychology-prompt">
      <Sparkles size={15} />
      <p>
        “{quote.text}” <span>— {quote.author}</span>
      </p>
      <div>
        {psychologyPrompts.map((_, i) => (
          <i key={i} className={i === index ? "active" : ""} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("Overview"),
    [theme, setTheme] = useStored<"light" | "dark">("tj-theme", "dark"),
    [accent, setAccent] = useStored<ThemeName>("tj-accent", "emerald"),
    [range, setRange] = useStored<RangeKey>("tj-range", "1m"),
    [sidebarCollapsed, setSidebarCollapsed] = useStored(
      "tj-sidebar-collapsed",
      false,
    ),
    [trades, setTrades] = useStored<Trade[]>("tj-trades", seedTrades),
    [strategies, setStrategies] = useStored<Strategy[]>("tj-strategies", [
      defaultStrategy,
    ]),
    [weeklyReviews, setWeeklyReviews] = useStored<WeeklyReview[]>(
      "tj-weekly-reviews",
      [],
    ),
    [settings, setSettings] = useStored<AppSettings>("tj-settings", {
      accountName: "Main account",
      accountSize: 25000,
      defaultRiskPercent: 0.5,
      currency: "USD",
      textScale: 1,
      timeZone: "EST",
    }),
    [showTrade, setShowTrade] = useState(false),
    [selectedDate, setSelectedDate] = useState(today),
    [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = accent;
    document.documentElement.style.setProperty(
      "--ui-scale",
      String(settings.textScale ?? 1),
    );
  }, [theme, accent, settings.textScale]);
  useEffect(() => {
    const onKeyDown = async (event: KeyboardEvent) => {
      if (event.key !== "F11") return;
      event.preventDefault();
      try {
        const appWindow = getCurrentWindow();
        await appWindow.setFullscreen(!(await appWindow.isFullscreen()));
      } catch {}
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const recordedTrades = trades.filter((trade) => trade.kind !== "no-trade"),
    visibleTrades = filterByRange(recordedTrades, range),
    lifetimeTotal = recordedTrades.reduce((s, t) => s + t.pnl, 0),
    total = visibleTrades.reduce((s, t) => s + t.pnl, 0),
    wins = visibleTrades.filter((t) => t.pnl > 0),
    losses = visibleTrades.filter((t) => t.pnl < 0),
    wr = visibleTrades.length ? (wins.length / visibleTrades.length) * 100 : 0,
    pf = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
      ? wins.reduce((s, t) => s + t.pnl, 0) /
        Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
      : 0,
    riskRatedTrades = visibleTrades.filter((trade) => trade.risk > 0),
    avgR = riskRatedTrades.length
      ? riskRatedTrades.reduce((s, t) => s + t.pnl / t.risk, 0) /
        riskRatedTrades.length
      : 0;
  const openDate = (date: string, loadExisting = true) => {
    setSelectedDate(date);
    setEditingTrade(
      loadExisting
        ? ([...trades].reverse().find((t) => t.date === date) ?? null)
        : null,
    );
    setShowTrade(true);
  };
  const openTrade = (trade: Trade) => {
    setSelectedDate(trade.date);
    setEditingTrade(trade);
    setShowTrade(true);
  };
  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside>
        <div className="brand">
          <span className="brand-mark">
            <img src={bettertradesLogo} alt="BETTERTRADES logo" />
          </span>
          <b>BETTERTRADES</b>
        </div>
        <div className="account-pill">
          <span>
            <small>ACCOUNT</small>
            {settings.accountName}
          </span>
          <strong>
            {money(settings.mt5Balance ?? settings.accountSize + lifetimeTotal, settings.currency)}
          </strong>
        </div>
        <nav>
          {nav.map(({ page: item, icon: Icon }) => (
            <button
              title={item}
              key={item}
              className={page === item ? "active" : ""}
              onClick={() => setPage(item)}
            >
              <Icon size={18} />
              <span>{item}</span>
              {item === "Reviews" &&
                recordedTrades.some(
                  (trade) =>
                    trade.followedRules.length <
                      (strategies.find(
                        (strategy) => strategy.id === trade.strategyId,
                      )?.rules.length ?? 4) ||
                    !["Focused", "Calm", "Confident"].includes(trade.emotion),
                ) && <AlertTriangle className="nav-warning" size={14} />}
            </button>
          ))}
        </nav>
        <div className="privacy">
          <ShieldCheck size={17} />
          <span>
            <strong>Private by design</strong>
            <small>Everything stays on this device.</small>
          </span>
          <p>
            A Trading Journal by <strong>Eleventrades</strong>
          </p>
        </div>
      </aside>
      <main>
        <header>
          <div className="header-title">
            <button
              className="icon-btn sidebar-toggle"
              title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
            <div>
              <p className="eyebrow">TRADING JOURNAL</p>
              <h1>{page}</h1>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              title="Toggle light mode"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="primary" onClick={() => openDate(today, false)}>
              <Plus size={17} /> Add trade
            </button>
          </div>
        </header>
        {page === "Overview" && (
          <Overview
            trades={visibleTrades}
            calendarTrades={trades}
            currency={settings.currency}
            total={total}
            wr={wr}
            pf={pf}
            avgR={avgR}
            range={range}
            setRange={setRange}
            openDate={openDate}
            timeZone={settings.timeZone ?? "EST"}
          />
        )}{" "}
        {page === "Calendar" && (
          <CalendarView
            trades={trades}
            currency={settings.currency}
            openDate={openDate}
          />
        )}{" "}
        {page === "Trades" && (
          <TradesView
            trades={recordedTrades}
            strategies={strategies}
            currency={settings.currency}
            remove={(id) => setTrades(trades.filter((t) => t.id !== id))}
            removeAll={() =>
              setTrades(trades.filter((trade) => trade.kind === "no-trade"))
            }
            openTrade={openTrade}
          />
        )}{" "}
        {page === "Strategies" && (
          <StrategiesView
            strategies={strategies}
            setStrategies={setStrategies}
          />
        )}{" "}
        {page === "Reviews" && (
          <ReviewsView trades={recordedTrades} strategies={strategies} />
        )}{" "}
        {page === "Weekly Improvement" && (
          <WeeklyImprovement
            reviews={weeklyReviews}
            setReviews={setWeeklyReviews}
          />
        )}{" "}
        {page === "Settings" && (
          <SettingsView
            value={settings}
            onChange={setSettings}
            theme={theme}
            setTheme={setTheme}
            accent={accent}
            setAccent={setAccent}
            trades={recordedTrades}
            strategies={strategies}
            onImportMt5={(imports) => {
              const known = new Set(recordedTrades.map((trade) => trade.mt5DealId).filter(Boolean));
              const strategyId = strategies[0]?.id ?? "";
              const additions: Trade[] = imports.filter((trade) => !known.has(trade.mt5DealId)).map((trade) => ({ ...trade, id: uid(), strategyId, followedRules: [], emotion: "Focused", notes: "<ul><li>Imported from MT5 — add your review.</li></ul>" }));
              if (additions.length) setTrades([...trades, ...additions]);
              return additions.length;
            }}
            onRefreshMt5={(imports) => {
              const byDeal = new Map(imports.map((trade) => [trade.mt5DealId, trade]));
              setTrades(trades.map((trade) => {
                const fresh = trade.mt5DealId ? byDeal.get(trade.mt5DealId) : undefined;
                return fresh ? { ...trade, date: fresh.date, time: fresh.time, mt5Timestamp: fresh.mt5Timestamp } : trade;
              }));
            }}
          />
        )}
      </main>
      {showTrade && (
        <TradeModal
          date={selectedDate}
          trade={editingTrade}
          strategies={strategies}
          settings={settings}
          onClose={() => setShowTrade(false)}
          onSave={(t) => {
            setTrades(
              editingTrade
                ? trades.map((item) => (item.id === t.id ? t : item))
                : [...trades, t],
            );
            setShowTrade(false);
            setEditingTrade(null);
          }}
        />
      )}
    </div>
  );
}
function Metric({
  label,
  value,
  detail,
  positive,
}: {
  label: string;
  value: string;
  detail: string;
  positive?: boolean;
}) {
  return (
    <div className="metric card">
      <div className="metric-label">{label}</div>
      <strong className={positive ? "positive" : ""}>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function Overview({
  trades,
  calendarTrades,
  currency,
  total,
  wr,
  pf,
  avgR,
  range,
  setRange,
  openDate,
  timeZone,
}: {
  trades: Trade[];
  calendarTrades: Trade[];
  currency: string;
  total: number;
  wr: number;
  pf: number;
  avgR: number;
  range: RangeKey;
  setRange: (range: RangeKey) => void;
  openDate: (d: string) => void;
  timeZone: "EST" | "local";
}) {
  const curve = useMemo(() => {
    let running = 0;
    return [...trades]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => ({ date: t.date.slice(5), value: (running += t.pnl) }));
  }, [trades]);
  const wins = trades.filter((t) => t.pnl > 0),
    losses = trades.filter((t) => t.pnl < 0);
  const avgWin = wins.length
    ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length
    : 0;
  const avgLoss = losses.length
    ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length)
    : 0;
  const winLoss = avgLoss ? avgWin / avgLoss : 0;
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(`${trades[trades.length - 1]?.date || today}T12:00:00`),
  );
  return (
    <div className="page-content">
      <div className="overview-toolbar">
        <PsychologyPrompt />
        <div className="range-filter">
          <span>Showing</span>
          <SelectMenu
            label="Performance range"
            value={range}
            onChange={(v) => setRange(v as RangeKey)}
            options={rangeOptions}
          />
        </div>
      </div>
      <section className="metrics">
        <Metric
          label="NET P&L"
          value={money(total, currency)}
          detail={`${trades.length} trades recorded`}
          positive={total >= 0}
        />
        <Metric
          label="WIN RATE"
          value={`${wr.toFixed(0)}%`}
          detail="Profitable executions"
        />
        <Metric
          label="PROFIT FACTOR"
          value={pf.toFixed(2)}
          detail="Gross profit ÷ gross loss"
        />
        <Metric
          label="AVERAGE R"
          value={`${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R`}
          detail="Return per unit of risk"
          positive={avgR >= 0}
        />
        <div className="metric card avg-win-loss">
          <div className="metric-label">AVG WIN / LOSS</div>
          <strong>{winLoss.toFixed(2)}</strong>
          <div className="win-loss-bar">
            <i style={{ flex: Math.max(avgWin, 1) }} />
            <i style={{ flex: Math.max(avgLoss, 1) }} />
          </div>
          <div className="win-loss-values">
            <span className="positive">{money(avgWin, currency)}</span>
            <span className="negative">
              -{money(avgLoss, currency).replace("-", "")}
            </span>
          </div>
        </div>
      </section>
      <section className="overview-grid">
        <div className="card calendar-card">
          <MonthHeader
            month={calendarMonth}
            onChange={setCalendarMonth}
            subtitle="Select any day to journal"
          />
          <MiniCalendar
            trades={calendarTrades}
            currency={currency}
            openDate={openDate}
            month={calendarMonth}
            showWeekly
          />
        </div>
        <div className="card chart-card">
          <SectionTitle
            title="Equity curve"
            subtitle="Cumulative realized P&L"
          />
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#67d8aa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#67d8aa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={58} tickFormatter={(value) => money(value, currency)} />
                <Tooltip
                  formatter={(value) => [money(Number(value), currency), "P&L"]}
                  contentStyle={{
                    background: "var(--panel)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#67d8aa"
                  strokeWidth={2}
                  fill="url(#fill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card recent">
          <SectionTitle
            title="Recent trades"
            subtitle="Your latest executions"
          />
          <TradeRows
            trades={[...trades].reverse().slice(0, 4)}
            currency={currency}
          />
        </div>
        <div className="card discipline">
          <SectionTitle
            title="Process score"
            subtitle="Rules followed across all trades"
          />
          <Discipline trades={trades} />
        </div>
        <TradeTimeChart
          trades={trades}
          currency={currency}
          timeZone={timeZone}
        />
      </section>
    </div>
  );
}
function TradeTimeChart({
  trades,
  currency,
  timeZone,
}: {
  trades: Trade[];
  currency: string;
  timeZone: "EST" | "local";
}) {
  const points = trades.map((trade, index) => {
    const time =
      trade.time || ["09:05", "09:42", "10:18", "11:36", "13:08"][index % 5];
    const [hour, minute] = time.split(":").map(Number);
    return {
      x: hour + minute / 60,
      y: trade.pnl,
      time,
      date: trade.date,
      symbol: trade.symbol,
      pnl: trade.pnl,
    };
  });
  const wins = points.filter((p) => p.y >= 0),
    losses = points.filter((p) => p.y < 0);
  const tooltip = ({ active, payload }: any) =>
    active && payload?.[0] ? (
      <div className="time-tooltip">
        <strong>
          {new Date(`${payload[0].payload.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {payload[0].payload.time} {timeZone === "EST" ? "ET" : "local"} · {payload[0].payload.symbol}
        </strong>
        <span className={payload[0].payload.pnl >= 0 ? "positive" : "negative"}>
          {money(payload[0].payload.pnl, currency)}
        </span>
      </div>
    ) : null;
  return (
    <div className="card trade-time-card">
      <SectionTitle
        title="Trade time performance"
        subtitle={`Hover over a dot to inspect its ${timeZone === "EST" ? "Eastern" : "local"} execution time`}
      />
      <div className="time-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 20, bottom: 5, left: 5 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[8, 16]}
              tickFormatter={(value) =>
                `${Math.floor(value)}:${value % 1 ? "30" : "00"}`
              }
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              tickFormatter={(value) => money(value, currency)}
              tickLine={false}
              axisLine={false}
              width={65}
            />
            <Tooltip
              cursor={false}
              content={tooltip}
            />
            <Scatter data={wins} fill="var(--good)" />
            <Scatter data={losses} fill="var(--bad)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
function MonthHeader({
  month,
  onChange,
  subtitle,
}: {
  month: Date;
  onChange: (month: Date) => void;
  subtitle: string;
}) {
  const shift = (amount: number) =>
    onChange(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  return (
    <div className="section-title month-header">
      <div>
        <h2>
          {month.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <p>{subtitle}</p>
      </div>
      <div>
        <button
          className="mini-nav"
          title="Previous month"
          onClick={() => shift(-1)}
        >
          <ChevronLeft size={15} />
        </button>
        <button
          className="mini-nav"
          title="Next month"
          onClick={() => shift(1)}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
function calendarDays(month: Date) {
  const year = month.getFullYear(),
    monthIndex = month.getMonth(),
    mondayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = Array(mondayOffset).fill(null);
  const count = new Date(year, monthIndex + 1, 0).getDate();
  for (let i = 1; i <= count; i++) cells.push(i);
  while (cells.length % 7) cells.push(null);
  return cells;
}
function MiniCalendar({
  trades,
  currency,
  openDate,
  month,
  showWeekly = false,
}: {
  trades: Trade[];
  currency: string;
  openDate: (d: string) => void;
  month: Date;
  showWeekly?: boolean;
}) {
  const daily = useMemo(
    () =>
      trades.reduce<Record<number, { pnl: number; count: number; noTrade: boolean }>>((m, t) => {
        if (
          t.date.startsWith(
            `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
          )
        ) {
          const day = +t.date.slice(8),
            current = m[day] ?? { pnl: 0, count: 0, noTrade: false };
          m[day] = t.kind === "no-trade"
            ? { ...current, noTrade: true }
            : { pnl: current.pnl + t.pnl, count: current.count + 1, noTrade: current.noTrade };
        }
        return m;
      }, {}),
    [trades, month],
  );
  const cells = calendarDays(month),
    weeks = Array.from({ length: cells.length / 7 }, (_, i) =>
      cells.slice(i * 7, i * 7 + 7),
    );
  return (
    <div className={`calendar ${showWeekly ? "with-weekly" : ""}`}>
      <div className="weekdays">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
        {showWeekly && <span>Week</span>}
      </div>
      <div className="calendar-weeks">
        {weeks.map((week, weekIndex) => (
          <div className="calendar-week" key={weekIndex}>
            <div className="calendar-grid">
              {week.map((d, i) =>
                d ? (
                  <button
                    key={i}
                    onClick={() =>
                      openDate(
                        `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                      )
                    }
                    className={
                      daily[d]?.count === 0 && daily[d]?.noTrade
                        ? "no-trade"
                        : daily[d]?.pnl > 0
                        ? "gain"
                        : daily[d]?.pnl < 0
                          ? "loss"
                          : ""
                    }
                  >
                    <span>{d}</span>
                    {daily[d]?.count === 0 && daily[d]?.noTrade ? (
                      <strong className="no-trade-label">No trade</strong>
                    ) : daily[d] !== undefined && daily[d].count > 0 ? (
                      <>
                        <strong>{money(daily[d].pnl, currency)}</strong>
                        <small>
                          {daily[d].count}{" "}
                          {daily[d].count === 1 ? "trade" : "trades"}
                        </small>
                      </>
                    ) : null}
                  </button>
                ) : (
                  <span key={i} />
                ),
              )}
            </div>
            {showWeekly && (
              <div
                className={`week-summary ${week.reduce<number>((sum, d) => sum + (d ? daily[d]?.pnl || 0 : 0), 0) >= 0 ? "gain" : "loss"}`}
              >
                <small>Week {weekIndex + 1}</small>
                <strong>
                  {money(
                    week.reduce<number>(
                      (sum, d) => sum + (d ? daily[d]?.pnl || 0 : 0),
                      0,
                    ),
                    currency,
                  )}
                </strong>
                <span>
                  {week.filter((d) => d && (daily[d]?.count ?? 0) > 0).length}{" "}
                  trading days
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function TradeRows({
  trades,
  currency,
}: {
  trades: Trade[];
  currency: string;
}) {
  return (
    <div className="trade-rows">
      {trades.map((t) => (
        <div className="trade-row" key={t.id}>
          <div className={`direction ${t.direction.toLowerCase()}`}>
            {t.direction === "Long" ? "↗" : "↘"}
          </div>
          <div>
            <strong>{t.symbol}</strong>
            <small>
              {t.direction} ·{" "}
              {new Date(t.date + "T12:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </small>
          </div>
          <span className={t.pnl >= 0 ? "positive" : "negative"}>
            {t.pnl >= 0 ? "+" : ""}
            {money(t.pnl, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}
function Discipline({ trades }: { trades: Trade[] }) {
  const followed = trades.reduce((s, t) => s + t.followedRules.length, 0),
    total = trades.length * 4,
    score = total ? Math.round((followed / total) * 100) : 0;
  return (
    <div className="score">
      <div
        className="score-ring"
        style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}
      >
        <span>
          {score}
          <small>/100</small>
        </span>
      </div>
      <div>
        <strong>
          {score >= 80
            ? "Strong discipline"
            : score >= 60
              ? "Building consistency"
              : "Needs attention"}
        </strong>
        <p>
          {followed} of {total} rules followed
        </p>
        <div className="legend">
          <i /> Process over outcome
        </div>
      </div>
    </div>
  );
}
function CalendarView({
  trades,
  currency,
  openDate,
}: {
  trades: Trade[];
  currency: string;
  openDate: (d: string) => void;
}) {
  const [month, setMonth] = useState(
    () => new Date(`${trades[trades.length - 1]?.date || today}T12:00:00`),
  );
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const pnl = trades
    .filter((t) => t.date.startsWith(monthKey))
    .reduce((s, t) => s + t.pnl, 0);
  return (
    <div className="page-content">
      <div className="calendar-toolbar">
        <button
          className="icon-btn"
          title="Previous month"
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        >
          <ChevronLeft size={18} />
        </button>
        <h2>
          {month.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button
          className="icon-btn"
          title="Next month"
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        >
          <ChevronRight size={18} />
        </button>
        <span />
        <div>
          <small>MONTHLY P&L</small>
          <strong className={pnl >= 0 ? "positive" : "negative"}>
            {money(pnl, currency)}
          </strong>
        </div>
      </div>
      <div className="card large-calendar">
        <MiniCalendar
          trades={trades}
          currency={currency}
          openDate={openDate}
          month={month}
          showWeekly
        />
      </div>
    </div>
  );
}
function ConfirmDialog({
  title,
  message,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="confirm-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="confirm-dialog card">
        <div className="confirm-icon">
          <Trash2 size={19} />
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div>
          <button className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
function TradesView({
  trades,
  strategies,
  currency,
  remove,
  removeAll,
  openTrade,
}: {
  trades: Trade[];
  strategies: Strategy[];
  currency: string;
  remove: (id: string) => void;
  removeAll: () => void;
  openTrade: (trade: Trade) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<Trade | null>(null),
    [pendingDeleteAll, setPendingDeleteAll] = useState(false),
    [selectedTrade, setSelectedTrade] = useState<Trade | null>(null),
    [viewerImage, setViewerImage] = useState<string | null>(null);
  if (selectedTrade) {
    const strategy = strategies.find((s) => s.id === selectedTrade.strategyId),
      images =
        selectedTrade.screenshots ??
        (selectedTrade.screenshot ? [selectedTrade.screenshot] : []);
    return (
      <div className="page-content trade-inspector">
        <div className="trade-inspector-head">
          <button className="secondary" onClick={() => setSelectedTrade(null)}>
            <ArrowLeft size={16} /> All trades
          </button>
          <button className="primary" onClick={() => openTrade(selectedTrade)}>
            <Pencil size={15} /> Edit trade
          </button>
        </div>
        <section className="card trade-inspector-hero">
          <div>
            <p className="eyebrow">
              {new Date(selectedTrade.date + "T12:00").toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                },
              )}
            </p>
            <h2>
              {selectedTrade.symbol} <span>{selectedTrade.direction}</span>
            </h2>
            <p>
              {strategy?.name ?? "No strategy"} ·{" "}
              {selectedTrade.time ?? "Time not recorded"}
            </p>
          </div>
          <strong className={selectedTrade.pnl >= 0 ? "positive" : "negative"}>
            {money(selectedTrade.pnl, currency)}
            <small>
              {selectedTrade.risk > 0 ? `${(selectedTrade.pnl / selectedTrade.risk).toFixed(2)}R` : "—"}
            </small>
          </strong>
        </section>
        <section className="trade-detail-grid">
          <div className="card trade-notes">
            <SectionTitle
              title="Trade notes"
              subtitle="What you recorded after execution"
            />
            <div
              className="note-reading"
              dangerouslySetInnerHTML={{
                __html: selectedTrade.notes || "No notes were recorded.",
              }}
            />
          </div>
          <div className="card trade-rules">
            <SectionTitle
              title="Execution checklist"
              subtitle={`${selectedTrade.followedRules.length} rules followed`}
            />
            {strategy?.rules.map((rule) => (
              <div
                key={rule.id}
                className={
                  selectedTrade.followedRules.includes(rule.id)
                    ? "followed"
                    : "missed"
                }
              >
                {selectedTrade.followedRules.includes(rule.id) ? (
                  <Check size={15} />
                ) : (
                  <X size={15} />
                )}
                <span>{rule.text}</span>
              </div>
            )) ?? <p>No strategy rules available.</p>}
          </div>
        </section>
        <section className="card trade-gallery">
          <SectionTitle
            title="Chart review"
            subtitle={`${images.length} attached ${images.length === 1 ? "image" : "images"}`}
          />
          {images.length ? (
            <div>
              {images.map((src, index) => (
                <button key={index} onClick={() => setViewerImage(src)}>
                  <img src={src} alt={`Trade chart ${index + 1}`} />
                  <span>View chart {index + 1}</span>
                </button>
              ))}
            </div>
          ) : (
            <p>No screenshots were attached to this trade.</p>
          )}
        </section>
        {viewerImage && (
          <div
            className="image-viewer"
            onMouseDown={(e) =>
              e.target === e.currentTarget && setViewerImage(null)
            }
          >
            <button onClick={() => setViewerImage(null)}>
              <X size={20} />
            </button>
            <img src={viewerImage} alt="Trade chart full view" />
          </div>
        )}
      </div>
    );
  }
  return (
    <>
      <div className="page-content">
        <div className="trades-toolbar">
          <div><h2>Trade history</h2><p>{trades.length} recorded trade{trades.length === 1 ? "" : "s"}</p></div>
          <button className="danger-outline" disabled={!trades.length} onClick={() => setPendingDeleteAll(true)}><Trash2 size={15} /> Delete all trades</button>
        </div>
        <div className="card table-card">
          <div className="table-head">
            <span>DATE</span>
            <span>SYMBOL</span>
            <span>SETUP</span>
            <span>PROCESS</span>
            <span>R</span>
            <span>P&L</span>
            <span />
          </div>
          {[...trades].reverse().map((t) => (
            <div
              className="table-row"
              key={t.id}
              onClick={() => setSelectedTrade(t)}
              title="Open trade"
            >
              <span>
                {new Date(t.date + "T12:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <strong>
                {t.symbol}
                <small>{t.direction}</small>
              </strong>
              <span>
                {strategies.find((s) => s.id === t.strategyId)?.name || "—"}
              </span>
              <span>{t.followedRules.length}/4 rules</span>
              <span>{t.risk > 0 ? `${(t.pnl / t.risk).toFixed(2)}R` : "—"}</span>
              <strong className={t.pnl >= 0 ? "positive" : "negative"}>
                {money(t.pnl, currency)}
              </strong>
              <button
                title="Delete trade"
                className="ghost-danger"
                onClick={(event) => {
                  event.stopPropagation();
                  setPendingDelete(t);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
      {pendingDelete && (
        <ConfirmDialog
          title={`Delete ${pendingDelete.symbol} trade?`}
          message="This removes the trade and updates every related statistic. This action cannot be undone."
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            remove(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
      {pendingDeleteAll && (
        <ConfirmDialog
          title={`Delete all ${trades.length} trades?`}
          message="This permanently removes every trade and resets all trade-based calendars and statistics. Strategies and weekly reviews will remain."
          onCancel={() => setPendingDeleteAll(false)}
          onConfirm={() => { removeAll(); setPendingDeleteAll(false); }}
        />
      )}
    </>
  );
}
function StrategiesView({
  strategies,
  setStrategies,
}: {
  strategies: Strategy[];
  setStrategies: (s: Strategy[]) => void;
}) {
  const [name, setName] = useState(""),
    [pendingStrategy, setPendingStrategy] = useState<Strategy | null>(null);
  const add = () => {
    if (name.trim()) {
      setStrategies([
        ...strategies,
        { id: uid(), name: name.trim(), color: "#93c5fd", rules: [] },
      ]);
      setName("");
    }
  };
  return (
    <>
      <div className="page-content narrow">
        <div className="intro">
          <h2>Your playbook</h2>
          <p>
            Rules defined here appear as checkboxes whenever you journal a
            trade.
          </p>
        </div>
        {strategies.map((s) => (
          <div className="card strategy" key={s.id}>
            <div className="strategy-head">
              <span className="strategy-dot" style={{ background: s.color }} />
              <input
                value={s.name}
                onChange={(e) =>
                  setStrategies(
                    strategies.map((x) =>
                      x.id === s.id ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
              />
              <span>{s.rules.length} rules</span>
              <button
                className="ghost-danger"
                title="Delete strategy"
                onClick={() => setPendingStrategy(s)}
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="rules">
              {s.rules.map((r, i) => (
                <div key={r.id}>
                  <span>{i + 1}</span>
                  <input
                    value={r.text}
                    onChange={(e) =>
                      setStrategies(
                        strategies.map((x) =>
                          x.id === s.id
                            ? {
                                ...x,
                                rules: x.rules.map((y) =>
                                  y.id === r.id
                                    ? { ...y, text: e.target.value }
                                    : y,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      setStrategies(
                        strategies.map((x) =>
                          x.id === s.id
                            ? {
                                ...x,
                                rules: x.rules.filter((y) => y.id !== r.id),
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              <button
                className="add-rule"
                onClick={() =>
                  setStrategies(
                    strategies.map((x) =>
                      x.id === s.id
                        ? {
                            ...x,
                            rules: [
                              ...x.rules,
                              { id: uid(), text: "New trading rule" },
                            ],
                          }
                        : x,
                    ),
                  )
                }
              >
                <Plus size={15} /> Add rule
              </button>
            </div>
          </div>
        ))}
        <div className="new-strategy">
          <input
            placeholder="New strategy name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button className="secondary" onClick={add}>
            <Plus size={16} /> New strategy
          </button>
        </div>
      </div>
      {pendingStrategy && (
        <ConfirmDialog
          title={`Delete ${pendingStrategy.name}?`}
          message="Trades already assigned to this strategy will remain, but the strategy and its rules will be removed."
          onCancel={() => setPendingStrategy(null)}
          onConfirm={() => {
            setStrategies(
              strategies.filter(
                (strategy) => strategy.id !== pendingStrategy.id,
              ),
            );
            setPendingStrategy(null);
          }}
        />
      )}
    </>
  );
}
function ReviewsView({
  trades,
  strategies,
}: {
  trades: Trade[];
  strategies: Strategy[];
}) {
  const breaks = trades.filter(
      (t) =>
        t.followedRules.length <
        (strategies.find((s) => s.id === t.strategyId)?.rules.length ?? 4),
    ),
    best = [...trades].sort((a, b) => b.pnl - a.pnl)[0];
  const mistakeCounts = new Map<string, number>();
  const fixes: Record<string, string> = {
    FOMO: "Require the full entry checklist and a planned price before placing the order.",
    Rushed: "Use a two-minute pause and wait for the candle confirmation.",
    Greed:
      "Define the target before entry and do not move it without a market-structure reason.",
    Boredom:
      "Trade only during your planned session and require a named setup.",
    "No bias": "Write the higher-timeframe bias before the session starts.",
    "Early trigger":
      "Wait for confirmation; a missed trade is cheaper than an invalid entry.",
    Hesitant:
      "Predefine size and invalidation so execution becomes mechanical.",
    Revenge:
      "Stop the session after the loss limit and review before taking another trade.",
    "Other mistake":
      "Describe the trigger precisely in notes and turn it into a checklist rule.",
  };
  trades.forEach((trade) => {
    if (!["Focused", "Calm", "Confident"].includes(trade.emotion))
      mistakeCounts.set(
        trade.emotion,
        (mistakeCounts.get(trade.emotion) || 0) + 1,
      );
    const strategy = strategies.find((item) => item.id === trade.strategyId);
    strategy?.rules
      .filter((rule) => !trade.followedRules.includes(rule.id))
      .forEach((rule) =>
        mistakeCounts.set(
          `Missed: ${rule.text}`,
          (mistakeCounts.get(`Missed: ${rule.text}`) || 0) + 1,
        ),
      );
  });
  const patterns = [...mistakeCounts.entries()].sort((a, b) => b[1] - a[1]);
  const ruleBreakDays = new Set(breaks.map((t) => t.date)).size;
  return (
    <div className="page-content narrow">
      <div className="review-hero card">
        <Sparkles size={22} />
        <div>
          <p className="eyebrow">AUTOMATIC REVIEW</p>
          <h2>Your process is strongest when you wait for confirmation.</h2>
          <p>
            {breaks.length} of {trades.length} trades contained at least one
            missed rule. Review those trades before your next session.
          </p>
        </div>
      </div>
      <div className="review-grid">
        <div className="card pattern-card">
          <SectionTitle
            title="Repeated mistake warnings"
            subtitle="Patterns found across your journal"
          />
          {patterns.length ? (
            patterns.slice(0, 5).map(([name, count]) => (
              <div className="pattern-row" key={name}>
                <AlertTriangle size={17} />
                <div>
                  <strong>{name}</strong>
                  <p>
                    Appeared in {count} {count === 1 ? "trade" : "trades"}.{" "}
                    {fixes[name] ??
                      "Review the affected trades and add a preventative rule to your strategy."}
                  </p>
                </div>
                <span>{count}×</span>
              </div>
            ))
          ) : (
            <p className="review-copy">
              No repeated mistake pattern has been detected yet.
            </p>
          )}
        </div>
        <div className="card compliance-card">
          <SectionTitle
            title="Rule-following streak"
            subtitle="Days that need deliberate review"
          />
          <strong>{ruleBreakDays}</strong>
          <p>
            trading {ruleBreakDays === 1 ? "day" : "days"} included at least one
            missed strategy rule.
          </p>
          <div>
            {breaks.length} of {trades.length} trades were not fully compliant.
          </div>
        </div>
        <div className="card">
          <SectionTitle title="What worked" subtitle="Repeat this" />
          <p className="review-copy">
            Your best recorded trade was <strong>{best?.symbol || "—"}</strong>{" "}
            at <strong className="positive">+{best?.pnl || 0}</strong>. Fully
            compliant trades show the clearest positive expectancy.
          </p>
        </div>
        <div className="card">
          <SectionTitle
            title="Focus next"
            subtitle="One actionable improvement"
          />
          <p className="review-copy">
            Use the checklist before entry—not after the trade. If confirmation
            is missing, record the idea as a skipped trade instead.
          </p>
        </div>
      </div>
    </div>
  );
}
const weeklyQuestions = [
  "What were my most common mistakes?",
  "How will I avoid them next week?",
  "What emotion hijacked my decisions?",
  "Which setups worked best—and why?",
  "Which rules did I fail to follow?",
  "What is the single behavior I will improve next week?",
];
function mondayFor(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`),
    offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function weekLabel(start: string) {
  const from = new Date(`${start}T12:00:00`),
    to = new Date(from);
  to.setDate(to.getDate() + 6);
  return `${from.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}
function WeeklyImprovement({
  reviews,
  setReviews,
}: {
  reviews: WeeklyReview[];
  setReviews: (reviews: WeeklyReview[]) => void;
}) {
  const [editing, setEditing] = useState<WeeklyReview | null>(null),
    [viewer, setViewer] = useState<string | null>(null);
  const create = () =>
    setEditing({
      id: uid(),
      weekStart: mondayFor(today),
      notes: "",
      answers: weeklyQuestions.map(() => ""),
      goals: "• ",
      screenshots: [],
    });
  const addPhotos = async (files: File[]) => {
    if (!editing) return;
    const urls = await Promise.all(
      files
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, 6 - editing.screenshots.length)
        .map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = reject;
              reader.onload = () => resolve(String(reader.result));
              reader.readAsDataURL(file);
            }),
        ),
    );
    setEditing({
      ...editing,
      screenshots: [...editing.screenshots, ...urls].slice(0, 6),
    });
  };
  return (
    <div className="page-content weekly-page">
      <div className="intro">
        <h2>Weekly improvement</h2>
        <p>
          Turn each trading week into one clear lesson and one deliberate goal.
        </p>
      </div>
      <div className="weekly-grid">
        <button className="weekly-add card" onClick={create}>
          <Plus size={28} />
          <strong>New weekly review</strong>
          <span>Notes, goals and charts</span>
        </button>
        {[...reviews]
          .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
          .map((review) => (
            <button
              className="weekly-card card"
              key={review.id}
              onClick={() => setEditing(review)}
            >
              <span>{weekLabel(review.weekStart)}</span>
              <strong>
                {review.goals.replace(/[•#]/g, "").trim().slice(0, 54) ||
                  "Weekly reflection"}
              </strong>
              <small>{review.screenshots.length} charts attached</small>
            </button>
          ))}
      </div>
      {editing && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="modal weekly-modal">
            <div className="modal-head">
              <div>
                <p className="eyebrow">WEEKLY REVIEW</p>
                <h2>{weekLabel(editing.weekStart)}</h2>
              </div>
              <button className="icon-btn" onClick={() => setEditing(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <label>
                Week containing
                <JournalDatePicker
                  value={editing.weekStart}
                  onChange={(value) =>
                    setEditing({ ...editing, weekStart: mondayFor(value) })
                  }
                />
              </label>
              <div className="weekly-questions">
                {weeklyQuestions.map((question, index) => (
                  <label key={question}>
                    <span>{question}</span>
                    <textarea
                      rows={3}
                      placeholder="Write your answer…"
                      value={(editing.answers ?? [])[index] ?? ""}
                      onChange={(e) => {
                        const answers = [
                          ...(editing.answers ?? weeklyQuestions.map(() => "")),
                        ];
                        answers[index] = e.target.value;
                        setEditing({ ...editing, answers });
                      }}
                    />
                  </label>
                ))}
              </div>
              <label>
                Goals for next week
                <textarea
                  rows={5}
                  value={editing.goals}
                  onChange={(e) =>
                    setEditing({ ...editing, goals: e.target.value })
                  }
                />
              </label>
              <label className="weekly-upload">
                Charts and screenshots
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    void addPhotos(Array.from(e.target.files || []));
                    e.target.value = "";
                  }}
                />
                <span>
                  <ImagePlus size={18} /> Add up to 6 screenshots
                </span>
              </label>
              {editing.screenshots.length > 0 && (
                <div className="weekly-images">
                  {editing.screenshots.map((src, i) => (
                    <button key={i} onClick={() => setViewer(src)}>
                      <img src={src} />
                      <span>{i + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <span>Stored locally</span>
              <div>
                <button className="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button
                  className="primary"
                  onClick={() => {
                    setReviews(
                      reviews.some((r) => r.id === editing.id)
                        ? reviews.map((r) =>
                            r.id === editing.id ? editing : r,
                          )
                        : [...reviews, editing],
                    );
                    setEditing(null);
                  }}
                >
                  Save weekly review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {viewer && (
        <div
          className="image-viewer"
          onMouseDown={(e) => e.target === e.currentTarget && setViewer(null)}
        >
          <button onClick={() => setViewer(null)}>
            <X size={20} />
          </button>
          <img src={viewer} />
        </div>
      )}
    </div>
  );
}
function SelectMenu({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const chosen = options.find((x) => x.value === value)?.label || value;
  return (
    <div
      className={`select-menu ${open ? "open" : ""}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>{chosen}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="select-options">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={option.value === value ? "selected" : ""}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
const themeChoices: { value: ThemeName; label: string; color: string }[] = [
  { value: "emerald", label: "Emerald", color: "#67e8b6" },
  { value: "purple", label: "Purple", color: "#a78bfa" },
  { value: "sky", label: "Sky blue", color: "#62c8f3" },
  { value: "rose", label: "Rose", color: "#fb7185" },
  { value: "amber", label: "Amber", color: "#f4b85b" },
];
function SettingsView({
  value,
  onChange,
  theme,
  setTheme,
  accent,
  setAccent,
  trades,
  strategies,
  onImportMt5,
  onRefreshMt5,
}: {
  value: AppSettings;
  onChange: (v: AppSettings) => void;
  theme: "light" | "dark";
  setTheme: (v: "light" | "dark") => void;
  accent: ThemeName;
  setAccent: (v: ThemeName) => void;
  trades: Trade[];
  strategies: Strategy[];
  onImportMt5: (trades: Mt5Import[]) => number;
  onRefreshMt5: (trades: Mt5Import[]) => void;
}) {
  const [dataStatus, setDataStatus] = useState("");
  const [mt5Status, setMt5Status] = useState("Not checked yet");
  const [mt5Preview, setMt5Preview] = useState<Mt5Import[]>([]);
  const [mt5Path, setMt5Path] = useState("");
  const [mt5GuideVisible, setMt5GuideVisible] = useState(false);
  const installMt5 = async () => {
    setMt5Status("Installing the local exporter…");
    try {
      const paths = await invoke<string[]>("install_mt5_connector");
      setMt5GuideVisible(true);
      setMt5Status(`Exporter installed into ${paths.length} MT5 profile${paths.length === 1 ? "" : "s"}. MetaEditor has been opened with BETTERTRADES_Sync.`);
      setMt5Path(paths[0] ?? "");
    } catch (error) {
      setMt5Status(String(error));
    }
  };
  const checkMt5 = async () => {
    setMt5Status("Checking MT5 local export…");
    try {
      const result = await invoke<Mt5SyncResult>("sync_mt5");
      setMt5Path(result.path);
      if (!result.found) {
        setMt5Preview([]);
        setMt5Status("Exporter file not found. Install and run the BETTERTRADES EA in MT5 first.");
        return;
      }
      const account = parseMt5Account(result.content);
      if (account) onChange({ ...value, mt5Balance: account.balance, mt5Equity: account.equity, mt5Login: account.login, mt5Server: account.server, currency: account.currency || value.currency });
      const parsed = parseMt5Export(result.content, value.timeZone ?? "EST");
      onRefreshMt5(parsed);
      const known = new Set(trades.map((trade) => trade.mt5DealId).filter(Boolean));
      const fresh = parsed.filter((trade) => !known.has(trade.mt5DealId));
      setMt5Preview(fresh);
      const accountText = account ? ` Balance ${money(account.balance, account.currency || value.currency)}.` : "";
      setMt5Status(fresh.length ? `${fresh.length} new closed trade${fresh.length === 1 ? "" : "s"} ready to import.${accountText}` : `Connected — ${parsed.length} MT5 trade${parsed.length === 1 ? "" : "s"} found, all already imported.${accountText}`);
    } catch (error) {
      setMt5Status(`MT5 check failed: ${String(error)}`);
    }
  };
  return (
    <div className="page-content settings-page">
      <div className="settings-grid">
        <section>
          <div className="intro">
            <h2>Trading account</h2>
            <p>These values power risk limits, returns, and sizing guidance.</p>
          </div>
          <div className="card form-card">
            <label>
              Account name
              <input
                value={value.accountName}
                onChange={(e) =>
                  onChange({ ...value, accountName: e.target.value })
                }
              />
            </label>
            <div className="form-row">
              <label>
                Starting balance
                <input
                  type="number"
                  value={value.accountSize}
                  onChange={(e) =>
                    onChange({ ...value, accountSize: +e.target.value })
                  }
                />
              </label>
              <label>
                Currency
                <SelectMenu
                  label="Currency"
                  value={value.currency}
                  onChange={(currency) => onChange({ ...value, currency })}
                  options={["USD", "EUR", "GBP", "PKR"].map((x) => ({
                    value: x,
                    label: x,
                  }))}
                />
              </label>
            </div>
            <label>
              Trading time zone
              <SelectMenu
                label="Trading time zone"
                value={value.timeZone ?? "EST"}
                onChange={(timeZone) =>
                  onChange({ ...value, timeZone: timeZone as "EST" | "local" })
                }
                options={[
                  { value: "EST", label: "Eastern Time (EST/EDT)" },
                  { value: "local", label: "Local computer time" },
                ]}
              />
              <small>
                Trade times and time-performance analytics use this zone.
              </small>
            </label>
            <label>
              Default risk per trade (%)
              <input
                type="number"
                step="0.1"
                value={value.defaultRiskPercent}
                onChange={(e) =>
                  onChange({ ...value, defaultRiskPercent: +e.target.value })
                }
              />
              <small>
                Suggested risk:{" "}
                {money(
                  ((value.mt5Balance ?? value.accountSize) * value.defaultRiskPercent) / 100,
                  value.currency,
                )}
              </small>
            </label>
            {value.mt5Balance !== undefined && (
              <div className="mt5-account-readout">
                <span>MT5 synced account</span>
                <strong>{money(value.mt5Balance, value.currency)} balance</strong>
                <small>{value.mt5Login}{value.mt5Server ? ` · ${value.mt5Server}` : ""}{value.mt5Equity !== undefined ? ` · ${money(value.mt5Equity, value.currency)} equity` : ""}</small>
              </div>
            )}
          </div>
        </section>
        <section>
          <div className="intro">
            <h2>Appearance</h2>
            <p>Choose the atmosphere that helps you focus.</p>
          </div>
          <div className="card theme-card">
            <div className="mode-switch">
              <button
                className={theme === "dark" ? "active" : ""}
                onClick={() => setTheme("dark")}
              >
                <Moon size={16} />
                Dark
              </button>
              <button
                className={theme === "light" ? "active" : ""}
                onClick={() => setTheme("light")}
              >
                <Sun size={16} />
                Light
              </button>
            </div>
            <div className="theme-swatches">
              {themeChoices.map((choice) => (
                <button
                  key={choice.value}
                  className={accent === choice.value ? "active" : ""}
                  onClick={() => setAccent(choice.value)}
                >
                  <i style={{ background: choice.color }} />
                  {choice.label}
                  {accent === choice.value && <Check size={15} />}
                </button>
              ))}
            </div>
            <div className="text-size-setting">
              <div>
                <span>Text size</span>
                <strong>{Math.round((value.textScale ?? 1) * 100)}%</strong>
              </div>
              <input
                aria-label="Text size"
                type="range"
                min="0.9"
                max="1.2"
                step="0.05"
                value={value.textScale ?? 1}
                onInput={(e) =>
                  onChange({
                    ...value,
                    textScale: +(e.target as HTMLInputElement).value,
                  })
                }
              />
              <small>
                Default is 100%. Increase it for more comfortable reading.
              </small>
            </div>
          </div>
        </section>
      </div>
      <section className="card mt5-card">
        <div className="mt5-card-head">
          <span className="mt5-icon"><Cable size={20} /></span>
          <div><h3>MetaTrader 5 local sync</h3><p>MT5 stays responsible for your login. BETTERTRADES only reads the closed-trade export stored on this PC.</p></div>
          <div className="mt5-actions"><button className="secondary" onClick={() => void installMt5()}><Download size={16} /> Install exporter</button><button className="secondary" onClick={() => void checkMt5()}><RefreshCw size={16} /> Check for trades</button></div>
        </div>
        <div className="mt5-status"><i className={mt5Preview.length ? "ready" : ""} /><span><strong>{mt5Status}</strong>{mt5Path && <small>{mt5Path}</small>}</span></div>
        {mt5GuideVisible && <div className="mt5-guide">
          <strong>Finish setup — about 30 seconds</strong>
          <ol>
            <li><span>1</span><div>In the MetaEditor window that just opened, press <kbd>F7</kbd> to compile.<small>The bottom panel should report 0 errors.</small></div></li>
            <li><span>2</span><div>Return to MetaTrader 5 and press <kbd>Ctrl</kbd> + <kbd>N</kbd> to open Navigator.</div></li>
            <li><span>3</span><div>Right-click <b>Expert Advisors</b>, choose <b>Refresh</b>, then expand <b>BETTERTRADES</b>.</div></li>
            <li><span>4</span><div>Drag <b>BETTERTRADES_Sync</b> onto any chart and enable <b>Algo Trading</b>.</div></li>
            <li><span>5</span><div>Come back here and click <b>Check for trades</b>.</div></li>
          </ol>
        </div>}
        {mt5Preview.length > 0 && <>
          <div className="mt5-preview">
            {mt5Preview.slice(0, 8).map((trade) => <div key={trade.mt5DealId}><span><strong>{trade.symbol}</strong><small>{trade.date} · {trade.time} · {trade.direction}</small></span><strong className={trade.pnl >= 0 ? "positive" : "negative"}>{money(trade.pnl, value.currency)}</strong></div>)}
            {mt5Preview.length > 8 && <small>And {mt5Preview.length - 8} more…</small>}
          </div>
          <button className="primary" onClick={() => { const count = onImportMt5(mt5Preview); setMt5Preview([]); setMt5Status(`${count} trade${count === 1 ? "" : "s"} imported. Open Trades to review risk, strategy, psychology and notes.`); }}><Download size={16} /> Import {mt5Preview.length} new trade{mt5Preview.length === 1 ? "" : "s"}</button>
        </>}
        <small className="mt5-note">Current strategy for imports: {strategies[0]?.name ?? "None"}. Imported trades start with zero risk until you review them.</small>
      </section>
      <div className="settings-support-grid">
        <section className="card data-tools">
          <div>
            <h3>Backup and restore</h3>
            <p>
              Everything—including trades, strategies, weekly reviews, notes and
              embedded photos—is packed into one compressed BETTERTRADES file.
            </p>
          </div>
          <div>
            <button
              className="secondary"
              onClick={async () => {
                try {
                  if (await backupJournalData())
                    setDataStatus("Backup created successfully.");
                } catch (error) {
                  setDataStatus(`Backup failed: ${String(error)}`);
                }
              }}
            >
              <Download size={16} /> Backup journal
            </button>
            <button
              className="secondary"
              onClick={async () => {
                try {
                  await restoreJournalData();
                } catch (error) {
                  setDataStatus(`Restore failed: ${String(error)}`);
                }
              }}
            >
              <Upload size={16} /> Restore backup
            </button>
          </div>
          {dataStatus && <small>{dataStatus}</small>}
        </section>
        <section className="card creator-card">
          <img src={bettertradesLogo} alt="BETTERTRADES logo" />
          <div>
            <h3>BETTERTRADES</h3>
            <p>A Trading Journal by Eleventrades</p>
            <div className="social-links">
              <button
                title="Eleventrades on X"
                onClick={() => void openUrl("https://x.com/Eleven_trades")}
              >
                <XLogo />
              </button>
              <button
                title="Eleventrades on YouTube"
                onClick={() =>
                  void openUrl("https://www.youtube.com/@Eleven_trades")
                }
              >
                <YouTubeLogo />
              </button>
              <button
                title="Eleventrades Discord"
                onClick={() =>
                  void openUrl("https://discord.com/invite/rZpKfwMKyh")
                }
              >
                <DiscordLogo />
              </button>
            </div>
          </div>
          <span>Version 1.0.3</span>
        </section>
      </div>
      <div className="card local-note">
        <ShieldCheck size={22} />
        <div>
          <strong>Local-only storage</strong>
          <p>
            Your journal remains in Local AppData on this device. Photos are
            embedded inside the journal data and do not appear as loose files.
          </p>
        </div>
        <button className="secondary" onClick={() => void invoke("open_journal_data_folder")}>
          Open journal data folder
        </button>
      </div>
    </div>
  );
}
function JournalDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = new Date(`${value}T12:00:00`);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );
  const cells = calendarDays(month);
  const choose = (day: number) => {
    onChange(
      `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
    setOpen(false);
  };
  return (
    <div className="journal-date-picker">
      <button
        type="button"
        className="picker-trigger"
        onClick={() => setOpen(!open)}
      >
        <span>{selected.toLocaleDateString("en-GB")}</span>
        <CalendarDays size={15} />
      </button>
      {open && (
        <div className="date-popover card">
          <div className="date-popover-head">
            <button
              type="button"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
            >
              <ChevronLeft size={15} />
            </button>
            <strong>
              {month.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              type="button"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="date-weekdays">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={`${d}${i}`}>{d}</span>
            ))}
          </div>
          <div className="date-days">
            {cells.map((day, i) =>
              day ? (
                <button
                  type="button"
                  key={i}
                  className={
                    value ===
                    `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                      ? "selected"
                      : ""
                  }
                  onClick={() => choose(day)}
                >
                  {day}
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>
          <button
            type="button"
            className="date-today"
            onClick={() => {
              onChange(today);
              setOpen(false);
            }}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}

function JournalTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [rawHour, rawMinute] = (value || "09:30").split(":").map(Number);
  const period = rawHour >= 12 ? "PM" : "AM";
  const hour = String(rawHour % 12 || 12).padStart(2, "0");
  const minute = String(rawMinute || 0).padStart(2, "0");
  const updateTime = (
    nextHour = hour,
    nextMinute = minute,
    nextPeriod = period,
  ) => {
    let h = Number(nextHour) % 12;
    if (nextPeriod === "PM") h += 12;
    onChange(`${String(h).padStart(2, "0")}:${nextMinute}`);
  };
  return (
    <div className="journal-time-picker">
      <SelectMenu
        label="Hour"
        value={hour}
        onChange={(v) => updateTime(v, minute, period)}
        options={Array.from({ length: 12 }, (_, i) => {
          const v = String(i + 1).padStart(2, "0");
          return { value: v, label: v };
        })}
      />
      <span>:</span>
      <SelectMenu
        label="Minute"
        value={minute}
        onChange={(v) => updateTime(hour, v, period)}
        options={[
          "00",
          "05",
          "10",
          "15",
          "20",
          "25",
          "30",
          "35",
          "40",
          "45",
          "50",
          "55",
        ].map((v) => ({ value: v, label: v }))}
      />
      <SelectMenu
        label="AM or PM"
        value={period}
        onChange={(v) => updateTime(hour, minute, v)}
        options={["AM", "PM"].map((v) => ({ value: v, label: v }))}
      />
    </div>
  );
}

function TradeModal({
  date,
  trade,
  strategies,
  settings,
  onClose,
  onSave,
}: {
  date: string;
  trade: Trade | null;
  strategies: Strategy[];
  settings: AppSettings;
  onClose: () => void;
  onSave: (t: Trade) => void;
}) {
  const [f, setF] = useState({
      isNoTradeDay: trade?.kind === "no-trade",
      calculationMode: "easy" as "easy" | "advanced",
      date: trade?.date ?? date,
      time: trade?.time ?? currentTimeFor(settings.timeZone ?? "EST"),
      symbol: trade?.symbol ?? "",
      direction: trade?.direction ?? ("Long" as "Long" | "Short"),
      entry: trade ? String(trade.entry) : "",
      exit: trade ? String(trade.exit) : "",
      quantity: trade ? String(trade.quantity) : "1",
      fees: trade ? String(trade.fees) : "0",
      manualPnl: trade ? String(trade.pnl) : "",
      risk: trade
        ? String(trade.risk)
        : String(((settings.mt5Balance ?? settings.accountSize) * settings.defaultRiskPercent) / 100),
      strategyId: trade?.strategyId ?? strategies[0]?.id ?? "",
      emotion: trade?.emotion ?? "Focused",
      notes: trade?.notes ?? "<ul><li><br></li></ul>",
      followedRules: trade?.followedRules ?? ([] as string[]),
      screenshots:
        trade?.screenshots ?? (trade?.screenshot ? [trade.screenshot] : []),
    }),
    selected = strategies.find((s) => s.id === f.strategyId),
    pnl =
      f.isNoTradeDay
        ? 0
        : f.calculationMode === "easy"
        ? +f.manualPnl || 0
        : (+f.exit - +f.entry) *
            (f.direction === "Long" ? 1 : -1) *
            +f.quantity -
          +f.fees,
    update = (key: string, value: unknown) =>
      setF((previous) => ({
        ...previous,
        notes: notesHtmlRef.current,
        [key]: value,
      })),
    submit = () => {
      if (
        f.isNoTradeDay ||
        (f.symbol &&
          (f.calculationMode === "easy"
            ? f.manualPnl !== ""
            : Boolean(f.entry && f.exit)))
      )
        onSave({
          id: trade?.id ?? uid(),
          kind: f.isNoTradeDay ? "no-trade" : "trade",
          date: f.date,
          time: f.time,
          symbol: f.isNoTradeDay ? "NO TRADE" : f.symbol.toUpperCase(),
          direction: f.direction,
          entry: +f.entry,
          exit: +f.exit,
          quantity: +f.quantity,
          fees: +f.fees,
          pnl: f.isNoTradeDay ? 0 : pnl,
          risk: f.isNoTradeDay ? 0 : +f.risk,
          strategyId: f.isNoTradeDay ? "" : f.strategyId,
          emotion: f.isNoTradeDay ? "Focused" : f.emotion,
          notes: notesHtmlRef.current,
          followedRules: f.isNoTradeDay ? [] : f.followedRules,
          screenshots: f.screenshots.length ? f.screenshots : undefined,
          screenshot: f.screenshots[0] || undefined,
        });
    };
  const notesRef = useRef<HTMLDivElement>(null);
  const notesHtmlRef = useRef(f.notes);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const imageToLocalData = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          const scale = Math.min(1, 1800 / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          canvas
            .getContext("2d")
            ?.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/webp", 0.86));
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  const filesToDataUrls = async (files: File[]) =>
    Promise.all(files.slice(0, 6 - f.screenshots.length).map(imageToLocalData));
  const addImageFiles = async (files: File[]) => {
    const urls = await filesToDataUrls(
      files.filter((file) => file.type.startsWith("image/")),
    );
    setF((previous) => ({
      ...previous,
      notes: notesHtmlRef.current,
      screenshots: [...previous.screenshots, ...urls].slice(0, 6),
    }));
  };
  const pasteImages = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (files.length) {
      event.preventDefault();
      await addImageFiles(files);
    }
  };
  const formatNotes = (command: string, value?: string) => {
    const el = notesRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, value);
    notesHtmlRef.current = el.innerHTML;
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">
              {f.isNoTradeDay ? "NO-TRADE DAY" : trade ? "TRADE DETAILS" : "NEW EXECUTION"}
            </p>
            <h2>
              {f.isNoTradeDay
                ? "Journal a no-trade day"
                : trade
                  ? `Edit ${trade.symbol}`
                  : "Journal a trade"}
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="no-trade-toggle">
            <div>
              <strong>No trade day</strong>
              <small>Record an intentional day off without affecting P&amp;L, rules, or statistics.</small>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={f.isNoTradeDay}
              className={f.isNoTradeDay ? "active" : ""}
              onClick={() => update("isNoTradeDay", !f.isNoTradeDay)}
            >
              <span />
            </button>
          </div>
          <div className={`form-row ${f.isNoTradeDay ? "one" : "three"}`}>
            <label>
              Date
              <JournalDatePicker
                value={f.date}
                onChange={(value) => update("date", value)}
              />
            </label>
            {!f.isNoTradeDay && <label>
              Time
              <JournalTimePicker
                value={f.time}
                onChange={(value) => update("time", value)}
              />
            </label>}
            {!f.isNoTradeDay && <>
            <label>
              Symbol
              <input
                autoFocus
                placeholder="NQ"
                value={f.symbol}
                onChange={(e) => update("symbol", e.target.value)}
              />
            </label>
            <label>
              Direction
              <SelectMenu
                label="Direction"
                value={f.direction}
                onChange={(direction) => update("direction", direction)}
                options={["Long", "Short"].map((x) => ({ value: x, label: x }))}
              />
            </label>
            </>}
          </div>
          {!f.isNoTradeDay && <>
          <div className="calculation-mode">
            <span>Trade calculation</span>
            <div>
              <button
                type="button"
                className={f.calculationMode === "easy" ? "active" : ""}
                onClick={() => update("calculationMode", "easy")}
              >
                Easy
              </button>
              <button
                type="button"
                className={f.calculationMode === "advanced" ? "active" : ""}
                onClick={() => update("calculationMode", "advanced")}
              >
                Advanced
              </button>
            </div>
            <small>
              {f.calculationMode === "easy"
                ? "Enter your final P&L and risk; R:R is calculated automatically."
                : "Calculate P&L from entry, exit, quantity and fees."}
            </small>
          </div>
          <div className="form-row">
            {(f.calculationMode === "easy"
              ? ["manualPnl", "risk"]
              : ["entry", "exit", "quantity", "fees"]
            ).map((k) => (
              <label key={k}>
                {k === "manualPnl"
                  ? "Final P&L"
                  : k === "risk"
                    ? "Risk amount"
                    : k[0].toUpperCase() + k.slice(1)}
                <input
                  type="number"
                  value={f[k as keyof typeof f] as string}
                  onChange={(e) => update(k, e.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="result-strip">
            <span>
              CALCULATED P&L
              <strong className={pnl >= 0 ? "positive" : "negative"}>
                {money(pnl, settings.currency)}
              </strong>
            </span>
            <span>
              PLANNED RISK<strong>{money(+f.risk, settings.currency)}</strong>
            </span>
            <span>
              RESULT
              <strong>{+f.risk ? (pnl / +f.risk).toFixed(2) : "0.00"}R</strong>
            </span>
          </div>
          <div className="form-row">
            <label>
              Strategy
              <SelectMenu
                label="Strategy"
                value={f.strategyId}
                onChange={(strategyId) => update("strategyId", strategyId)}
                options={strategies.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
              />
            </label>
            <label>
              Psychology
              <SelectMenu
                label="Psychology"
                value={f.emotion}
                onChange={(emotion) => update("emotion", emotion)}
                options={[
                  "Focused",
                  "Calm",
                  "Confident",
                  "Hesitant",
                  "Rushed",
                  "FOMO",
                  "Early trigger",
                  "Greed",
                  "Boredom",
                  "No bias",
                  "Revenge",
                  "Other mistake",
                ].map((x) => ({ value: x, label: x }))}
              />
            </label>
            {f.calculationMode === "advanced" && (
              <label>
                Risk amount
                <input
                  type="number"
                  value={f.risk}
                  onChange={(e) => update("risk", e.target.value)}
                />
              </label>
            )}
          </div>
          {selected && (
            <div className="checklist">
              <div>
                <strong>Strategy checklist</strong>
                <small>
                  {f.followedRules.length} of {selected.rules.length} followed
                </small>
              </div>
              {selected.rules.map((r) => (
                <label
                  key={r.id}
                  className={f.followedRules.includes(r.id) ? "checked" : ""}
                >
                  <input
                    type="checkbox"
                    checked={f.followedRules.includes(r.id)}
                    onChange={() =>
                      update(
                        "followedRules",
                        f.followedRules.includes(r.id)
                          ? f.followedRules.filter((x) => x !== r.id)
                          : [...f.followedRules, r.id],
                      )
                    }
                  />
                  <span>
                    <Check size={14} />
                  </span>
                  {r.text}
                </label>
              ))}
            </div>
          )}
          </>}
          <div className="notes-field">
            <span>Notes</span>
            <div className="notes-toolbar" aria-label="Note formatting">
              <button
                type="button"
                title="Bold"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatNotes("bold")}
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                title="Italic"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatNotes("italic")}
              >
                <Italic size={15} />
              </button>
              <button
                type="button"
                title="Heading"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatNotes("formatBlock", "h2")}
              >
                <Heading2 size={16} />
              </button>
              <span />
              <button
                type="button"
                title="Bullet list"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatNotes("insertUnorderedList")}
              >
                <List size={16} />
              </button>
              <button
                type="button"
                title="Numbered list"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatNotes("insertOrderedList")}
              >
                <ListOrdered size={16} />
              </button>
              <button
                type="button"
                title="Highlight"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatNotes("backColor", "#6ee7b744")}
              >
                <Highlighter size={15} />
              </button>
            </div>
            <div
              ref={notesRef}
              className="rich-notes-editor"
              contentEditable
              suppressContentEditableWarning
              aria-label="Notes"
              data-placeholder="What did you see, feel, and learn?"
              dangerouslySetInnerHTML={{ __html: f.notes }}
              onInput={(e) => {
                notesHtmlRef.current = e.currentTarget.innerHTML;
              }}
            />
          </div>
          <div
            className={`screenshot-drop ${f.screenshots.length ? "has-images" : ""}`}
            tabIndex={0}
            onPaste={pasteImages}
            onDoubleClick={() => imageInputRef.current?.click()}
          >
            <input
              ref={imageInputRef}
              className="image-file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                void addImageFiles(Array.from(e.target.files || []));
                e.target.value = "";
              }}
            />
            {f.screenshots.length ? (
              <div className="screenshot-grid">
                {f.screenshots.map((src, index) => (
                  <div key={`${src.slice(-16)}-${index}`}>
                    <img
                      src={src}
                      alt={`Trade screenshot ${index + 1}`}
                      onClick={() => setViewerImage(src)}
                    />
                    <button
                      type="button"
                      title={`Remove screenshot ${index + 1}`}
                      onClick={() =>
                        update(
                          "screenshots",
                          f.screenshots.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <X size={13} />
                    </button>
                    <span>{index + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <ImagePlus size={22} />
                <span>
                  <strong>Add TradingView screenshots</strong>
                  <small>
                    Single-click, then Ctrl+V · Double-click to browse · Up to 6
                  </small>
                </span>
              </>
            )}
            {f.screenshots.length > 0 && f.screenshots.length < 6 && (
              <small className="image-count">
                {f.screenshots.length}/6 · Ctrl+V or double-click for more
              </small>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <span>Stored locally on this device</span>
          <div>
            <button className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" onClick={submit}>
              {f.isNoTradeDay
                ? "Save no-trade day"
                : trade
                  ? "Save changes"
                  : "Save trade"}
            </button>
          </div>
        </div>
      </div>
      {viewerImage && (
        <div
          className="image-viewer"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setViewerImage(null)
          }
        >
          <button
            type="button"
            title="Close image"
            onClick={() => setViewerImage(null)}
          >
            <X size={20} />
          </button>
          <img src={viewerImage} alt="Trade screenshot full view" />
        </div>
      )}
    </div>
  );
}
