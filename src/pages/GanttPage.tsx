// GanttChart.jsx
import { useState, useCallback, useEffect, useRef } from "react";
import { Gantt, Willow } from "@svar-ui/react-gantt";

import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";

function toISODate(d) {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const quarterFormat = (date) => {
  const d = new Date(date);
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
};

const SCALE_PRESETS = {
  week: [
    { unit: "month", step: 1, format: "%F %Y" },
    { unit: "week",  step: 1, format: "Week %W" },
    { unit: "day",   step: 1, format: "%j" },
  ],
  month: [
    { unit: "quarter", step: 1, format: quarterFormat },
    { unit: "month",   step: 1, format: "%F %Y" },
  ],
  quarter: [
    { unit: "year",    step: 1, format: "%Y" },
    { unit: "quarter", step: 1, format: quarterFormat },
  ],
};

function statusToColor(status = "") {
  const map = {
    done:          "#10b981",
    completed:     "#10b981",
    "in-progress": "#3b82f6",
    in_progress:   "#3b82f6",
    active:        "#3b82f6",
    pending:       "#94a3b8",
    todo:          "#94a3b8",
    blocked:       "#ef4444",
  };
  return map[(status ?? "").toLowerCase()] ?? "#3b82f6";
}

const columns = [
  { id: "text",     header: "Task Name", width: 220, flexgrow: 1 },
  { id: "start",    header: "Start",     width: 100, align: "center" },
  { id: "duration", header: "Days",      width: 60,  align: "center" },
  {
    id: "progress",
    header: "%",
    width: 55,
    align: "center",
    template: (task) =>
      task.type !== "milestone" ? `${task.progress ?? 0}%` : "—",
  },
];

const PROJECT_ID_OFFSET = 1_000_000_000;
const projectRowId = (rawId) => PROJECT_ID_OFFSET + Number(rawId);
const rawProjectId  = (rowId) => rowId - PROJECT_ID_OFFSET;
const isProjectRow  = (id)   => id >= PROJECT_ID_OFFSET;

function statusToProgress(status = "") {
  const map = {
    done: 100, completed: 100,
    "in-progress": 50, in_progress: 50, active: 50,
    pending: 0, todo: 0, blocked: 0,
  };
  return map[(status ?? "").toLowerCase()] ?? 0;
}

function safeDate(raw, fallback = new Date()) {
  if (!raw) return fallback;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? fallback : d;
}

function daysBetween(a, b) {
  const diff = Math.round((b - a) / 86_400_000);
  return Number.isFinite(diff) && diff > 0 ? diff : 1;
}

function buildGanttRows(projects, apiTasks) {
  const validProjectIds = new Set(projects.map((p) => Number(p.id)));
  const rows = [];

  for (const p of projects) {
    const numId  = Number(p.id);
    const pRowId = projectRowId(numId);

    const childTasks = apiTasks.filter((t) => Number(t.project_id) === numId);

    const mappedChildren = childTasks.map((t) => {
      const start = safeDate(t.start_date ?? t.start);
      const end   = safeDate(
        t.end_date ?? t.end,
        new Date(start.getTime() + 7 * 86_400_000)
      );
      return {
        id:       Number(t.id),
        text:     String(t.title ?? t.name ?? `Task ${t.id}`),
        start,
        end,
        duration: daysBetween(start, end),
        progress: statusToProgress(t.status),
        color:    statusToColor(t.status),
        status:   t.status ?? "pending",
        type:     "task",
        parent:   pRowId,
        _raw:     t,
      };
    });

    const hasChildren = mappedChildren.length > 0;

    let pStart = p.start_date ? safeDate(p.start_date) : null;
    let pEnd   = p.end_date   ? safeDate(p.end_date)   : null;

    if (!pStart && hasChildren)
      pStart = new Date(Math.min(...mappedChildren.map((c) => c.start.getTime())));
    if (!pEnd && hasChildren)
      pEnd = new Date(Math.max(...mappedChildren.map((c) => c.end.getTime())));

    pStart = pStart ?? new Date();
    pEnd   = pEnd   ?? new Date(pStart.getTime() + 30 * 86_400_000);

    const avgProgress = hasChildren
      ? Math.round(
          mappedChildren.reduce((s, c) => s + (c.progress ?? 0), 0) /
            mappedChildren.length
        )
      : 0;

    rows.push({
      id:       pRowId,
      text:     String(p.name),
      start:    pStart,
      end:      pEnd,
      duration: daysBetween(pStart, pEnd),
      progress: avgProgress,
      color:    statusToColor(p.status),
      status:   p.status ?? "pending",
      type:     "summary",
      parent:   0,
      open:     hasChildren,
      _raw:     p,
    });

    rows.push(...mappedChildren);
  }

  for (const t of apiTasks) {
    if (t.project_id != null && validProjectIds.has(Number(t.project_id)))
      continue;

    const start = safeDate(t.start_date ?? t.start);
    const end   = safeDate(
      t.end_date ?? t.end,
      new Date(start.getTime() + 7 * 86_400_000)
    );
    rows.push({
      id:       Number(t.id),
      text:     String(t.title ?? t.name ?? `Task ${t.id}`),
      start,
      end,
      duration: daysBetween(start, end),
      progress: statusToProgress(t.status),
      color:    statusToColor(t.status),
      status:   t.status ?? "pending",
      type:     "task",
      parent:   0,
      _raw:     t,
    });
  }

  return rows;
}

// ── Dependency helpers ────────────────────────────────────────────────────────

/**
 * Fetch all dependencies for every leaf task in parallel.
 * Returns SVAR-compatible link objects:
 *   { id: string, source: number, target: number, type: 0 }
 * where type 0 = finish-to-start (default).
 */
async function fetchAllLinks(taskRows) {
  const leafIds = taskRows
    .filter((r) => r.type === "task")
    .map((r) => r.id);

  const results = await Promise.allSettled(
    leafIds.map((id) =>
      taskService.getTaskDependencies(id).then((deps) =>
        (deps ?? []).map((dep) => ({
          // stable id: "source-target"
          id:     `${dep.depends_on_id ?? dep.id}-${id}`,
          source: Number(dep.depends_on_id ?? dep.id),
          target: Number(id),
          type:   0, // finish-to-start
        }))
      )
    )
  );

  const links = [];
  for (const r of results) {
    if (r.status === "fulfilled") links.push(...r.value);
  }

  // Deduplicate by id
  const seen = new Set();
  return links.filter((l) => {
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });
}

/**
 * Detect cycles using DFS before persisting a new link.
 * adjacency: Map<number, number[]>  (source → [targets])
 */
function wouldCreateCycle(adjacency, newSource, newTarget) {
  // If newTarget can reach newSource, adding newSource→newTarget creates a cycle
  const visited = new Set();
  const stack = [newTarget];
  while (stack.length) {
    const node = stack.pop();
    if (node === newSource) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const neighbour of adjacency.get(node) ?? []) {
      stack.push(neighbour);
    }
  }
  return false;
}

