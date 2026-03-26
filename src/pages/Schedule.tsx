'use client';

import { useState, useEffect } from 'react';
import { fetchScheduleData, type ScheduleSlot, type Worker, type Task } from '../services/scheduleService';
import LoadingState from '../components/ui/loadingstate';
import ErrorState from '../components/ui/errorstate';
import WeeklyView from '../components/WeeklyView';
import DailyView from '../components/DailyView';

export default function Schedule() {
  const [view, setView]       = useState<'weekly' | 'daily'>('weekly');
  const [slots, setSlots]     = useState<ScheduleSlot[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScheduleData();
      setSlots(data.slots);
      setWorkers(data.workers);
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {view === 'weekly' ? 'Weekly hour blocks per worker' : 'Daily hourly slot breakdown per worker'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/60 border border-border/40">
          <button
            onClick={() => setView('weekly')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              view === 'weekly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView('daily')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              view === 'daily' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Daily
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : view === 'weekly' ? (
        <WeeklyView slots={slots} workers={workers} />
      ) : (
        <DailyView slots={slots} workers={workers} tasks={tasks} />
      )}

      {!loading && !error && view === 'daily' && (
        <div className="flex gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-allocated inline-block" /> Allocated</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-available inline-block" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-leave inline-block" /> Leave</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-blocked inline-block" /> Blocked</span>
        </div>
      )}
    </div>
  );
}