import { useState } from 'react';
import { workers } from '@/data/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIWorkerScore {
  workerId: string;
  confidence: number;
  reasons: string[];
  availableHours: number;
  productivityFactor: number;
  capabilityMatch: number; // 0–100
}

interface ReassignModalProps {
  taskId: string;
  taskTitle: string;
  taskHours: number;
  requiredCapability: string;
  currentWorkerId: string;
  onClose: () => void;
  onConfirm: (workerId: string) => void;
}

// ─── Mock AI scores per worker for a given task ───────────────────────────────

const mockAIScores: AIWorkerScore[] = [
  {
    workerId: 'w2',
    confidence: 92,
    reasons: ['Electrical capability match', 'Previous similar tasks (avg 7.8h)', 'Available capacity this week'],
    availableHours: 24,
    productivityFactor: 1.33,
    capabilityMatch: 95,
  },
  {
    workerId: 'w1',
    confidence: 61,
    reasons: ['Partial skill overlap via API work', 'High current workload (78%)', 'No prior electrical tasks'],
    availableHours: 10,
    productivityFactor: 1.14,
    capabilityMatch: 40,
  },
  {
    workerId: 'w3',
    confidence: 34,
    reasons: ['No matching capability', 'QA specialization mismatch', 'Low workload but wrong domain'],
    availableHours: 32,
    productivityFactor: 0.95,
    capabilityMatch: 10,
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 55) return 'text-warning';
  return 'text-destructive';
}

function scoreBg(score: number) {
  if (score >= 80) return 'bg-success/10 border-success/20';
  if (score >= 55) return 'bg-warning/10 border-warning/20';
  return 'bg-destructive/10 border-destructive/20';
}

function CapBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReassignModal({
  taskTitle,
  taskHours,
  requiredCapability,
  currentWorkerId,
  onClose,
  onConfirm,
}: ReassignModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(mockAIScores[0]?.workerId ?? null);

  const sorted = [...mockAIScores].sort((a, b) => b.confidence - a.confidence);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-[560px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Reassign Task</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[360px]">{taskTitle}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                {taskHours}h estimated
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {requiredCapability}
              </span>
            </div>
          </div>
          <button onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none mt-0.5">
            ✕
          </button>
        </div>

        {/* AI ranking label */}
        <div className="px-6 py-2.5 bg-secondary/30 border-b border-border shrink-0 flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            AI-ranked workers
          </span>
          <span className="text-[10px] text-muted-foreground">· sorted by match confidence</span>
        </div>

        {/* Worker list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
          {sorted.map((score, idx) => {
            const worker = workers.find(w => w.id === score.workerId);
            if (!worker) return null;
            const isCurrent = worker.id === currentWorkerId;
            const isSelected = selected === worker.id;
            const isExpanded = expandedId === worker.id;

            return (
              <div key={worker.id}
                className={`rounded-xl border transition-all cursor-pointer
                  ${isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-secondary/20 hover:bg-secondary/40'
                  }`}
                onClick={() => {
                  setSelected(worker.id);
                  setExpandedId(worker.id);
                }}
              >
                {/* Row */}
                <div className="p-3 flex items-center gap-3">
                  {/* Rank */}
                  <span className={`text-[11px] font-bold w-5 text-center shrink-0
                    ${idx === 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    #{idx + 1}
                  </span>

                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                    {worker.avatar}
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground">{worker.name}</p>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{worker.role}</p>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Capability match bar */}
                    <div className="flex flex-col gap-1 w-20">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground">Cap. match</span>
                        <span className="text-[9px] font-medium text-foreground">{score.capabilityMatch}%</span>
                      </div>
                      <CapBar pct={score.capabilityMatch}
                        color={score.capabilityMatch >= 80 ? 'bg-success' : score.capabilityMatch >= 50 ? 'bg-warning' : 'bg-destructive'} />
                    </div>

                    {/* Available hours */}
                    <div className="text-center w-14">
                      <p className="text-sm font-bold text-foreground">{score.availableHours}h</p>
                      <p className="text-[9px] text-muted-foreground">available</p>
                    </div>

                    {/* Productivity */}
                    <div className="text-center w-14">
                      <p className={`text-sm font-bold ${score.productivityFactor >= 1 ? 'text-success' : 'text-warning'}`}>
                        {score.productivityFactor}×
                      </p>
                      <p className="text-[9px] text-muted-foreground">speed</p>
                    </div>

                    {/* Confidence badge */}
                    <div className={`px-3 py-1.5 rounded-lg border text-center w-16 ${scoreBg(score.confidence)}`}>
                      <p className={`text-base font-bold ${scoreColor(score.confidence)}`}>{score.confidence}%</p>
                      <p className={`text-[9px] ${scoreColor(score.confidence)}`}>AI match</p>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : worker.id); }}
                      className="text-muted-foreground hover:text-foreground transition-all text-sm"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Expanded reasoning */}
                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-border/50 pt-2.5 space-y-1.5 animate-fade-in">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      AI reasoning
                    </p>
                    {score.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <span className={`shrink-0 mt-0.5 ${i === 0 ? 'text-success' : score.confidence < 55 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {i === 0 ? '✓' : score.confidence < 55 ? '✗' : '·'}
                        </span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between bg-secondary/10">
          <p className="text-xs text-muted-foreground">
            {selected
              ? `Assigning to ${workers.find(w => w.id === selected)?.name}`
              : 'Select a worker to reassign'}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button
              disabled={!selected}
              onClick={() => selected && onConfirm(selected)}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Confirm reassign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}