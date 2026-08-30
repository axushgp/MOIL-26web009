import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell, CheckCircle2, ChevronDown,
  CircleHelp, Crosshair, Database, FileCheck2, Filter, Gauge, Layers3, LocateFixed,
  Menu, Radio, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Target, X, Zap,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltip,
  XAxis, YAxis,
} from 'recharts';
import { useLocation, Route, Switch, Router as WouterRouter } from 'wouter';
import {
  getGetMineRecommendationQueryKey,
  getGetProductionForecastQueryKey,
  getGetProductionHistoryQueryKey,
  getGetReserveHeatmapQueryKey,
  getGetReserveValidationQueryKey,
  getListMinesQueryKey,
  useGetDataMode,
  useGetMineRecommendation,
  useGetProductionForecast,
  useGetProductionHistory,
  useGetReserveHeatmap,
  useGetReserveValidation,
  useListMines,
  useSetDataMode,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const orange = 'hsl(18 80% 52%)';
const teal = 'hsl(164 40% 36%)';

const pct = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(1)}%`;
};
const tonnes = (value?: number | null) => value === undefined || value === null ? '—' : `${Math.round(value).toLocaleString()} t`;
const shortDate = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
const errorText = (error: unknown) => error instanceof Error ? error.message : 'The source did not respond. Try again.';

function Mark({ small = false }: { small?: boolean }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center ${small ? 'h-8 w-8' : 'h-10 w-10'}`} aria-label="MOIL mark">
      <div className="absolute inset-0 rotate-45 rounded-[9px] border-2 border-[hsl(var(--sidebar-primary))]" />
      <div className="relative display text-[hsl(var(--sidebar-primary))] font-bold">{small ? 'M' : 'M'}</div>
    </div>
  );
}