function buildAdjacency(links) {
  const map = new Map();
  for (const l of links) {
    if (!map.has(l.source)) map.set(l.source, []);
    map.get(l.source).push(l.target);
  }
  return map;
}

// ── UI sub-components ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <>
      <style>{`@keyframes _gspin{to{transform:rotate(360deg)}}`}</style>
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid #e2e8f0",
          borderTopColor: "#3b82f6",
          borderRadius: "50%",
          animation: "_gspin 0.8s linear infinite",
        }}
      />
    </>
  );
}

function SaveToast({ message, type }) {
  if (!message) return null;
  const bg     = type === "error" ? "#fef2f2" : "#f0fdf4";
  const color  = type === "error" ? "#dc2626" : "#16a34a";
  const border = type === "error" ? "#fecaca" : "#bbf7d0";
  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        zIndex: 50,
        background: bg,
        border: `1px solid ${border}`,
        color,
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {type === "error" ? "⚠️" : "✓"} {message}
    </div>
  );
}

function GanttInner({ tasks, links, scales, isDark, onApiReady }) {
  return (
    <Willow theme={isDark ? "dark" : undefined}>
      <Gantt
        tasks={tasks}
        links={links}
        scales={scales ?? SCALE_PRESETS.month}
        columns={columns}
        readonly={false}
        init={onApiReady}
      />
    </Willow>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GanttChart() {
  const [tasks,   setTasks]   = useState(null);
  const [links,   setLinks]   = useState([]);
  const [zoom,    setZoom]    = useState("month");
  const [theme,   setTheme]   = useState("light");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [saveMsg,  setSaveMsg]  = useState(null);
  const [saveType, setSaveType] = useState("success");
  const saveTimerRef = useRef(null);

  // Stable key so GanttInner re-mounts when data reloads
  const loadKey = tasks ? tasks.map((t) => t.id).join(",") : "empty";

  const apiRef = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    setSaveMsg(msg);
    setSaveType(type);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveMsg(null), 3000);
  }, []);

  // ── Save task date changes ──────────────────────────────────────────────────
  const saveTaskUpdate = useCallback(async (updated) => {
    const start = toISODate(updated.start);
    const end   = toISODate(updated.end);

    if (isProjectRow(updated.id)) {
      const pid = rawProjectId(updated.id);
      await projectService.updateProject(pid, { start_date: start, end_date: end });
    } else {
      await taskService.updateTaskDates(updated.id, start, end);
    }
  }, []);

  // ── Wire Gantt events ───────────────────────────────────────────────────────
  const handleApiReady = useCallback(
    (api) => {
      apiRef.current?.detach?.();
      apiRef.current = api;

      // Task drag / resize → save dates
      api.on("update-task", async (ev) => {
        const updated = ev.task ?? ev;

        setTasks((prev) =>
          prev?.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) ?? prev
        );

        try {
          await saveTaskUpdate(updated);
          showToast("Saved", "success");
        } catch (err) {
          console.error("Gantt save failed:", err);
          showToast("Save failed — reverting", "error");
          loadData();
        }
      });

      // ── add-link: user draws an arrow ──────────────────────────────────────
      api.on("add-link", async (ev) => {
        const { source, target, type = 0 } = ev.link ?? ev;

        // Only allow task→task links (not project summary rows)
        if (isProjectRow(source) || isProjectRow(target)) {
          showToast("Cannot link project summary rows", "error");
          return;
        }

        // Cycle guard
        setLinks((prev) => {
          const adj = buildAdjacency(prev);
          if (wouldCreateCycle(adj, Number(source), Number(target))) {
            showToast("Circular dependency detected — link not saved", "error");
            return prev; // reject
          }

          const newLink = {
            id:     `${source}-${target}`,
            source: Number(source),
            target: Number(target),
            type,
          };

          // Persist to backend (fire-and-forget, revert on failure)
          taskService
            .addDependency(Number(target), Number(source))
            .then(() => showToast("Dependency saved", "success"))
            .catch((err) => {
              console.error("add-link save failed:", err);
              showToast("Dependency save failed — reverting", "error");
              setLinks((p) => p.filter((l) => l.id !== newLink.id));
            });

          // Deduplicate
          if (prev.some((l) => l.id === newLink.id)) return prev;
          return [...prev, newLink];
        });
      });

      // ── delete-link: user removes an arrow ────────────────────────────────
      api.on("delete-link", async (ev) => {
        const linkId = ev.id ?? ev.link?.id;

        setLinks((prev) => {
          const target = prev.find((l) => l.id === linkId);
          if (!target) return prev;

          // Persist deletion to backend
          taskService
            .removeDependency(Number(target.target), Number(target.source))
            .then(() => showToast("Dependency removed", "success"))
            .catch((err) => {
              console.error("delete-link save failed:", err);
              showToast("Remove failed — reverting", "error");
              setLinks((p) => [...p, target]); // put it back
            });

          return prev.filter((l) => l.id !== linkId);
        });
      });
    },
    [saveTaskUpdate, showToast]
  );

  // ── Load all data ───────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTasks(null);
    setLinks([]);

    try {
      const [projects, apiTasks] = await Promise.all([
        projectService.getProjects(),
        taskService.getTasks(),
      ]);

      const rows = buildGanttRows(projects, apiTasks);
      setTasks(rows);

      // Fetch dependencies for all leaf tasks in parallel
      try {
        const fetchedLinks = await fetchAllLinks(rows);
        setLinks(fetchedLinks);
      } catch (depErr) {
        console.warn("Failed to load some dependencies:", depErr);
        // Non-fatal — show chart without arrows
      }
    } catch (err) {
      console.error("Gantt load failed:", err);
      setError(err.message ?? "Failed to load data");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const allRows     = tasks ?? [];
  const projectRows = allRows.filter((r) => r.type === "summary");
  const leafTasks   = allRows.filter((r) => r.type === "task");

  const doneTasks = leafTasks.filter((t) =>
    ["done", "completed"].includes((t.status ?? "").toLowerCase())
  ).length;

  const avgProgress =
    leafTasks.length > 0
      ? Math.round(
          leafTasks.reduce((s, t) => s + (t.progress ?? 0), 0) / leafTasks.length
        )
      : 0;

  const overdueTasks = leafTasks.filter((t) => {
    const isIncomplete = !["done", "completed"].includes(
      (t.status ?? "").toLowerCase()
    );
    return isIncomplete && t.end && new Date(t.end) < new Date();
  }).length;

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const isDark    = theme === "dark";
  const surface   = isDark ? "#1e2433" : "#fff";
  const border    = isDark ? "#2d3748" : "#e2e8f0";
  const textMuted = isDark ? "#e2e8f0" : "#374151";

  const ganttReady = Array.isArray(tasks) && tasks.length > 0 && !loading;

  // ── Dynamic height ──────────────────────────────────────────────────────────
  // +4 rows of padding so the last task bar is never clipped
 // ── Dynamic height ──────────────────────────────────────────────────────────
const ROW_HEIGHT    = 44;
const HEADER_HEIGHT = 120;
const MIN_HEIGHT    = 400;
const ganttHeight   = Math.max(
  MIN_HEIGHT,
  HEADER_HEIGHT + (allRows.length * ROW_HEIGHT) + 200
);
  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "100vh",
        background: isDark ? "#0f1117" : "#f4f6f9",
        color: isDark ? "#e2e8f0" : "#1a202c",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
<style>{`
  .wx-willow-theme ::-webkit-scrollbar,
  .wx-gantt ::-webkit-scrollbar {
    height: 12px !important;
    width: 8px !important;
  }
  .wx-willow-theme ::-webkit-scrollbar-track,
  .wx-gantt ::-webkit-scrollbar-track {
    background: ${isDark ? "#2d3748" : "#f1f5f9"} !important;
    border-radius: 6px !important;
  }
  .wx-willow-theme ::-webkit-scrollbar-thumb,
  .wx-gantt ::-webkit-scrollbar-thumb {
    background: ${isDark ? "#4a5568" : "#94a3b8"} !important;
    border-radius: 6px !important;
    border: 2px solid ${isDark ? "#2d3748" : "#f1f5f9"} !important;
  }
  .wx-willow-theme ::-webkit-scrollbar-thumb:hover,
  .wx-gantt ::-webkit-scrollbar-thumb:hover {
    background: ${isDark ? "#718096" : "#64748b"} !important;
  }

  /* ↓ ADD THESE 3 LINES */
  .wx-gantt { overflow-y: auto !important; }
  .wx-area  { overflow-y: visible !important; }
  .wx-bars  { overflow: visible !important; }
`}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            📋 Project Timeline
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.6 }}>
            Drag tasks to reschedule · Changes auto-save · Draw arrows to link dependencies
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Projects",     value: projectRows.length,    color: "#8b5cf6" },
            { label: "Tasks",        value: leafTasks.length,      color: "#3b82f6" },
            { label: "Done",         value: doneTasks,             color: "#10b981" },
            { label: "Avg Progress", value: `${avgProgress}%`,    color: "#0ea5e9" },
            { label: "Links",        value: links.length,          color: "#f59e0b" },
            ...(overdueTasks > 0
              ? [{ label: "Overdue", value: overdueTasks, color: "#ef4444" }]
              : []),
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: surface,
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontWeight: 700, color }}>{value}</span>
              <span style={{ opacity: 0.6 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Zoom */}
        <div style={{ display: "flex", gap: 4 }}>
          {Object.keys(SCALE_PRESETS).map((level) => (
            <button
              key={level}
              onClick={() => setZoom(level)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: zoom === level ? 700 : 400,
                background: zoom === level ? "#3b82f6" : surface,
                color: zoom === level ? "#fff" : textMuted,
                border: `1px solid ${zoom === level ? "#3b82f6" : border}`,
                transition: "all 0.15s",
              }}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            fontSize: 13,
            border: `1px solid ${border}`,
            background: surface,
            color: textMuted,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "⟳ Loading…" : "⟳ Refresh"}
        </button>

        <button
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            fontSize: 13,
            border: `1px solid ${border}`,
            background: surface,
            color: textMuted,
            cursor: "pointer",
          }}
        >
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>

        {/* Dependency legend */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            opacity: 0.6,
            padding: "4px 10px",
            border: `1px solid ${border}`,
            borderRadius: 6,
            background: surface,
          }}
        >
         
        </div>
      </div>

      {/* ── CORS hint ── */}
      {error && error.toLowerCase().includes("fetch") && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 12,
            fontSize: 13,
            color: "#92400e",
          }}
        >
          <strong>CORS / network error.</strong> Add{" "}
          <code>CORSMiddleware</code> to your FastAPI <code>main.py</code>.
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 16,
            color: "#dc2626",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={loadData}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#dc2626",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Gantt wrapper — height grows with row count ── */}
    <div
  style={{
    borderRadius: 12,
    
    border: `1px solid ${border}`,
    boxShadow: isDark
      ? "0 4px 24px rgba(0,0,0,0.4)"
      : "0 2px 12px rgba(0,0,0,0.06)",
    height: ganttHeight,
    position: "relative",
    background: surface,
  }}
>
        {(loading || tasks === null) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Spinner />
            <span style={{ fontSize: 13, opacity: 0.6 }}>
              Loading projects &amp; tasks…
            </span>
          </div>
        )}

        {!loading && tasks !== null && tasks.length === 0 && !error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: 0.5,
            }}
          >
            <span style={{ fontSize: 32 }}>📭</span>
            <p style={{ fontSize: 14, margin: 0 }}>No projects or tasks found.</p>
          </div>
        )}

        {ganttReady && (
          <GanttInner
            key={loadKey}
            tasks={tasks}
            links={links}
            scales={SCALE_PRESETS[zoom]}
            isDark={isDark}
            onApiReady={handleApiReady}
          />
        )}

        <SaveToast message={saveMsg} type={saveType} />
      </div>

      <p
        style={{
          marginTop: 8,
          fontSize: 12,
          opacity: 0.4,
          textAlign: "center",
        }}
      >
        Double-click a task bar to edit · Drag bars to reschedule (auto-saves) · Draw arrows for dependencies · Click an arrow to delete it
      </p>
    </div>
  );
}