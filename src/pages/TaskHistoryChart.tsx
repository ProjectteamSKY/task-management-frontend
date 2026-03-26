import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskHistoryEntry {
  taskId: string;
  taskTitle: string;
  estimatedHours: number;
  actualHours: number;
  completedAt: string;
  category: string;
}

interface TaskHistoryChartProps {
  workerId: string;
  workerName: string;
}

// ─── Mock history data ────────────────────────────────────────────────────────

const mockHistory: Record<string, TaskHistoryEntry[]> = {
  w1: [
    { taskId: 'h1', taskTitle: 'Auth API refactor', estimatedHours: 8, actualHours: 7, completedAt: '2024-03-01', category: 'backend' },
    { taskId: 'h2', taskTitle: 'DB migration', estimatedHours: 6, actualHours: 5, completedAt: '2024-03-05', category: 'backend' },
    { taskId: 'h3', taskTitle: 'Payment API', estimatedHours: 10, actualHours: 9, completedAt: '2024-03-10', category: 'backend' },
    { taskId: 'h4', taskTitle: 'Rate limiter', estimatedHours: 4, actualHours: 6, completedAt: '2024-03-14', category: 'backend' },
    { taskId: 'h5', taskTitle: 'Webhook handler', estimatedHours: 5, actualHours: 4, completedAt: '2024-03-18', category: 'backend' },
    { taskId: 'h6', taskTitle: 'Cache layer', estimatedHours: 8, actualHours: 7, completedAt: '2024-03-22', category: 'backend' },
  ],
  w2: [
    { taskId: 'h7', taskTitle: 'Wiring Zone A', estimatedHours: 8, actualHours: 6, completedAt: '2024-03-02', category: 'electrical' },
    { taskId: 'h8', taskTitle: 'Panel install', estimatedHours: 12, actualHours: 10, completedAt: '2024-03-08', category: 'electrical' },
    { taskId: 'h9', taskTitle: 'Conduit run', estimatedHours: 6, actualHours: 8, completedAt: '2024-03-14', category: 'electrical' },
    { taskId: 'h10', taskTitle: 'Safety check', estimatedHours: 4, actualHours: 3, completedAt: '2024-03-19', category: 'electrical' },
  ],
  w3: [
    { taskId: 'h11', taskTitle: 'Login flow tests', estimatedHours: 5, actualHours: 6, completedAt: '2024-03-03', category: 'qa' },
    { taskId: 'h12', taskTitle: 'API test suite', estimatedHours: 8, actualHours: 8, completedAt: '2024-03-09', category: 'qa' },
    { taskId: 'h13', taskTitle: 'Regression run', estimatedHours: 6, actualHours: 5, completedAt: '2024-03-15', category: 'qa' },
    { taskId: 'h14', taskTitle: 'Load testing', estimatedHours: 10, actualHours: 11, completedAt: '2024-03-20', category: 'qa' },
    { taskId: 'h15', taskTitle: 'Bug triage', estimatedHours: 4, actualHours: 3, completedAt: '2024-03-23', category: 'qa' },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-secondary/40 border border-border">
      <span className={`text-base font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

// ─── Chart bar pair ───────────────────────────────────────────────────────────

function BarPair({
  entry,
  maxHours,
  chartH,
  isHovered,
  onHover,
}: {
  entry: TaskHistoryEntry;
  maxHours: number;
  chartH: number;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const estPct = entry.estimatedHours / maxHours;
  const actPct = entry.actualHours / maxHours;
  const overrun = entry.actualHours > entry.estimatedHours;

  return (
    <div
      className="flex flex-col items-center gap-1.5 cursor-pointer group"
      onMouseEnter={() => onHover(entry.taskId)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-10 w-44 p-2.5 rounded-xl bg-popover border border-border shadow-lg text-center pointer-events-none">
          <p className="text-[11px] font-medium text-foreground truncate">{entry.taskTitle}</p>
          <div className="flex justify-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground">Est: <strong className="text-foreground">{entry.estimatedHours}h</strong></span>
            <span className={`text-[10px] ${overrun ? 'text-destructive' : 'text-success'}`}>
              Act: <strong>{entry.actualHours}h</strong>
            </span>
          </div>
          <span className={`text-[10px] font-medium ${overrun ? 'text-destructive' : 'text-success'}`}>
            {overrun ? `+${entry.actualHours - entry.estimatedHours}h over` : `-${entry.estimatedHours - entry.actualHours}h under`}
          </span>
        </div>
      )}

      {/* Bar group */}
      <div className="flex items-end gap-0.5 relative" style={{ height: chartH }}>
        {/* Estimated bar */}
        <div
          className="w-4 rounded-t-sm bg-primary/30 border border-primary/20 transition-all duration-200 group-hover:bg-primary/50"
          style={{ height: `${estPct * chartH}px` }}
        />
        {/* Actual bar */}
        <div
          className={`w-4 rounded-t-sm transition-all duration-200
            ${overrun
              ? 'bg-destructive/50 border border-destructive/30 group-hover:bg-destructive/70'
              : 'bg-success/50 border border-success/30 group-hover:bg-success/70'
            }`}
          style={{ height: `${actPct * chartH}px` }}
        />
      </div>

      {/* X label */}
      <p className="text-[9px] text-muted-foreground text-center w-12 truncate leading-tight">
        {entry.taskTitle.split(' ').slice(0, 2).join(' ')}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TaskHistoryChart({ workerId, workerName }: TaskHistoryChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const history = mockHistory[workerId] ?? [];

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
        No task history available.
      </div>
    );
  }

  const maxHours = Math.max(...history.flatMap(e => [e.estimatedHours, e.actualHours])) * 1.1;
  const chartH = 100;

  // Aggregate stats
  const totalEst = history.reduce((s, e) => s + e.estimatedHours, 0);
  const totalAct = history.reduce((s, e) => s + e.actualHours, 0);
  const productivityFactor = Math.round((totalEst / totalAct) * 100) / 100;
  const overrunTasks = history.filter(e => e.actualHours > e.estimatedHours).length;
  const avgVariance = Math.round(((totalAct - totalEst) / history.length) * 10) / 10;

  return (
    <div className="rounded-2xl border border-border bg-secondary/10 p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Task history</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{workerName} · last {history.length} completed tasks</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary/30 border border-primary/20" />
            <span>Estimated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-success/50 border border-success/30" />
            <span>Actual (under)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-destructive/50 border border-destructive/30" />
            <span>Actual (over)</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-5">
        <StatPill
          label="Productivity"
          value={`${productivityFactor}×`}
          color={productivityFactor >= 1 ? 'text-success' : 'text-warning'}
        />
        <StatPill
          label="Total est."
          value={`${totalEst}h`}
          color="text-foreground"
        />
        <StatPill
          label="Total actual"
          value={`${totalAct}h`}
          color={totalAct <= totalEst ? 'text-success' : 'text-destructive'}
        />
        <StatPill
          label="Avg variance"
          value={`${avgVariance > 0 ? '+' : ''}${avgVariance}h`}
          color={avgVariance <= 0 ? 'text-success' : 'text-destructive'}
        />
        <StatPill
          label="Overruns"
          value={`${overrunTasks}/${history.length}`}
          color={overrunTasks === 0 ? 'text-success' : 'text-warning'}
        />
      </div>

      {/* Y-axis labels + bars */}
      <div className="flex gap-2">
        {/* Y axis */}
        <div className="flex flex-col justify-between text-right pr-2" style={{ height: chartH + 24 }}>
          {[maxHours, maxHours * 0.5, 0].map((v, i) => (
            <span key={i} className="text-[9px] text-muted-foreground tabular-nums">
              {Math.round(v)}h
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none"
            style={{ paddingBottom: 24 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="w-full border-t border-border/30 border-dashed" />
            ))}
          </div>

          {/* Bars */}
          <div className="flex items-end gap-3 relative" style={{ height: chartH + 24, paddingBottom: 24 }}>
            {history.map(entry => (
              <div key={entry.taskId} className="relative flex-1">
                <BarPair
                  entry={entry}
                  maxHours={maxHours}
                  chartH={chartH}
                  isHovered={hoveredId === entry.taskId}
                  onHover={setHoveredId}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend note */}
      <div className={`mt-3 px-3 py-2 rounded-lg text-[11px] border
        ${productivityFactor >= 1
          ? 'bg-success/5 border-success/20 text-success'
          : 'bg-warning/5 border-warning/20 text-warning'}`}>
        {productivityFactor >= 1
          ? `✓ ${workerName} consistently completes tasks ${Math.round((productivityFactor - 1) * 100)}% faster than estimated on average.`
          : `⚠ ${workerName} has been running ${Math.round((1 - productivityFactor) * 100)}% over estimates on average — consider adjusting allocations.`
        }
      </div>
    </div>
  );
}