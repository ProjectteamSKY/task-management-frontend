import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { workers, workerPerformance, getOverallWorkload } from '@/data/mockData';
import { ChevronRightIcon, StarIcon } from '@/components/icons/Icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  a: 'hsl(var(--primary))',
  b: 'hsl(var(--success))',
};

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-success/15 text-success',
  on_leave: 'bg-warning/15 text-warning',
  inactive: 'bg-destructive/15 text-destructive',
};

const KPI_ROWS = [
  { key: 'onTimeRate',        label: 'On-Time Rate',    format: (v: number) => `${Math.round(v * 100)}%`, higherIsBetter: true  },
  { key: 'qualityScore',      label: 'Quality Score',   format: (v: number) => `${v}/5`,                  higherIsBetter: true  },
  { key: 'tasksCompleted',    label: 'Tasks Completed', format: (v: number) => String(v),                  higherIsBetter: true  },
  { key: 'avgCompletionTime', label: 'Avg Completion',  format: (v: number) => `${v}h`,                   higherIsBetter: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function winner(aVal: number, bVal: number, higherIsBetter: boolean): 'a' | 'b' | 'tie' {
  if (aVal === bVal) return 'tie';
  return (higherIsBetter ? aVal > bVal : aVal < bVal) ? 'a' : 'b';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorkerSelector({
  slot,
  selectedId,
  excludeId,
  onChange,
}: {
  slot: 'A' | 'B';
  selectedId: string;
  excludeId: string;
  onChange: (id: string) => void;
}) {
  const available = workers.filter(w => w.id !== excludeId);
  const selected  = workers.find(w => w.id === selectedId);
  const workload  = selected ? getOverallWorkload(selected.id) : 0;
  const perf      = selected ? workerPerformance.find(p => p.workerId === selected.id) : null;

  const slotColor = slot === 'A' ? 'bg-primary/15 text-primary' : 'bg-success/15 text-success';
  const borderColor = slot === 'A' ? 'border-primary/30' : 'border-success/30';

  return (
    <div className={`glass rounded-xl p-5 flex-1 border ${borderColor}`}>
      {/* Slot label + selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${slotColor}`}>
          Worker {slot}
        </span>
        <select
          value={selectedId}
          onChange={e => onChange(e.target.value)}
          className="flex-1 h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {available.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {selected && (
        <>
          {/* Avatar + name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
              {selected.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{selected.name}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[selected.status] ?? ''}`}>
                  {selected.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{selected.role} · {selected.department}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
              <p className={`text-base font-bold ${workload > 80 ? 'text-destructive' : workload > 60 ? 'text-warning' : 'text-success'}`}>
                {workload}%
              </p>
              <p className="text-[10px] text-muted-foreground">Workload</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
              <p className="text-base font-bold text-foreground">{selected.dailyCapacityHours}h</p>
              <p className="text-[10px] text-muted-foreground">Daily Cap</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
              <p className="text-base font-bold text-foreground flex items-center justify-center gap-0.5">
                <StarIcon size={12} className="text-warning" />
                {perf?.qualityScore ?? '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">Quality</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkerCompare() {
  const defaultA = workers[0]?.id ?? '';
  const defaultB = workers[1]?.id ?? '';

  const [idA, setIdA] = useState(defaultA);
  const [idB, setIdB] = useState(defaultB);

  const workerA = workers.find(w => w.id === idA)!;
  const workerB = workers.find(w => w.id === idB)!;
  const perfA   = workerPerformance.find(p => p.workerId === idA);
  const perfB   = workerPerformance.find(p => p.workerId === idB);
  const wlA     = getOverallWorkload(idA);
  const wlB     = getOverallWorkload(idB);

  // ── Chart configs ──
  const radarConfig: ChartConfig = useMemo(() => ({
    a: { label: workerA?.name ?? 'Worker A', color: COLORS.a },
    b: { label: workerB?.name ?? 'Worker B', color: COLORS.b },
  }), [workerA?.name, workerB?.name]);

  const barConfig: ChartConfig = useMemo(() => ({
    a: { label: workerA?.name ?? 'Worker A', color: COLORS.a },
    b: { label: workerB?.name ?? 'Worker B', color: COLORS.b },
  }), [workerA?.name, workerB?.name]);

  // ── Radar data ──
  const radarData = useMemo(() => [
    { metric: 'On-Time',      a: perfA ? Math.round(perfA.onTimeRate * 100) : 0,       b: perfB ? Math.round(perfB.onTimeRate * 100) : 0       },
    { metric: 'Quality',      a: perfA ? Math.round(perfA.qualityScore * 20) : 0,       b: perfB ? Math.round(perfB.qualityScore * 20) : 0       },
    { metric: 'Task Volume',  a: perfA ? Math.min(100, perfA.tasksCompleted) : 0,        b: perfB ? Math.min(100, perfB.tasksCompleted) : 0        },
    { metric: 'Efficiency',   a: perfA ? Math.round(100 - perfA.avgCompletionTime * 5) : 0, b: perfB ? Math.round(100 - perfB.avgCompletionTime * 5) : 0 },
    { metric: 'Availability', a: 100 - wlA,                                              b: 100 - wlB                                              },
  ], [perfA, perfB, wlA, wlB]);

  // ── Bar chart data ──
  const barData = useMemo(() => [
    { metric: 'On-Time %',    a: perfA ? Math.round(perfA.onTimeRate * 100) : 0,  b: perfB ? Math.round(perfB.onTimeRate * 100) : 0  },
    { metric: 'Quality %',    a: perfA ? Math.round(perfA.qualityScore * 20) : 0,  b: perfB ? Math.round(perfB.qualityScore * 20) : 0  },
    { metric: 'Tasks',        a: perfA?.tasksCompleted ?? 0,                        b: perfB?.tasksCompleted ?? 0                        },
    { metric: 'Workload %',   a: wlA,                                               b: wlB                                               },
  ], [perfA, perfB, wlA, wlB]);

  // ── All unique skills ──
  const allSkills = useMemo(() => {
    const names = new Set([
      ...workerA.capabilities.map(c => c.name),
      ...workerB.capabilities.map(c => c.name),
    ]);
    return Array.from(names);
  }, [workerA, workerB]);

  if (!workerA || !workerB) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/workers" className="hover:text-foreground transition-colors">Workers</Link>
        <ChevronRightIcon size={14} />
        <span className="text-foreground">Compare</span>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compare Workers</h1>
        <p className="text-sm text-muted-foreground mt-1">Select two workers to compare side-by-side</p>
      </div>

      {/* ── Worker selectors ── */}
      <div className="flex gap-4">
        <WorkerSelector slot="A" selectedId={idA} excludeId={idB} onChange={setIdA} />

        {/* VS divider */}
        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          <div className="w-px flex-1 bg-border/50" />
          <span className="text-xs font-bold text-muted-foreground bg-secondary rounded-full w-8 h-8 flex items-center justify-center">
            VS
          </span>
          <div className="w-px flex-1 bg-border/50" />
        </div>

        <WorkerSelector slot="B" selectedId={idB} excludeId={idA} onChange={setIdB} />
      </div>

      {/* ── KPI Metrics table ── */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">KPI Metrics</h3>
        </div>
        <div className="divide-y divide-border/30">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_1fr_80px_1fr] gap-4 px-5 py-2.5 bg-secondary/30">
            <span className="text-[10px] uppercase tracking-wider text-primary font-medium">
              {workerA.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Metric</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Better</span>
            <span className="text-[10px] uppercase tracking-wider text-success font-medium text-right">
              {workerB.name}
            </span>
          </div>

          {/* Workload row */}
          {(() => {
            const w = winner(wlA, wlB, false); // lower workload = better
            return (
              <div className="grid grid-cols-[1fr_1fr_80px_1fr] gap-4 items-center px-5 py-3">
                <span className={`text-sm font-semibold ${w === 'a' ? 'text-primary' : 'text-foreground'}`}>
                  {wlA}%
                </span>
                <span className="text-xs text-muted-foreground">Workload</span>
                <div className="flex justify-center">
                  {w !== 'tie' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${w === 'a' ? 'bg-primary/15 text-primary' : 'bg-success/15 text-success'}`}>
                      {w === 'a' ? workerA.name.split(' ')[0] : workerB.name.split(' ')[0]}
                    </span>
                  )}
                  {w === 'tie' && <span className="text-[10px] text-muted-foreground">Tie</span>}
                </div>
                <span className={`text-sm font-semibold text-right ${w === 'b' ? 'text-success' : 'text-foreground'}`}>
                  {wlB}%
                </span>
              </div>
            );
          })()}

          {/* KPI rows */}
          {KPI_ROWS.map(row => {
            const aVal = perfA?.[row.key as keyof typeof perfA] as number ?? 0;
            const bVal = perfB?.[row.key as keyof typeof perfB] as number ?? 0;
            const w    = winner(aVal, bVal, row.higherIsBetter);
            return (
              <div key={row.key} className="grid grid-cols-[1fr_1fr_80px_1fr] gap-4 items-center px-5 py-3">
                <span className={`text-sm font-semibold ${w === 'a' ? 'text-primary' : 'text-foreground'}`}>
                  {row.format(aVal)}
                </span>
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <div className="flex justify-center">
                  {w !== 'tie' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${w === 'a' ? 'bg-primary/15 text-primary' : 'bg-success/15 text-success'}`}>
                      {w === 'a' ? workerA.name.split(' ')[0] : workerB.name.split(' ')[0]}
                    </span>
                  )}
                  {w === 'tie' && <span className="text-[10px] text-muted-foreground">Tie</span>}
                </div>
                <span className={`text-sm font-semibold text-right ${w === 'b' ? 'text-success' : 'text-foreground'}`}>
                  {row.format(bVal)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Workload bar comparison ── */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Workload Comparison</h3>
        <div className="space-y-3">
          {[
            { name: workerA.name, value: wlA, slot: 'a' as const },
            { name: workerB.name, value: wlB, slot: 'b' as const },
          ].map(({ name, value, slot }) => (
            <div key={slot}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{name}</span>
                <span className={`text-xs font-semibold ${
                  value > 80 ? 'text-destructive' : value > 60 ? 'text-warning' : 'text-success'
                }`}>{value}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${value}%`,
                    background: slot === 'a' ? COLORS.a : COLORS.b,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts: Radar + Bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Radar overlay */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Multi-KPI Radar</h3>
          <ChartContainer config={radarConfig} className="h-[280px] w-full">
            <RadarChart data={radarData} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={4} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Radar
                name="a"
                dataKey="a"
                stroke="var(--color-a)"
                fill="var(--color-a)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar
                name="b"
                dataKey="b"
                stroke="var(--color-b)"
                fill="var(--color-b)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ChartContainer>
        </div>

        {/* Grouped bar chart */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">KPI Bar Comparison</h3>
          <ChartContainer config={barConfig} className="h-[280px] w-full">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="metric" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="a" fill="var(--color-a)" radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Bar dataKey="b" fill="var(--color-b)" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* ── Skills & Proficiency ── */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Skills & Proficiency</h3>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 px-5 py-2.5 bg-secondary/30">
          <span className="text-[10px] uppercase tracking-wider text-primary font-medium">{workerA.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Skill</span>
          <span className="text-[10px] uppercase tracking-wider text-success font-medium text-right">{workerB.name}</span>
        </div>

        <div className="divide-y divide-border/30">
          {allSkills.map(skill => {
            const capA = workerA.capabilities.find(c => c.name === skill);
            const capB = workerB.capabilities.find(c => c.name === skill);
            const w    = capA && capB ? winner(capA.proficiency, capB.proficiency, true) : 'tie';
            return (
              <div key={skill} className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center px-5 py-3">
                {/* Worker A dots */}
                <div className="flex items-center gap-2">
                  {capA ? (
                    <>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < capA.proficiency
                                ? w === 'a' ? 'bg-primary' : 'bg-primary/60'
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{capA.proficiency}/5</span>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40">—</span>
                  )}
                </div>

                {/* Skill name */}
                <span className="text-xs text-foreground font-medium">{skill}</span>

                {/* Worker B dots */}
                <div className="flex items-center justify-end gap-2">
                  {capB ? (
                    <>
                      <span className="text-[11px] text-muted-foreground">{capB.proficiency}/5</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < capB.proficiency
                                ? w === 'b' ? 'bg-success' : 'bg-success/60'
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}