import { useState } from 'react';
import { workers } from '@/data/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotStatus = 'available' | 'allocated' | 'blocked' | 'leave';

interface TimeSlot {
  workerId: string;
  date: string;
  hour: number; // 9–17 (9am–5pm, last slot ends at 6pm)
  status: SlotStatus;
  taskTitle?: string;
}

interface TimeSlotGridProps {
  /** If provided, shows only this worker. If omitted, shows all workers. */
  focusWorkerId?: string;
  /** Pre-selected date (YYYY-MM-DD). Defaults to today. */
  initialDate?: string;
  /** Called when manager drags/clicks a slot to assign a task */
  onSlotClick?: (workerId: string, date: string, hour: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17]; // 9am–6pm (9 slots)
const HOUR_LABELS = ['9am', '10', '11', '12pm', '1', '2', '3', '4', '5pm'];
const DAYS_TO_SHOW = 5; // Mon–Fri

const statusColors: Record<SlotStatus, string> = {
  available: 'bg-success/20 border-success/20 hover:bg-success/35 cursor-pointer',
  allocated: 'bg-primary/30 border-primary/25',
  blocked:   'bg-secondary border-border opacity-60',
  leave:     'bg-warning/20 border-warning/20',
};

const statusLabels: Record<SlotStatus, string> = {
  available: 'Free',
  allocated: 'Allocated',
  blocked:   'Blocked',
  leave:     'Leave',
};

// ─── Mock schedule generator ──────────────────────────────────────────────────

function generateSchedule(baseDate: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const taskNames: Record<string, string[]> = {
    w1: ['Auth API', 'DB migration', 'Code review', 'Sprint planning'],
    w2: ['Wiring Zone A', 'Panel install', 'Safety check', 'Conduit run'],
    w3: ['Login tests', 'API suite', 'Bug triage', 'Regression run'],
  };

  workers.forEach(worker => {
    for (let d = 0; d < DAYS_TO_SHOW; d++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];

      HOURS.forEach(hour => {
        const rand = Math.random();
        let status: SlotStatus = 'available';
        let taskTitle: string | undefined;

        if (d === 2 && worker.id === 'w3') {
          status = 'leave'; // Sara on leave Wed
        } else if (rand < 0.30) {
          status = 'allocated';
          const names = taskNames[worker.id] ?? [];
          taskTitle = names[Math.floor(Math.random() * names.length)];
        } else if (rand < 0.35) {
          status = 'blocked';
        }

        slots.push({ workerId: worker.id, date: dateStr, hour, status, taskTitle });
      });
    }
  });
  return slots;
}

