import { useState } from 'react';
import {
  LineChart, Line,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { TrendUpIcon, StarIcon, CheckIcon, ClockIcon } from '@/components/icons/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PerformanceDetailProps {
  perf: {
    tasksCompleted: number;
    avgCompletionTime: number;
    onTimeRate: number;
    qualityScore: number;
  };
}

type TrendMetric = 'onTime' | 'quality';

// ─── Mock weekly data ─────────────────────────────────────────────────────────

const WEEKLY_TREND = [
  { week: 'W1', onTime: 82, quality: 4.1 },
  { week: 'W2', onTime: 87, quality: 4.3 },
  { week: 'W3', onTime: 79, quality: 4.0 },
  { week: 'W4', onTime: 91, quality: 4.4 },
  { week: 'W5', onTime: 88, quality: 4.2 },
  { week: 'W6', onTime: 93, quality: 4.6 },
  { week: 'W7', onTime: 90, quality: 4.5 },
  { week: 'W8', onTime: 91, quality: 4.5 },
];

const TASKS_BY_WEEK = [
  { week: 'W1', completed: 6,  goal: 8 },
  { week: 'W2', completed: 8,  goal: 8 },
  { week: 'W3', completed: 5,  goal: 8 },
  { week: 'W4', completed: 9,  goal: 8 },
  { week: 'W5', completed: 7,  goal: 8 },
  { week: 'W6', completed: 10, goal: 8 },
  { week: 'W7', completed: 8,  goal: 8 },
  { week: 'W8', completed: 9,  goal: 8 },
];

const RADAR_DATA = [
  { metric: 'On-Time',     actual: 91, goal: 90 },
  { metric: 'Quality',     actual: 90, goal: 85 },
  { metric: 'Task Volume', actual: 75, goal: 80 },
  { metric: 'Efficiency',  actual: 85, goal: 80 },
  { metric: 'Availability',actual: 95, goal: 90 },
];

const GOAL_VS_ACTUAL = [
  { label: 'On-Time Rate',   actual: 91,  goal: 90, unit: '%',   max: 100 },
  { label: 'Quality Score',  actual: 90,  goal: 85, unit: '%',   max: 100 },
  { label: 'Tasks / Week',   actual: 8.3, goal: 8,  unit: 'avg', max: 12  },
  { label: 'Avg Completion', actual: 7.2, goal: 8,  unit: 'h',   max: 12  },
  { label: 'Availability',   actual: 95,  goal: 90, unit: '%',   max: 100 },
];

// ─── Chart configs ────────────────────────────────────────────────────────────

const trendConfigs: Record<TrendMetric, ChartConfig> = {
  onTime: {
    onTime: { label: 'On-Time Rate (%)', color: 'hsl(var(--primary))' },
  },
  quality: {
    quality: { label: 'Quality Score', color: 'hsl(var(--primary))' },
  },
};

const barConfig: ChartConfig = {
  completed: { label: 'Completed', color: 'hsl(var(--primary))'   },
  goal:      { label: 'Goal',      color: 'hsl(var(--secondary))' },
};

const radarConfig: ChartConfig = {
  actual: { label: 'Actual', color: 'hsl(var(--primary))' },
  goal:   { label: 'Goal',   color: 'hsl(var(--success))'  },
};

