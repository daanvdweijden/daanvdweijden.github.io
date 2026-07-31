// ---------------------------------------------------------------------------
// The "Puzzles" easter egg page. Reads the build artifacts written by
// scripts/build_feed.py (data/activity.json), the NRC Crux fetcher
// (data/crux_stats.json), and the raw NYT Mini fetcher CSV (data/mini_scores.csv)
// — no live fetching, just shaping for display.
// ---------------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import activity from '../../data/activity.json';
import cruxStatsData from '../../data/crux_stats.json';

export interface GameMeta {
  label: string;
  source: 'nyt' | 'nrc';
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  played: string[]; // game slugs, see GameMeta
}

export interface Activity {
  generated: string;
  mini_streak: number;
  game_meta: Record<string, GameMeta>;
  days: ActivityDay[];
}

export interface CruxStats {
  snapshot_date: string;
  games_played: number;
  games_won: number;
  win_percentage: number;
  average_seconds: number;
  average_time: string;
  fastest_seconds: number;
  fastest_time: string;
  crux_streak_current: number;
  crux_streak_max: number;
}

export const cruxStats = cruxStatsData as CruxStats;

export function getActivity(): Activity {
  return activity as Activity;
}

/** slug -> number of days that game was played, across all recorded history. */
export function gameCounts(a: Activity): { slug: string; label: string; source: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const day of a.days) {
    for (const slug of day.played) counts[slug] = (counts[slug] ?? 0) + 1;
  }
  return Object.entries(a.game_meta)
    .map(([slug, meta]) => ({ slug, label: meta.label, source: meta.source, count: counts[slug] ?? 0 }))
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function totalPuzzlesSolved(a: Activity): number {
  return a.days.reduce((sum, d) => sum + d.played.length, 0);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const toUTC = (iso: string) => new Date(`${iso}T00:00:00Z`);
const fromUTC = (t: number) => new Date(t).toISOString().slice(0, 10);

export interface Cell {
  date: string;
  count: number;
  played: string[];
}

/**
 * A continuous, zero-filled day-by-day array from the earliest recorded day
 * through `a.generated` (inclusive) — the calendar needs blank days too,
 * not just the ones with puzzles played.
 */
export function buildCells(a: Activity): Cell[] {
  if (a.days.length === 0) return [];
  const byDate = new Map(a.days.map((d) => [d.date, d.played]));
  const earliest = a.days.reduce((min, d) => (d.date < min ? d.date : min), a.days[0].date);
  const start = toUTC(earliest).getTime();
  const end = toUTC(a.generated).getTime();
  const cells: Cell[] = [];
  for (let t = start; t <= end; t += DAY_MS) {
    const date = fromUTC(t);
    const played = byDate.get(date) ?? [];
    cells.push({ date, count: played.length, played });
  }
  return cells;
}

export type Week = (Cell | null)[]; // always length 7, Sun..Sat; null = padding

export interface Calendar {
  weeks: Week[];
  /** month label per week column; '' when no label belongs above that column */
  monthLabels: string[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Lay a run of cells out GitHub-contributions-style: columns of weeks, Sun-first rows. */
export function buildCalendar(cells: Cell[]): Calendar {
  if (cells.length === 0) return { weeks: [], monthLabels: [] };

  const first = toUTC(cells[0].date);
  const leadingBlanks = first.getUTCDay(); // 0 = Sunday
  const padded: (Cell | null)[] = [...Array(leadingBlanks).fill(null), ...cells];
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: Week[] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7) as Week);

  // Require at least 2 columns between labels so adjacent month abbreviations
  // (e.g. "Jun" / "Jul" one column apart on a short 7D view) never overlap.
  let lastMonth = -1;
  let lastLabelCol = -Infinity;
  const monthLabels = weeks.map((week, i) => {
    const firstReal = week.find((c): c is Cell => c !== null);
    if (!firstReal) return '';
    const month = toUTC(firstReal.date).getUTCMonth();
    if (month === lastMonth) return '';
    lastMonth = month;
    if (i - lastLabelCol < 2) return '';
    lastLabelCol = i;
    return MONTHS[month];
  });

  return { weeks, monthLabels };
}

export function lastNDays(cells: Cell[], n: number): Cell[] {
  return cells.slice(-n);
}

/** 0..4 intensity bucket for heatmap cell coloring. */
export function bucket(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function tooltip(cell: Cell, a: Activity): string {
  const d = toUTC(cell.date);
  const label = `${WEEKDAY[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  if (cell.played.length === 0) return `${label}: nothing solved`;
  const names = cell.played.map((slug) => a.game_meta[slug]?.label ?? slug);
  return `${label}: ${names.join(', ')}`;
}

/** 'YYYY-MM-DD' -> 'Jul 6' (or 'Jul 6, 2026' with includeYear). */
export function formatDay(iso: string, includeYear = false): string {
  const d = toUTC(iso);
  const base = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return includeYear ? `${base}, ${d.getUTCFullYear()}` : base;
}

/** seconds -> 'm:ss'. */
export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Minimal CSV field splitter: handles double-quoted fields containing commas
// (e.g. a puzzle title like "Sunrise, Sunset") so the trailing columns don't
// shift. Doesn't need to cover escaped quotes/newlines — the fetcher CSVs stay
// simple, but a comma in a title is common enough to get right.
function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

function readDataCSV(name: string): Record<string, string>[] {
  // Resolved from the project root, not from import.meta.url: Astro bundles this
  // module into dist/.prerender/ at build time, so a module-relative path would
  // point at dist/data/ instead of the real data/ checkout.
  const path = join(process.cwd(), 'data', name);
  const text = readFileSync(path, 'utf-8').trim();
  // Split on \r?\n — mini_scores.csv ships with CRLF endings, and a stray \r on
  // the last column would silently corrupt the trailing field (e.g. hint_type).
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = parseCSVLine(headerLine);
  return lines.map((line) => {
    const cells = parseCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
  });
}

export interface Solve {
  date: string;
  seconds: number;
}

/** Solved NYT Mini rows from data/mini_scores.csv, with parsed seconds. */
export function getMiniSolves(): Solve[] {
  return readDataCSV('mini_scores.csv')
    .filter((r) => r.solved === 'True' && r.seconds)
    .map((r) => ({ date: r.date, seconds: Number(r.seconds) }));
}

/** Solved NYT Midi rows from data/midi_scores.csv, with parsed seconds. */
export function getMidiSolves(): Solve[] {
  return readDataCSV('midi_scores.csv')
    .filter((r) => r.solved === 'True' && r.seconds)
    .map((r) => ({ date: r.date, seconds: Number(r.seconds) }));
}

export function averageSeconds(solves: { seconds: number }[]): number {
  if (solves.length === 0) return 0;
  return solves.reduce((sum, s) => sum + s.seconds, 0) / solves.length;
}

export interface DaySlot {
  date: string;
  seconds: number | null;
}

/** Lines up `solves` against `cells` (see buildCells) so every box on the page shares the same day-by-day x-axis. */
export function alignSolves(cells: Cell[], solves: Solve[]): DaySlot[] {
  const byDate = new Map(solves.map((s) => [s.date, s.seconds]));
  return cells.map((c) => ({ date: c.date, seconds: byDate.get(c.date) ?? null }));
}

// ---------------------------------------------------------------------------
// v2 additions — richer derivations for the redesigned page. Everything below
// reads the same build artifacts; nothing fetches live.
// ---------------------------------------------------------------------------

/** Brand-ish accent per game, used for tooltip dots and the icon fallback tile. */
export const GAME_COLORS: Record<string, string> = {
  mini: '#4a90e2',
  midi: '#1d9e75',
  crux: '#31d3ff',
  wordle: '#6aaa64',
  connections: '#bc70c4',
  vorto: '#9fd727',
  cijferblok: '#dd246f',
  'precies-vier': '#dc246f',
  sudoku: '#8a8f98',
  'aan-zet': '#8a8f98',
  koprol: '#8a8f98',
};

/** Games we ship a real inline icon for (see src/assets/puzzle-icons). */
export const ICON_SLUGS = new Set([
  'mini', 'midi', 'wordle', 'connections', 'crux', 'cijferblok', 'vorto', 'precies-vier',
]);

/** Longest run of consecutive days ending at `generated` on which anything was solved. */
export function currentAnyStreak(a: Activity): number {
  const active = new Set(a.days.filter((d) => d.played.length > 0).map((d) => d.date));
  let streak = 0;
  let t = toUTC(a.generated).getTime();
  while (active.has(fromUTC(t))) {
    streak += 1;
    t -= DAY_MS;
  }
  return streak;
}

/** The set of dates in the current any-puzzle streak (for ringing them on the calendar). */
export function currentStreakDates(a: Activity): Set<string> {
  const active = new Set(a.days.filter((d) => d.played.length > 0).map((d) => d.date));
  const out = new Set<string>();
  let t = toUTC(a.generated).getTime();
  while (active.has(fromUTC(t))) {
    out.add(fromUTC(t));
    t -= DAY_MS;
  }
  return out;
}

/**
 * The day matching `a.generated`, for the "Today" card. `a.days` only has
 * entries for days with at least one solve, so days are missing whenever
 * nothing's been played yet — falling back to `a.days[0]` in that case would
 * show yesterday's puzzles under a "Today" label.
 */
export function today(a: Activity): ActivityDay {
  return a.days.find((d) => d.date === a.generated) ?? { date: a.generated, played: [] };
}

// --- richer CSV rows (mini/midi carry per-solve timing + assist flags) -------

export interface SolveRow {
  date: string;
  seconds: number | null;
  solvedAt: number | null; // epoch seconds
  clean: boolean; // solved with no autocheck and no reveal/cheat
}

function getSolveRows(name: string): SolveRow[] {
  return readDataCSV(name)
    .filter((r) => r.solved === 'True')
    .map((r) => ({
      date: r.date,
      seconds: r.seconds ? Number(r.seconds) : null,
      solvedAt: r.solved_at ? Number(r.solved_at) : null,
      clean: r.cheated === 'False' && r.autocheck === 'False',
    }));
}

/** Fastest Mini in seconds, ignoring sub-`floor` outliers (reveal artifacts). */
export function fastestMini(floor = 15): number {
  const secs = getMiniSolves().map((s) => s.seconds).filter((s) => s >= floor);
  return secs.length ? Math.min(...secs) : 0;
}

/** Today's (`a.generated`) Mini solve time in seconds, or null if not solved yet. */
export function todayMiniSeconds(a: Activity): number | null {
  return getMiniSolves().find((s) => s.date === a.generated)?.seconds ?? null;
}

export interface MonthPoint {
  month: string; // 'YYYY-MM'
  avg: number; // seconds
}

/** Monthly average Mini solve time, oldest-first — the "getting faster" trend. */
export function miniMonthlyAvg(): MonthPoint[] {
  const sum: Record<string, number> = {};
  const n: Record<string, number> = {};
  for (const s of getMiniSolves()) {
    const m = s.date.slice(0, 7);
    sum[m] = (sum[m] ?? 0) + s.seconds;
    n[m] = (n[m] ?? 0) + 1;
  }
  return Object.keys(sum).sort().map((m) => ({ month: m, avg: Math.round(sum[m] / n[m]) }));
}

// Solve timestamps are epoch UTC; bucket them by the hour they show in
// Amsterdam (DST-aware) so "when I solve" reflects local wall-clock time.
const AMS_HOUR = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam', hour: '2-digit', hour12: false,
});
function amsHour(epochSeconds: number): number {
  return Number(AMS_HOUR.format(new Date(epochSeconds * 1000))) % 24;
}

/** 24-bucket histogram (index = local hour) of Mini completion times. */
export function hourHistogram(): number[] {
  const hist = new Array(24).fill(0);
  for (const r of getSolveRows('mini_scores.csv')) {
    if (r.solvedAt !== null) hist[amsHour(r.solvedAt)] += 1;
  }
  return hist;
}

/** Average Mini solve time per weekday, Mon..Sun (Saturday is the hard one). */
export function weekdayMiniAvg(): { day: string; avg: number }[] {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const sum = new Array(7).fill(0);
  const n = new Array(7).fill(0);
  for (const s of getMiniSolves()) {
    // getUTCDay: 0=Sun..6=Sat -> shift to 0=Mon..6=Sun
    const wd = (toUTC(s.date).getUTCDay() + 6) % 7;
    sum[wd] += s.seconds;
    n[wd] += 1;
  }
  return labels.map((day, i) => ({ day, avg: n[i] ? Math.round(sum[i] / n[i]) : 0 }));
}

export interface HintSlice {
  key: string;
  label: string;
  count: number;
}

// Ordered least- to most-assisted. `hint_type` is precomputed per solve in the
// fetcher CSVs: clean (unaided), checked (used "check"), autocheck (autocheck
// on), revealed (asked for a letter/answer).
const HINT_ORDER = ['clean', 'checked', 'autocheck', 'revealed'] as const;
const HINT_LABELS: Record<string, string> = {
  clean: 'clean',
  checked: 'checked',
  autocheck: 'autocheck',
  revealed: 'revealed',
};

/**
 * How a game's solves break down by assist level (see HINT_ORDER), ordered
 * clean-first and dropping empty buckets. Falls back to `clean` for rows with
 * no recorded hint_type, and appends any unexpected categories at the end.
 */
export function hintBreakdown(name: string): HintSlice[] {
  const counts: Record<string, number> = {};
  for (const r of readDataCSV(name)) {
    if (r.solved !== 'True') continue;
    const key = r.hint_type || 'clean';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const ordered = HINT_ORDER.map((key) => ({ key, label: HINT_LABELS[key], count: counts[key] ?? 0 }));
  const extras = Object.keys(counts)
    .filter((k) => !HINT_ORDER.includes(k as (typeof HINT_ORDER)[number]))
    .sort()
    .map((key) => ({ key, label: key, count: counts[key] }));
  return [...ordered, ...extras].filter((s) => s.count > 0);
}

/** Total solves across a breakdown, for computing segment widths / percentages. */
export function hintTotal(slices: HintSlice[]): number {
  return slices.reduce((sum, s) => sum + s.count, 0);
}

/** date -> { slug: 'm:ss' } for games with a recorded time, for heatmap tooltips. */
export function solveTimesByDate(): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const add = (name: string, slug: string) => {
    for (const s of getSolveRows(name)) {
      if (s.seconds !== null) (out[s.date] ??= {})[slug] = formatSeconds(s.seconds);
    }
  };
  add('mini_scores.csv', 'mini');
  add('midi_scores.csv', 'midi');
  return out;
}