function Sidebar({ open, onClose, onJump, mode, liveReady }: { open: boolean; onClose: () => void; onJump: (id: string) => void; mode: 'synthetic' | 'live'; liveReady: boolean }) {
  const nav = [
    { label: 'Reserve intelligence', icon: Target, id: 'overview', active: true },
    { label: 'Validation evidence', icon: FileCheck2, id: 'validation' },
    { label: 'Production risk', icon: Activity, id: 'production' },
    { label: 'Action register', icon: ShieldCheck, id: 'recommendation' },
  ];
  return (
    <>
      {open && <button data-testid="button-close-sidebar-overlay" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-30 bg-[hsl(198_43%_10%/.45)] lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[82px] items-center justify-between border-b border-sidebar-border px-7">
          <div className="flex items-center gap-3"><Mark /><div><div className="display text-lg font-bold tracking-tight">MOIL</div><div className="mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">Reserve intelligence</div></div></div>
          <button data-testid="button-close-sidebar" aria-label="Close navigation" onClick={onClose} className="rounded-md p-1 text-sidebar-foreground/55 hover:bg-sidebar-accent lg:hidden"><X size={17} /></button>
        </div>
        <div className="px-5 pt-8">
          <div className="mono mb-3 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/40">Workspace</div>
          <nav className="space-y-1">
            {nav.map(({ label, icon: Icon, id, active }) => (
              <button key={id} data-testid={`button-nav-${id}`} onClick={() => { onJump(id); onClose(); }} className={`group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-[13px] transition-colors ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
                <Icon size={16} strokeWidth={active ? 2.5 : 1.8} /><span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary-foreground/70" />}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto px-5 pb-6">
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-sidebar-foreground/75"><Database size={14} /><span className="mono text-[9px] uppercase tracking-[.16em]">Data posture</span></div>
            <div className="flex items-center gap-2 text-[12px] text-sidebar-foreground/80"><span className={`h-2 w-2 rounded-full ${mode === 'live' && liveReady ? 'bg-accent shadow-[0_0_0_3px_hsl(164_40%_50%/.14)]' : 'bg-[hsl(39_72%_58%)] shadow-[0_0_0_3px_hsl(39_72%_58%/.14)]'}`} /> {mode === 'live' ? (liveReady ? 'Live feeds connected' : 'Live setup required') : 'Demo data only'}</div>
            <div className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/45">{mode === 'live' ? (liveReady ? 'Validated imagery, geology, weather, and production outputs are active.' : 'External source adapters are incomplete; synthetic data is blocked.') : 'External satellite, geology, and weather feeds are not connected in this preview.'}</div>
          </div>
          <div className="mt-5 flex items-center gap-3 px-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/15 mono text-[11px] text-sidebar-primary">PM</div><div className="min-w-0"><div className="truncate text-[12px] font-semibold">Planning desk</div><div className="truncate text-[10px] text-sidebar-foreground/45">Central operations</div></div><ChevronDown size={14} className="ml-auto text-sidebar-foreground/35" /></div>
        </div>
      </aside>
    </>
  );
}

function SectionLabel({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-end justify-between gap-4"><div><div className="mono mb-1 text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</div><h2 className="display text-[19px] font-bold tracking-tight">{title}</h2></div>{action}</div>;
}

function StatCard({ label, value, detail, tone = 'neutral', icon: Icon }: { label: string; value: string; detail: string; tone?: 'neutral' | 'risk' | 'good'; icon: typeof Activity }) {
  return <div className="relative overflow-hidden rounded-lg border border-card-border bg-card p-4 shadow-[0_2px_12px_hsl(198_43%_16%/.035)]"><div className={`absolute left-0 top-0 h-full w-[3px] ${tone === 'risk' ? 'bg-primary' : tone === 'good' ? 'bg-accent' : 'bg-[hsl(var(--secondary-foreground)/.28)]'}`} /><div className="flex items-start justify-between"><div className="mono text-[9px] font-bold uppercase tracking-[.15em] text-muted-foreground">{label}</div><Icon size={15} className={tone === 'risk' ? 'text-primary' : tone === 'good' ? 'text-accent' : 'text-muted-foreground'} /></div><div className="mt-3 display text-[28px] font-bold leading-none tracking-tight" data-testid={`text-stat-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</div><div className="mt-2 text-[11px] text-muted-foreground">{detail}</div></div>;
}

function SourceTag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'orange' | 'green' }) {
  return <span className={`mono inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[.08em] ${tone === 'orange' ? 'border-primary/25 bg-primary/8 text-primary' : tone === 'green' ? 'border-accent/25 bg-accent/8 text-accent' : 'border-border bg-muted/60 text-muted-foreground'}`}>{children}</span>;
}

function DataModePanel({ data, loading, changing, onChange }: { data: any; loading: boolean; changing: boolean; onChange: (mode: 'synthetic' | 'live') => void }) {
  const isLive = data?.mode === 'live';
  return <section data-testid="panel-data-mode" className={`mb-7 rounded-lg border p-4 shadow-[0_2px_12px_hsl(198_43%_16%/.035)] ${isLive ? 'border-primary/30 bg-primary/5' : 'border-card-border bg-card'}`}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-md p-2 ${isLive ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>{isLive ? <Radio size={17} /> : <Database size={17} />}</div>
        <div>
          <div className="mono text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground">Data mode</div>
          <div className="mt-1 text-[14px] font-bold">{loading ? 'Checking source posture…' : isLive ? 'Live source mode' : 'Synthetic preview mode'}</div>
          <div className="mt-1 max-w-[680px] text-[11px] leading-relaxed text-muted-foreground">{data?.message || 'The API is checking which data source is active.'}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-background p-1" role="group" aria-label="Select data mode">
        {(['synthetic', 'live'] as const).map((mode) => <button key={mode} type="button" data-testid={`button-data-mode-${mode}`} aria-pressed={data?.mode === mode} disabled={loading || changing} onClick={() => onChange(mode)} className={`rounded px-3 py-2 text-[10px] font-bold capitalize transition-colors ${data?.mode === mode ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'} disabled:cursor-wait disabled:opacity-60`}>{mode === 'synthetic' ? 'Synthetic preview' : 'Live data'}</button>)}
      </div>
    </div>
    {isLive && <div className="mt-4 grid gap-2 border-t border-primary/15 pt-4 sm:grid-cols-2 xl:grid-cols-4">{(data.sources || []).map((source: any) => <div key={source.id} className="rounded-md border border-border/80 bg-card/70 p-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${source.status === 'connected' ? 'bg-accent' : source.status === 'adapter_pending' ? 'bg-[#d49a4c]' : 'bg-primary'}`} /><span className="text-[11px] font-bold">{source.label}</span></div><div className="mono mt-2 text-[9px] uppercase tracking-wider text-muted-foreground">{source.status === 'connected' ? 'Connected' : source.status === 'adapter_pending' ? 'Adapter pending' : 'Setup needed'}</div><div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{source.detail}</div></div>)}</div>}
    {isLive && !data?.live_ready && <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-[10px] leading-relaxed text-muted-foreground"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-primary" /><span>Live mode is fail-closed: no synthetic records are used while source adapters are incomplete. Follow <span className="font-bold text-foreground">LIVE_DATA_SETUP.md</span>, then restart the API after wiring the adapters.</span></div>}
    {isLive && data?.live_ready && <div className="mt-3 flex items-center gap-2 text-[10px] text-accent"><CheckCircle2 size={14} /> All live adapters report ready. Dashboard values are sourced from the configured feeds.</div>}
  </section>;
}

function EmptyState({ title, detail, icon: Icon = Database }: { title: string; detail: string; icon?: typeof Database }) {
  return <div className="flex min-h-[180px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/25 p-6 text-center"><Icon size={22} className="mb-3 text-muted-foreground/50" /><div className="text-sm font-semibold">{title}</div><div className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-muted-foreground">{detail}</div></div>;
}

function LoadingRows({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-2">{Array.from({ length: rows }).map((_, index) => <div key={index} className="skeleton h-[53px] rounded-md" />)}</div>;
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div className="flex min-h-[180px] flex-col items-center justify-center rounded-md border border-primary/20 bg-primary/5 p-6 text-center"><AlertTriangle size={22} className="mb-3 text-primary" /><div className="text-sm font-semibold">Signal unavailable</div><div className="mt-1 max-w-[320px] text-[11px] leading-relaxed text-muted-foreground">{message}</div><button data-testid="button-retry-data" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-[11px] font-semibold text-primary hover:bg-primary/10"><RefreshCw size={13} /> Retry source</button></div>;
}

function ReserveMap({ mines, points, selectedId, onSelect }: { mines: any[]; points: any[]; selectedId: string; onSelect: (id: string) => void }) {
  const [layer, setLayer] = useState<'probability' | 'spectral' | 'structure'>('probability');
  const bounds = useMemo(() => {
    const source = [...points, ...mines].filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    if (!source.length) return { minLat: 20, maxLat: 24, minLng: 82, maxLng: 88 };
    const lats = source.map((item) => item.latitude); const lngs = source.map((item) => item.longitude);
    return { minLat: Math.min(...lats) - .18, maxLat: Math.max(...lats) + .18, minLng: Math.min(...lngs) - .18, maxLng: Math.max(...lngs) + .18 };
  }, [mines, points]);
  const project = (lat: number, lng: number) => ({ x: 7 + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * 86, y: 92 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * 84 });
  const heatColor = (item: any) => {
    const value = layer === 'spectral' ? item.spectral_score : layer === 'structure' ? item.structural_score : item.reserve_probability;
    const score = Number(value ?? 0); const normalized = score <= 1 ? score : score / 100;
    return normalized > .75 ? '#e8753f' : normalized > .5 ? '#d49a4c' : normalized > .3 ? '#75a793' : '#4e7480';
  };
  return <div className="relative min-h-[410px] overflow-hidden rounded-md border border-[hsl(198_43%_26%/.18)] bg-[hsl(194_32%_88%)] map-grid scanline">
    <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-md border border-[hsl(198_43%_26%/.18)] bg-[hsl(42_42%_98%/.9)] p-1 shadow-sm backdrop-blur-sm">
      {(['probability', 'spectral', 'structure'] as const).map((item) => <button key={item} data-testid={`button-map-layer-${item}`} onClick={() => setLayer(item)} className={`rounded px-2 py-1.5 text-[10px] font-semibold capitalize ${layer === item ? 'bg-[hsl(198_43%_16%)] text-[hsl(42_42%_98%)]' : 'text-muted-foreground hover:text-foreground'}`}>{item}</button>)}
    </div>
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-md border border-[hsl(198_43%_26%/.18)] bg-[hsl(42_42%_98%/.9)] px-2.5 py-2 backdrop-blur-sm"><span className="h-2 w-2 rounded-full bg-primary" /><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Probability surface</span></div>
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Reserve probability map">
      <path d="M8 78 C17 58 13 33 31 24 S55 30 63 13 S79 22 93 9" fill="none" stroke="hsl(198 43% 30%/.2)" strokeWidth=".35" />
      <path d="M4 66 C20 55 24 72 38 57 S59 68 69 45 S84 56 98 39" fill="none" stroke="hsl(198 43% 30%/.15)" strokeWidth=".25" />
      <path d="M4 88 C21 75 32 91 47 72 S71 87 98 63" fill="none" stroke="hsl(198 43% 30%/.12)" strokeWidth=".22" />
      <path d="M23 4 C31 19 22 36 43 43 S35 66 55 76 S62 91 76 98" fill="none" stroke="hsl(198 43% 30%/.1)" strokeWidth=".2" />
      {points.map((point, index) => { const pos = project(point.latitude, point.longitude); const color = heatColor(point); const size = 1.6 + (Number(point.reserve_probability ?? 0) <= 1 ? Number(point.reserve_probability ?? 0) : Number(point.reserve_probability ?? 0) / 100) * 4; return <g key={`point-group-${index}`}><circle cx={pos.x} cy={pos.y} r={size + 2.5} fill={color} opacity=".09" /><circle cx={pos.x} cy={pos.y} r={size} fill={color} opacity=".63" /></g>; })}
       {mines.filter((mine) => Number.isFinite(mine.latitude) && Number.isFinite(mine.longitude)).map((mine) => { const pos = project(mine.latitude, mine.longitude); const active = mine.mine_id === selectedId; return <g key={mine.mine_id} onClick={() => onSelect(mine.mine_id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(mine.mine_id); }} tabIndex={0} role="button" aria-label={`Select ${mine.name}`} data-testid={`map-mine-${mine.mine_id}`} className="cursor-pointer outline-none"><circle cx={pos.x} cy={pos.y} r={active ? 3.8 : 2.7} fill={active ? orange : 'hsl(198 43% 16%)'} stroke="hsl(42 42% 98%)" strokeWidth={active ? 1 : .65} /><circle cx={pos.x} cy={pos.y} r={active ? 6.3 : 4.3} fill="none" stroke={active ? orange : 'hsl(198 43% 16%/.35)'} strokeWidth=".45" /><text x={pos.x + 3.5} y={pos.y - 3} fill="hsl(198 43% 16%/.75)" fontSize="2.7" fontFamily="Space Mono">{mine.name?.replace(/mine/i, '').trim()}</text></g>; })}
    </svg>
    <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-md border border-[hsl(198_43%_26%/.18)] bg-[hsl(42_42%_98%/.86)] px-3 py-2 backdrop-blur-sm"><div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#4e7480]" /><span className="text-[10px] text-muted-foreground">lower</span></div><div className="h-1 w-20 rounded-full bg-gradient-to-r from-[#4e7480] via-[#d49a4c] to-[#e8753f]" /><span className="text-[10px] text-muted-foreground">higher probability</span></div>
    <div className="absolute bottom-4 right-4 rounded-md border border-[hsl(198_43%_26%/.18)] bg-[hsl(42_42%_98%/.86)] px-3 py-2 text-right backdrop-blur-sm"><div className="mono text-[9px] text-muted-foreground">SURFACE EXTENT</div><div className="mono mt-0.5 text-[10px] font-bold text-foreground">{points.length ? `${points.length} reserve cells` : 'No cells returned'}</div></div>
  </div>;
}

function MineWatchlist({ mines, loading, error, selectedId, query, district, setQuery, setDistrict, onSelect, retry }: { mines: any[]; loading: boolean; error: unknown; selectedId: string; query: string; district: string; setQuery: (value: string) => void; setDistrict: (value: string) => void; onSelect: (id: string) => void; retry: () => void }) {
  const districts = [...new Set(mines.map((mine) => mine.district).filter(Boolean))];
  const visible = mines.filter((mine) => `${mine.name} ${mine.mine_id}`.toLowerCase().includes(query.toLowerCase()) && (!district || mine.district === district));
  return <div className="rounded-lg border border-card-border bg-card p-5 shadow-[0_2px_12px_hsl(198_43%_16%/.035)]">
    <SectionLabel eyebrow="Mine register" title="Priority watchlist" action={<span className="mono text-[10px] text-muted-foreground">{visible.length}/{mines.length}</span>} />
    <div className="mb-4 flex gap-2"><div className="relative min-w-0 flex-1"><Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" /><input data-testid="input-mine-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a mine" className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-2 text-[11px] outline-none focus:border-primary" /></div><select data-testid="select-district-filter" value={district} onChange={(event) => setDistrict(event.target.value)} className="h-9 max-w-[112px] rounded-md border border-input bg-background px-2 text-[10px] outline-none focus:border-primary"><option value="">All districts</option>{districts.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
    {loading ? <LoadingRows rows={4} /> : error ? <ErrorState message={errorText(error)} retry={retry} /> : !mines.length ? <EmptyState title="No mines in register" detail="Mine records will appear when the operational source is connected." icon={LocateFixed} /> : !visible.length ? <EmptyState title="No matching mines" detail="Adjust the search or district filter to widen the register." icon={Filter} /> : <div className="space-y-1.5">{visible.map((mine) => { const risk = Number(mine.shortfall_probability ?? 0); return <button key={mine.mine_id} data-testid={`button-select-mine-${mine.mine_id}`} onClick={() => onSelect(mine.mine_id)} className={`w-full rounded-md border p-3 text-left transition-colors ${selectedId === mine.mine_id ? 'border-primary/45 bg-primary/6' : 'border-transparent hover:border-border hover:bg-muted/45'}`}><div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2.5"><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${risk >= .5 ? 'bg-primary' : risk >= .25 ? 'bg-[#d49a4c]' : 'bg-accent'}`} /><div className="min-w-0"><div className="truncate text-[12px] font-bold">{mine.name || mine.mine_id}</div><div className="mono mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{mine.mine_id} · {mine.district || 'District pending'}</div></div></div><span className={`mono text-[11px] font-bold ${risk >= .5 ? 'text-primary' : 'text-foreground'}`}>{pct(mine.shortfall_probability)}</span></div><div className="mt-2 mono text-[9px] uppercase tracking-wider text-muted-foreground">{mine.coordinate_status || 'Coordinate evidence pending'}</div><div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>{mine.dominant_driver || 'Driver not classified'}</span><span className="flex items-center gap-1"><Gauge size={11} /> {pct(mine.reserve_confidence)} confidence</span></div></button>; })}</div>}
  </div>;
}

function ValidationCard({ data, loading, error, retry }: { data: any; loading: boolean; error: unknown; retry: () => void }) {
  return <section id="validation" className="rounded-lg border border-card-border bg-card p-5 shadow-[0_2px_12px_hsl(198_43%_16%/.035)]"><SectionLabel eyebrow="Model evidence" title="Reserve validation" action={<button data-testid="button-validation-method" className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground"><CircleHelp size={13} /> Method</button>} />{loading ? <div className="space-y-3"><div className="skeleton h-12 rounded-md" /><div className="skeleton h-24 rounded-md" /></div> : error ? <ErrorState message={errorText(error)} retry={retry} /> : !data ? <EmptyState title="Validation not computed" detail="Leave-one-out validation will appear when the reserve model returns an evidence payload." icon={FileCheck2} /> : <><div className="grid grid-cols-2 gap-3"><div className="rounded-md bg-muted/60 p-3"><div className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Source-backed mines</div><div className="mt-1 display text-2xl font-bold">{data.confirmed_mines_checked ?? '—'}</div></div><div className="rounded-md bg-muted/60 p-3"><div className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Avg percentile</div><div className="mt-1 display text-2xl font-bold text-accent">{pct(data.avg_percentile_rank)}</div></div></div><div className="mt-4 space-y-2">{(data.per_mine || []).slice(0, 5).map((item: any) => <div key={item.mine_id} className="flex items-center gap-3 text-[11px]"><span className="mono w-16 text-muted-foreground">{item.mine_id}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Number(item.percentile <= 1 ? item.percentile * 100 : item.percentile))}%` }} /></div><span className="mono w-11 text-right font-bold">{pct(item.percentile)}</span></div>)}</div><div className="mt-4 border-t border-border pt-3"><div className="flex items-center justify-between gap-3"><SourceTag tone="green">{data.method || 'Leave-one-out'}</SourceTag><span className="text-[10px] text-muted-foreground">Evidence layer · not a drilling result</span></div></div></>}</section>;
}

function ProductionPanel({ mine, history, forecast, loadingHistory, loadingForecast, historyError, forecastError, retryHistory, retryForecast, horizon, setHorizon }: { mine: any; history: any[]; forecast: any; loadingHistory: boolean; loadingForecast: boolean; historyError: unknown; forecastError: unknown; retryHistory: () => void; retryForecast: () => void; horizon: 30 | 60 | 90; setHorizon: (value: 30 | 60 | 90) => void }) {
  const chartData = useMemo(() => history.map((row) => ({ ...row, label: shortDate(row.date), planned: Number(row.planned_tonnage || 0), actual: Number(row.actual_tonnage || 0) })), [history]);
  return <section id="production" className="rounded-lg border border-card-border bg-card p-5 shadow-[0_2px_12px_hsl(198_43%_16%/.035)]"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><div className="mono mb-1 text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground">Mine-level output</div><h2 className="display text-[19px] font-bold tracking-tight">Production signal {mine && <span className="text-muted-foreground">/ {mine.name}</span>}</h2></div><div className="flex items-center gap-2"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Forecast horizon</span><select data-testid="select-forecast-horizon" value={horizon} onChange={(event) => setHorizon(Number(event.target.value) as 30 | 60 | 90)} className="h-8 rounded-md border border-input bg-background px-2 text-[10px] font-bold outline-none focus:border-primary"><option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option></select></div></div>{!mine ? <EmptyState title="Select a mine to inspect output" detail="The production signal combines historical tonnage with the selected mine's forward risk estimate." icon={Activity} /> : loadingHistory ? <div className="skeleton h-[260px] rounded-md" /> : historyError ? <ErrorState message={errorText(historyError)} retry={retryHistory} /> : !history.length ? <EmptyState title="No production history" detail="The selected mine has no recent production rows in the source window." icon={BarChart3} /> : <div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 12, right: 4, left: -18, bottom: 0 }}><CartesianGrid stroke="hsl(198 27% 25%/.12)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(199 14% 45%)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 9, fill: 'hsl(199 14% 45%)' }} tickLine={false} axisLine={false} /><ChartTooltip contentStyle={{ background: 'hsl(42 42% 98%)', border: '1px solid hsl(38 21% 84%)', borderRadius: 6, fontSize: 11 }} /><Line type="monotone" dataKey="planned" name="Planned" stroke="hsl(199 14% 55%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} /><Line type="monotone" dataKey="actual" name="Actual" stroke={orange} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: orange, stroke: 'hsl(42 42% 98%)', strokeWidth: 2 }} /></LineChart></ResponsiveContainer></div>}<div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3"><div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span className="h-0.5 w-4 bg-primary" /> Actual output</div><div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span className="w-4 border-t border-dashed border-muted-foreground" /> Planned tonnage</div>{history.length > 0 && <SourceTag>{history[history.length - 1]?.data_provenance || 'Operational history'}</SourceTag>}</div></section>;
}

function ForecastCard({ forecast, loading, error, retry }: { forecast: any; loading: boolean; error: unknown; retry: () => void }) {
  return <section className="rounded-lg border border-card-border bg-card p-5 shadow-[0_2px_12px_hsl(198_43%_16%/.035)]"><SectionLabel eyebrow="Forward look" title="Production forecast" action={<Zap size={16} className="text-primary" />} />{loading ? <div className="space-y-3"><div className="skeleton h-20 rounded-md" /><div className="skeleton h-12 rounded-md" /></div> : error ? <ErrorState message={errorText(error)} retry={retry} /> : !forecast ? <EmptyState title="Forecast not available" detail="Select a mine with a forecast response to see the forward production estimate." icon={Zap} /> : <><div className="rounded-md bg-[hsl(18_80%_52%/.08)] p-4"><div className="flex items-end justify-between"><div><div className="mono text-[9px] uppercase tracking-wider text-primary">Predicted / {forecast.horizon_days} days</div><div className="mt-2 display text-[29px] font-bold">{tonnes(forecast.predicted_tonnage)}</div></div><div className="text-right"><div className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Shortfall risk</div><div className="mt-1 display text-2xl font-bold text-primary">{pct(forecast.shortfall_probability)}</div></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary/15"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (forecast.shortfall_probability ?? 0) <= 1 ? (forecast.shortfall_probability ?? 0) * 100 : forecast.shortfall_probability)}%` }} /></div></div><div className="mt-4 space-y-3 text-[11px]"><div className="flex items-center justify-between"><span className="text-muted-foreground">Planned tonnage</span><span className="mono font-bold">{tonnes(forecast.planned_tonnage)}</span></div><div className="flex items-center justify-between"><span className="text-muted-foreground">Dominant driver</span><span className="font-semibold text-foreground">{forecast.dominant_driver || 'Not classified'}</span></div><div className="flex items-center justify-between"><span className="text-muted-foreground">Local reserve confidence</span><span className="mono font-bold text-accent">{pct(forecast.local_reserve_confidence)}</span></div></div><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><SourceTag tone="orange">{forecast.provenance || 'Model estimate'}</SourceTag><span className="mono text-[9px] text-muted-foreground">{forecast.model_version || 'Version pending'}</span></div></>}</section>;
}

function RecommendationCard({ recommendation, loading, error, retry }: { recommendation: any; loading: boolean; error: unknown; retry: () => void }) {
  return <section id="recommendation" className="rounded-lg border border-[hsl(164_40%_36%/.28)] bg-[hsl(164_40%_36%/.055)] p-5 shadow-[0_2px_12px_hsl(164_40%_36%/.05)]"><div className="mb-4 flex items-start justify-between"><div><div className="mono mb-1 text-[9px] font-bold uppercase tracking-[.18em] text-accent">Auditable action</div><h2 className="display text-[19px] font-bold tracking-tight">Recommended next move</h2></div><div className="rounded-md bg-accent/10 p-2 text-accent"><ShieldCheck size={18} /></div></div>{loading ? <div className="space-y-3"><div className="skeleton h-7 rounded-md" /><div className="skeleton h-16 rounded-md" /></div> : error ? <ErrorState message={errorText(error)} retry={retry} /> : !recommendation ? <EmptyState title="No recommendation returned" detail="A corrective action will be shown when a mine is selected and its risk signals are available." icon={ShieldCheck} /> : <><div className="rounded-md border border-accent/15 bg-card/70 p-4"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent" /><span className="text-[14px] font-bold">{recommendation.action}</span></div><p className="mt-3 text-[12px] leading-relaxed text-foreground/75">{recommendation.detail}</p></div><div className="mt-4"><div className="mono text-[9px] font-bold uppercase tracking-[.15em] text-muted-foreground">Why this is surfaced</div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{recommendation.explanation_text}</p></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-accent/15 pt-3"><div className="flex items-center gap-2"><SourceTag tone="green">{recommendation.driver || 'Risk driver'}</SourceTag><span className="text-[10px] text-muted-foreground">Generated {shortDate(recommendation.generated_at)}</span></div><button data-testid="button-copy-recommendation" onClick={() => navigator.clipboard?.writeText(`${recommendation.action}: ${recommendation.detail}`)} className="text-[10px] font-semibold text-accent hover:underline">Copy action note</button></div></>}</section>;
}

function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);
  const dataModeQuery = useGetDataMode();
  const dataModeMutation = useSetDataMode();
  const isSynthetic = (dataModeQuery.data?.mode || 'synthetic') === 'synthetic';
  const minesQuery = useListMines({ query: { enabled: isSynthetic, queryKey: getListMinesQueryKey() } });
  const heatmapQuery = useGetReserveHeatmap(undefined, { query: { enabled: isSynthetic, queryKey: getGetReserveHeatmapQueryKey() } });
  const validationQuery = useGetReserveValidation({ query: { enabled: isSynthetic, queryKey: getGetReserveValidationQueryKey() } });
  const mines = isSynthetic ? minesQuery.data || [] : [];
  const selectedMine = useMemo(() => mines.find((mine) => mine.mine_id === selectedId) || mines[0], [mines, selectedId]);
  const activeId = selectedMine?.mine_id || '';
  const historyQuery = useGetProductionHistory(activeId, { days: 90 }, { query: { enabled: isSynthetic && Boolean(activeId), queryKey: getGetProductionHistoryQueryKey(activeId, { days: 90 }) } });
  const forecastQuery = useGetProductionForecast(activeId, { horizon }, { query: { enabled: isSynthetic && Boolean(activeId), queryKey: getGetProductionForecastQueryKey(activeId, { horizon }) } });
  const recommendationQuery = useGetMineRecommendation(activeId, { horizon }, { query: { enabled: isSynthetic && Boolean(activeId), queryKey: getGetMineRecommendationQueryKey(activeId, { horizon }) } });
  const heatmapData = isSynthetic ? heatmapQuery.data : undefined;
  const validationData = isSynthetic ? validationQuery.data : undefined;
  const historyData = isSynthetic ? historyQuery.data || [] : [];
  const forecastData = isSynthetic ? forecastQuery.data : undefined;
  const recommendationData = isSynthetic ? recommendationQuery.data : undefined;
  useEffect(() => { if (!selectedId && mines[0]?.mine_id) setSelectedId(mines[0].mine_id); }, [mines, selectedId]);
  const riskMines = useMemo(() => [...mines].sort((a, b) => Number(b.shortfall_probability || 0) - Number(a.shortfall_probability || 0)), [mines]);
  const switchDataMode = (mode: 'synthetic' | 'live') => {
    dataModeMutation.mutate({ data: { mode } }, {
      onSuccess: (nextMode) => {
        queryClient.setQueryData(dataModeQuery.queryKey, nextMode);
        setSelectedId('');
        void queryClient.invalidateQueries();
      },
    });
  };
  const refreshAll = () => { void dataModeQuery.refetch(); if (isSynthetic) { void minesQuery.refetch(); void heatmapQuery.refetch(); void validationQuery.refetch(); if (activeId) { void historyQuery.refetch(); void forecastQuery.refetch(); void recommendationQuery.refetch(); } } };
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const computedAt = heatmapData?.computed_at;
  return <div className="min-h-[100dvh] bg-background text-foreground">
    <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onJump={jump} mode={isSynthetic ? 'synthetic' : 'live'} liveReady={Boolean(dataModeQuery.data?.live_ready)} />
    <main className="min-h-[100dvh] lg:pl-[268px]">
      <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-border bg-[hsl(38_36%_95%/.92)] px-5 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-3"><button data-testid="button-open-sidebar" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="rounded-md p-2 hover:bg-muted lg:hidden"><Menu size={19} /></button><div className="hidden h-7 w-px bg-border sm:block" /><div><div className="mono text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground">Operations / intelligence console</div><div className="mt-0.5 text-[12px] font-semibold">Central planning workspace</div></div></div>
        <div className="flex items-center gap-2 sm:gap-4"><div className="hidden items-center gap-2 sm:flex"><span className="h-2 w-2 rounded-full bg-[hsl(39_72%_58%)]" /><span className="text-[11px] text-muted-foreground">Demo source status</span></div><button data-testid="button-refresh-data" onClick={refreshAll} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-[10px] font-bold hover:border-primary/40 hover:text-primary"><RefreshCw size={13} className={minesQuery.isFetching ? 'animate-spin' : ''} /><span className="hidden sm:inline">Refresh data</span></button><button data-testid="button-notifications" aria-label="Open notifications" onClick={() => jump('recommendation')} className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Bell size={17} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" /></button></div>
      </header>
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">
         <DataModePanel data={dataModeQuery.data} loading={dataModeQuery.isLoading} changing={dataModeMutation.isPending} onChange={switchDataMode} />
         <div data-testid="banner-data-mode" className={`mb-7 flex flex-col gap-2 rounded-md border px-4 py-3 text-[11px] sm:flex-row sm:items-start sm:justify-between sm:gap-5 ${isSynthetic ? 'border-[hsl(39_72%_53%/.3)] bg-[hsl(39_72%_53%/.08)]' : 'border-primary/25 bg-primary/5'}`}><div className="flex items-start gap-2.5"><Database size={15} className={`mt-0.5 shrink-0 ${isSynthetic ? 'text-[hsl(39_72%_42%)]' : 'text-primary'}`} /><div><div className="font-bold text-foreground">{isSynthetic ? 'Preview mode · synthetic demo dataset' : 'Live mode · external source pipeline'}</div><div className="mt-0.5 leading-relaxed text-muted-foreground">{isSynthetic ? 'Mine operations, production history, and weather patterns are illustrative. Reserve cells are deterministic demo output; connect GEE, Bhukosh, and ERA5 before using this for field decisions.' : 'Live mode never falls back to synthetic values. Complete the source checklist above before using the dashboard for operational decisions.'}</div></div></div><SourceTag tone={isSynthetic ? 'orange' : 'green'}>{isSynthetic ? 'Provenance required' : dataModeQuery.data?.live_ready ? 'Live connected' : 'Setup required'}</SourceTag></div>
        <div id="overview" className="reveal mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><div className="mb-2 flex items-center gap-2"><span className="mono text-[10px] font-bold uppercase tracking-[.2em] text-primary">Decision support / 01</span><span className="h-px w-8 bg-primary/50" /></div><h1 className="display max-w-[700px] text-[32px] font-bold leading-[1.05] tracking-[-.03em] sm:text-[43px]">Reserve signals,<br /><span className="text-accent">production decisions.</span></h1><p className="mt-3 max-w-[600px] text-[13px] leading-relaxed text-muted-foreground">A single view across probability-ranked exploration zones and mine-level production risk. Use it to prioritize the next conversation, not to replace field confirmation.</p></div><div className="flex items-center gap-3 self-start xl:self-end"><div className="rounded-md border border-border bg-card px-3 py-2"><div className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Surface computation</div><div className="mt-1 flex items-center gap-2 text-[11px] font-semibold"><Crosshair size={12} className="text-primary" />{computedAt ? `Updated ${shortDate(computedAt)}` : 'Awaiting model response'}</div></div><button data-testid="button-open-controls" onClick={() => jump('watchlist')} className="inline-flex h-[52px] items-center gap-2 rounded-md bg-primary px-4 text-[11px] font-bold text-primary-foreground shadow-sm hover:brightness-95"><SlidersHorizontal size={14} /> Focus register</button></div></div>
         <div className="reveal reveal-1 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Mines monitored" value={minesQuery.isLoading ? '...' : `${mines.length}`} detail="Operational records in current register" icon={LocateFixed} /><StatCard label="High-risk exposure" value={minesQuery.isLoading ? '...' : `${riskMines.filter((mine) => Number(mine.shortfall_probability || 0) >= .5).length}`} detail="Mines at or above 50% shortfall probability" tone="risk" icon={AlertTriangle} /><StatCard label="Reserve confidence" value={minesQuery.isLoading ? '...' : pct(mines.length ? mines.reduce((sum, mine) => sum + Number(mine.reserve_confidence || 0), 0) / mines.length : undefined)} detail="Mean confidence across mine records" tone="good" icon={ShieldCheck} /><StatCard label="Model surface" value={heatmapQuery.isLoading ? '...' : `${heatmapData?.points?.length || 0}`} detail={`Cells · ${heatmapData?.model_version || 'model version pending'}`} icon={Layers3} /></div>
         <div className="reveal reveal-2 mt-7 grid gap-5 2xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.85fr)]"><section className="rounded-lg border border-card-border bg-card p-5 shadow-[0_2px_12px_hsl(198_43%_16%/.035)]"><SectionLabel eyebrow="Regional reserve surface" title="Exploration probability field" action={<div className="flex items-center gap-2"><SourceTag tone="orange">{heatmapData?.model_version || 'Model pending'}</SourceTag><span className="hidden text-[10px] text-muted-foreground sm:inline">Surface estimate</span></div>} />{heatmapQuery.isLoading ? <div className="skeleton min-h-[410px] rounded-md" /> : heatmapQuery.error ? <ErrorState message={errorText(heatmapQuery.error)} retry={() => { void heatmapQuery.refetch(); }} /> : <ReserveMap mines={mines} points={heatmapData?.points || []} selectedId={activeId} onSelect={setSelectedId} />}</section><div id="watchlist"><MineWatchlist mines={mines} loading={minesQuery.isLoading} error={minesQuery.error} selectedId={activeId} query={query} district={district} setQuery={setQuery} setDistrict={setDistrict} onSelect={setSelectedId} retry={() => { void minesQuery.refetch(); }} /></div></div>
         <div className="reveal reveal-3 mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,.82fr)]"><ValidationCard data={validationData} loading={isSynthetic && validationQuery.isLoading} error={isSynthetic ? validationQuery.error : undefined} retry={() => { void validationQuery.refetch(); }} /><div className="rounded-lg border border-card-border bg-card p-5 shadow-[0_2px_12px_hsl(198_43%_16%/.035)]"><SectionLabel eyebrow="Risk concentration" title="Where to look first" action={<ArrowDownRight size={16} className="text-primary" />} />{minesQuery.isLoading ? <LoadingRows rows={3} /> : !riskMines.length ? <EmptyState title="Risk ranking is empty" detail="Mine shortfall probabilities will populate this view when records are available." icon={Gauge} /> : <div className="space-y-4">{riskMines.slice(0, 4).map((mine, index) => <button key={mine.mine_id} data-testid={`button-risk-rank-${mine.mine_id}`} onClick={() => { setSelectedId(mine.mine_id); jump('production'); }} className="group w-full text-left"><div className="mb-1.5 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="mono text-[10px] text-muted-foreground">0{index + 1}</span><span className="truncate text-[12px] font-semibold group-hover:text-primary">{mine.name}</span></div><span className="mono text-[11px] font-bold text-primary">{pct(mine.shortfall_probability)}</span></div><div className="ml-7 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Number(mine.shortfall_probability || 0) <= 1 ? Number(mine.shortfall_probability || 0) * 100 : Number(mine.shortfall_probability || 0))}%` }} /></div><div className="ml-7 mt-1.5 text-[10px] text-muted-foreground">{mine.dominant_driver || 'Driver not classified'} · {pct(mine.reserve_confidence)} reserve confidence</div></button>)}</div>}</div></div>
         <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]"><ProductionPanel mine={selectedMine} history={historyData} forecast={forecastData} loadingHistory={isSynthetic && historyQuery.isLoading} loadingForecast={isSynthetic && forecastQuery.isLoading} historyError={isSynthetic ? historyQuery.error : undefined} forecastError={isSynthetic ? forecastQuery.error : undefined} retryHistory={() => { void historyQuery.refetch(); }} retryForecast={() => { void forecastQuery.refetch(); }} horizon={horizon} setHorizon={setHorizon} /><div className="space-y-5"><ForecastCard forecast={forecastData} loading={isSynthetic && forecastQuery.isLoading} error={isSynthetic ? forecastQuery.error : undefined} retry={() => { void forecastQuery.refetch(); }} /><RecommendationCard recommendation={recommendationData} loading={isSynthetic && recommendationQuery.isLoading} error={isSynthetic ? recommendationQuery.error : undefined} retry={() => { void recommendationQuery.refetch(); }} /></div></div>
        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-border py-5 text-[10px] text-muted-foreground sm:flex-row"><div className="flex items-center gap-2"><Mark small /><span>MOIL Reserve Intelligence Platform</span></div><div className="flex items-center gap-3"><span>Screening and prioritization only</span><span className="h-1 w-1 rounded-full bg-muted-foreground/50" /><span className="mono">PROVENANCE REQUIRED</span></div></footer>
      </div>
    </main>
  </div>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;