const TREND_OPTIONS: { key: TrendMetric; label: string }[] = [
  { key: 'onTime',  label: 'On-Time Rate'  },
  { key: 'quality', label: 'Quality Score' },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, delta, icon,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  icon: React.ReactNode;
}) {
  const up   = delta !== undefined && delta > 0;
  const down = delta !== undefined && delta < 0;
  return (
    <div className="bg-secondary/50 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {delta !== undefined && (
        <p className={`text-[11px] font-medium ${up ? 'text-success' : down ? 'text-destructive' : 'text-muted-foreground'}`}>
          {up ? '↑' : down ? '↓' : '–'} {Math.abs(delta).toFixed(1)} vs last week
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PerformanceDetail({ perf }: PerformanceDetailProps) {
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('onTime');

  const onTimeRate = Math.round(perf.onTimeRate * 100);
  const qualityPct = Math.round(perf.qualityScore * 20);

  const last   = WEEKLY_TREND[WEEKLY_TREND.length - 1];
  const prev   = WEEKLY_TREND[WEEKLY_TREND.length - 2];
  const deltas = {
    onTime:  last.onTime  - prev.onTime,
    quality: last.quality - prev.quality,
    tasks:   TASKS_BY_WEEK[TASKS_BY_WEEK.length - 1].completed - TASKS_BY_WEEK[TASKS_BY_WEEK.length - 2].completed,
  };

  return (
    <div className="space-y-6">

      {/* ══ KPI Score Cards ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="On-Time Rate"
          value={`${onTimeRate}%`}
          sub="Target: 90%"
          delta={deltas.onTime}
          icon={<CheckIcon size={14} />}
        />
        <KPICard
          label="Quality Score"
          value={`${perf.qualityScore}/5`}
          sub={`${qualityPct}% of max`}
          delta={deltas.quality}
          icon={<StarIcon size={14} />}
        />
        <KPICard
          label="Tasks Completed"
          value={String(perf.tasksCompleted)}
          sub="Total all time"
          delta={deltas.tasks}
          icon={<TrendUpIcon size={14} />}
        />
        <KPICard
          label="Avg Completion"
          value={`${perf.avgCompletionTime}h`}
          sub="Per task"
          icon={<ClockIcon size={14} />}
        />
      </div>

      {/* ══ Trend Line + Bar Chart ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Trend line */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Weekly Trend</h3>
            <div className="flex gap-1">
              {TREND_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTrendMetric(opt.key)}
                  className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                    trendMetric === opt.key
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <ChartContainer config={trendConfigs[trendMetric]} className="h-[200px] w-full">
            <LineChart data={WEEKLY_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                domain={trendMetric === 'quality' ? [3.5, 5] : [70, 100]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey={trendMetric}
                stroke="var(--color-onTime, var(--color-quality))"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Tasks per week bar */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Tasks Completed per Week</h3>
            <span className="text-[10px] text-muted-foreground">Goal: 8 / week</span>
          </div>
          <ChartContainer config={barConfig} className="h-[200px] w-full">
            <BarChart data={TASKS_BY_WEEK} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="completed" fill="var(--color-completed)" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="goal"      fill="var(--color-goal)"      radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* ══ Radar + Goal vs Actual ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Radar */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Multi-KPI Radar</h3>
          <ChartContainer config={radarConfig} className="h-[260px] w-full">
            <RadarChart data={RADAR_DATA} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={4} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Radar
                name="actual"
                dataKey="actual"
                stroke="var(--color-actual)"
                fill="var(--color-actual)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Radar
                name="goal"
                dataKey="goal"
                stroke="var(--color-goal)"
                fill="var(--color-goal)"
                fillOpacity={0.1}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            </RadarChart>
          </ChartContainer>
        </div>

        {/* Goal vs Actual */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-5">Goal vs Actual</h3>
          <div className="space-y-4">
            {GOAL_VS_ACTUAL.map(item => {
              const actualPct = Math.min(100, (item.actual / item.max) * 100);
              const goalPct   = Math.min(100, (item.goal   / item.max) * 100);
              const met       = item.actual >= item.goal;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-foreground font-medium">{item.label}</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className={`font-semibold ${met ? 'text-success' : 'text-destructive'}`}>
                        {item.actual}{item.unit}
                      </span>
                      <span className="text-muted-foreground">/ {item.goal}{item.unit}</span>
                    </div>
                  </div>
                  {/* Progress track */}
                  <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                        met ? 'bg-success' : 'bg-destructive/70'
                      }`}
                      style={{ width: `${actualPct}%` }}
                    />
                  </div>
                  {/* Goal marker */}
                  <div className="relative h-2">
                    <div
                      className="absolute w-0.5 h-3 bg-muted-foreground/50 rounded-full -translate-y-2"
                      style={{ left: `${goalPct}%` }}
                      title={`Goal: ${item.goal}${item.unit}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-success inline-block" /> Met goal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-destructive/70 inline-block" /> Behind goal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-0.5 h-3 bg-muted-foreground/50 inline-block" /> Goal marker
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}