// ─── Get week start (Monday) ──────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isoDate(date: Date) {
  return date.toISOString().split('T')[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimeSlotGrid({ focusWorkerId, onSlotClick }: TimeSlotGridProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [schedule] = useState(() => generateSchedule(getWeekStart(new Date())));
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(focusWorkerId ?? 'all');

  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const displayWorkers = selectedWorkerId === 'all'
    ? workers
    : workers.filter(w => w.id === selectedWorkerId);

  function getSlot(workerId: string, date: string, hour: number): TimeSlot | undefined {
    return schedule.find(s => s.workerId === workerId && s.date === date && s.hour === hour);
  }

  function getWorkerDayLoad(workerId: string, date: string) {
    const daySlots = schedule.filter(s => s.workerId === workerId && s.date === date);
    const allocated = daySlots.filter(s => s.status === 'allocated').length;
    return Math.round((allocated / HOURS.length) * 100);
  }

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  return (
    <div className="rounded-2xl border border-border bg-secondary/10 overflow-hidden">

      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-border bg-background flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Time-slot availability</h3>
          <p className="text-xs text-muted-foreground mt-0.5">9am – 6pm · 1-hour slots</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Worker filter */}
          <select
            value={selectedWorkerId}
            onChange={e => setSelectedWorkerId(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="all">All workers</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          {/* Week nav */}
          <div className="flex items-center gap-1">
            <button onClick={prevWeek}
              className="w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center text-sm">
              ‹
            </button>
            <span className="text-xs text-muted-foreground px-2 min-w-[140px] text-center">
              {formatDate(dates[0])} – {formatDate(dates[4])}
            </span>
            <button onClick={nextWeek}
              className="w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center text-sm">
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-2 border-b border-border bg-secondary/20 flex items-center gap-5">
        {(Object.keys(statusColors) as SlotStatus[]).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm border ${statusColors[s].split(' ').slice(0, 2).join(' ')}`} />
            <span className="text-[10px] text-muted-foreground">{statusLabels[s]}</span>
          </div>
        ))}
        <span className="text-[10px] text-muted-foreground ml-auto">Click a free slot to assign</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">

          {/* Column headers: Worker name + days */}
          <div className="grid border-b border-border bg-secondary/30"
            style={{ gridTemplateColumns: `140px repeat(${DAYS_TO_SHOW * HOURS.length}, 1fr)` }}>
            <div className="px-3 py-2" />
            {dates.map(date => (
              <div key={date.toISOString()}
                className="col-span-9 px-2 py-2 border-l border-border text-center">
                <p className="text-[11px] font-medium text-foreground">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <p className="text-[10px] text-muted-foreground">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            ))}
          </div>

          {/* Hour sub-headers */}
          <div className="grid border-b border-border bg-secondary/20 sticky top-0 z-10"
            style={{ gridTemplateColumns: `140px repeat(${DAYS_TO_SHOW * HOURS.length}, 1fr)` }}>
            <div className="px-3 py-1.5 text-[9px] text-muted-foreground uppercase tracking-wider">Worker</div>
            {dates.flatMap(date =>
              HOUR_LABELS.map((label, hi) => (
                <div key={`${date.toISOString()}-${hi}`}
                  className={`py-1.5 text-center text-[9px] text-muted-foreground ${hi === 0 ? 'border-l border-border' : ''}`}>
                  {label}
                </div>
              ))
            )}
          </div>

          {/* Worker rows */}
          {displayWorkers.map(worker => (
            <div key={worker.id}
              className="grid border-b border-border hover:bg-secondary/20 transition-colors group"
              style={{ gridTemplateColumns: `140px repeat(${DAYS_TO_SHOW * HOURS.length}, 1fr)` }}>

              {/* Worker info cell */}
              <div className="px-3 py-2 flex items-center gap-2 shrink-0">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold shrink-0">
                  {worker.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{worker.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{worker.role}</p>
                </div>
              </div>

              {/* Slot cells */}
              {dates.flatMap((date, di) =>
                HOURS.map((hour, hi) => {
                  const slot = getSlot(worker.id, isoDate(date), hour);
                  const slotKey = `${worker.id}-${isoDate(date)}-${hour}`;
                  const isHovered = hoveredSlot === slotKey;
                  const status: SlotStatus = slot?.status ?? 'available';

                  return (
                    <div
                      key={slotKey}
                      className={`relative h-10 border-t-0 transition-all
                        ${hi === 0 ? 'border-l border-border' : 'border-l border-border/30'}
                        ${statusColors[status]}`}
                      onMouseEnter={() => setHoveredSlot(slotKey)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={() => {
                        if (status === 'available' && onSlotClick) {
                          onSlotClick(worker.id, isoDate(date), hour);
                        }
                      }}
                    >
                      {/* Allocated: show task name on wider view */}
                      {status === 'allocated' && slot?.taskTitle && (
                        <div className="absolute inset-0 flex items-center justify-center px-0.5 overflow-hidden">
                          <span className="text-[8px] text-primary font-medium truncate leading-tight text-center">
                            {slot.taskTitle}
                          </span>
                        </div>
                      )}

                      {/* Leave indicator */}
                      {status === 'leave' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[9px] text-warning">L</span>
                        </div>
                      )}

                      {/* Hover tooltip */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-20 w-36 p-2 rounded-lg bg-popover border border-border shadow-lg pointer-events-none">
                          <p className="text-[10px] font-medium text-foreground">{`${hour}:00 – ${hour + 1}:00`}</p>
                          <p className={`text-[10px] mt-0.5 ${
                            status === 'available' ? 'text-success' :
                            status === 'allocated' ? 'text-primary' :
                            status === 'leave' ? 'text-warning' : 'text-muted-foreground'
                          }`}>{statusLabels[status]}</p>
                          {slot?.taskTitle && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{slot.taskTitle}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ))}

          {/* Day load summary row */}
          <div className="grid bg-secondary/30 border-t border-border"
            style={{ gridTemplateColumns: `140px repeat(${DAYS_TO_SHOW * HOURS.length}, 1fr)` }}>
            <div className="px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wider flex items-center">
              Daily load
            </div>
            {dates.flatMap((date, di) =>
              HOURS.map((_, hi) => {
                if (hi !== 4) return (
                  <div key={`load-${di}-${hi}`}
                    className={`${hi === 0 ? 'border-l border-border' : 'border-l border-border/30'}`} />
                );
                // Show load % at center slot (hour index 4 = 1pm)
                const allWorkerLoads = displayWorkers.map(w => getWorkerDayLoad(w.id, isoDate(date)));
                const avgLoad = Math.round(allWorkerLoads.reduce((a, b) => a + b, 0) / allWorkerLoads.length);
                return (
                  <div key={`load-center-${di}`}
                    className="col-span-9 border-l border-border py-1.5 flex items-center justify-center">
                    <span className={`text-[10px] font-medium
                      ${avgLoad >= 80 ? 'text-destructive' : avgLoad >= 60 ? 'text-warning' : 'text-success'}`}>
                      {avgLoad}% avg load
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}