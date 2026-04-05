// GanttChart.jsx
// Install: npm install @svar-ui/react-gantt
// Import the CSS in your main entry file: import '@svar-ui/react-gantt/all.css';
//
// ─── CORS FIX (FastAPI backend) ───────────────────────────────────────────────
// Add this to your main.py BEFORE any route definitions:
//
//   from fastapi.middleware.cors import CORSMiddleware
//   app.add_middleware(
//       CORSMiddleware,
//       allow_origins=["http://localhost:8080"],  // or ["*"] during dev
//       allow_credentials=True,
//       allow_methods=["*"],
//       allow_headers=["*"],
//   )
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from "react";
import { Gantt, Willow } from "@svar-ui/react-gantt";

import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";

// ─── Quarter formatter (fixes Q7 bug) ────────────────────────────────────────
const quarterFormat = (date) => {
  const d = new Date(date);
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
};

// ─── Scale Presets ────────────────────────────────────────────────────────────
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

// ─── ID Strategy ──────────────────────────────────────────────────────────────
const PROJECT_ID_OFFSET = 1_000_000_000;
const projectRowId = (rawId) => PROJECT_ID_OFFSET + Number(rawId);

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Tree Builder ─────────────────────────────────────────────────────────────
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
        type:     "task",
        parent:   pRowId,
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
      type:     "summary",
      parent:   0,
      open:     hasChildren,
    });

    rows.push(...mappedChildren);
  }

  // Orphaned tasks
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
      type:     "task",
      parent:   0,
    });
  }

  return rows;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
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

// ─── GanttInner ───────────────────────────────────────────────────────────────
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

// ─── Scroll Button Component ──────────────────────────────────────────────────
function ScrollBtn({ dir, onClick, surface, border, textMuted }) {
  return (
    <button
      onClick={onClick}
      title={dir === "left" ? "Scroll Back" : "Scroll Forward"}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        border: `1px solid ${border}`,
        background: surface,
        color: textMuted,
        cursor: "pointer",
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
    >
      {dir === "left" ? "◀" : "▶"}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GanttChart() {
  const [tasks,   setTasks]   = useState(null);
  const [links,   setLinks]   = useState([]);
  const [zoom,    setZoom]    = useState("month");
  const [theme,   setTheme]   = useState("light");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const loadKey = tasks ? tasks.map((t) => t.id).join(",") : "empty";

  const apiRef         = useRef(null);
  const ganttWrapperRef = useRef(null);

  // ── Scroll helpers ────────────────────────────────────────────────────────
  const scrollTimeline = useCallback((direction) => {
    // Try multiple selectors — SVAR's internal scroll container class may vary
    const selectors = [
      ".wx-gantt-scroll-x",
      ".wx-scroll-x",
      ".gantt-scroll",
      "[class*='gantt'] [class*='scroll']",
      "[class*='timeline'] [class*='scroll']",
    ];

    let scrollEl = null;

    // First try within the wrapper ref
    if (ganttWrapperRef.current) {
      for (const sel of selectors) {
        scrollEl = ganttWrapperRef.current.querySelector(sel);
        if (scrollEl) break;
      }

      // Fallback: find any horizontally scrollable div inside the wrapper
      if (!scrollEl) {
        const allDivs = ganttWrapperRef.current.querySelectorAll("div");
        for (const div of allDivs) {
          if (div.scrollWidth > div.clientWidth + 10) {
            scrollEl = div;
            break;
          }
        }
      }
    }

    if (scrollEl) {
      scrollEl.scrollLeft += direction === "left" ? -300 : 300;
    }
  }, []);

  // ── API Ready callback ────────────────────────────────────────────────────
  const handleApiReady = useCallback((api) => {
    apiRef.current?.detach?.();
    apiRef.current = api;

    api.on("update-task", (ev) => {
      const updated = ev.task ?? ev;
      setTasks((prev) =>
        prev?.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) ?? prev
      );
    });

    api.on("add-link", (ev) => {
      setLinks((p) => [...p, { id: Date.now(), ...ev.link }]);
    });

    api.on("delete-link", (ev) => {
      setLinks((p) => p.filter((l) => l.id !== (ev.id ?? ev.link?.id)));
    });
  }, []);

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTasks(null);

    try {
      const [projects, apiTasks] = await Promise.all([
        projectService.getProjects(),
        taskService.getTasks(),
      ]);

      const rows = buildGanttRows(projects, apiTasks);
      setTasks(rows);
      setLinks([]);
    } catch (err) {
      console.error("Gantt load failed:", err);
      setError(err.message ?? "Failed to load data");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const allRows     = tasks ?? [];
  const projectRows = allRows.filter((r) => r.type === "summary");
  const leafTasks   = allRows.filter((r) => r.type === "task");
  const avgProgress =
    leafTasks.length > 0
      ? Math.round(
          leafTasks.reduce((s, t) => s + (t.progress ?? 0), 0) / leafTasks.length
        )
      : 0;

  const isDark    = theme === "dark";
  const surface   = isDark ? "#1e2433" : "#fff";
  const border    = isDark ? "#2d3748" : "#e2e8f0";
  const textMuted = isDark ? "#e2e8f0" : "#374151";

  const ganttReady = Array.isArray(tasks) && tasks.length > 0 && !loading;

  // ── Render ────────────────────────────────────────────────────────────────
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
      {/* ── Scrollbar style injection ── */}
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
            Drag tasks to reschedule · Draw arrows to link dependencies
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Projects",     value: projectRows.length, color: "#8b5cf6" },
            { label: "Tasks",        value: leafTasks.length,   color: "#3b82f6" },
            { label: "Avg Progress", value: `${avgProgress}%`,  color: "#10b981" },
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
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Zoom buttons */}
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

        <div style={{ flex: 1 }} />

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

      {/* ── Gantt wrapper ── */}
      <div ref={ganttWrapperRef}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${border}`,
          boxShadow: isDark
            ? "0 4px 24px rgba(0,0,0,0.4)"
            : "0 2px 12px rgba(0,0,0,0.06)",
          height: 560,
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
      </div>

      {/* ── Bottom scroll controls ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginTop: 14,
        }}
      >
        <button
          onClick={() => scrollTimeline("left")}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: surface,
            color: textMuted,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          ◀ Scroll Left
        </button>

        <span style={{ fontSize: 12, opacity: 0.4 }}>
          scroll timeline
        </span>

        <button
          onClick={() => scrollTimeline("right")}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: surface,
            color: textMuted,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          Scroll Right ▶
        </button>
      </div>

      <p
        style={{
          marginTop: 8,
          fontSize: 12,
          opacity: 0.4,
          textAlign: "center",
        }}
      >
        Double-click a task bar to edit · Drag bars to reschedule · Draw arrows for dependencies
      </p>
    </div>
  );
}