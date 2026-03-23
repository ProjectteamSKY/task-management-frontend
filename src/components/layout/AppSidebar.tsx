import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardIcon,
  KanbanIcon,
  WorkersIcon,
  TasksIcon,
  ScheduleIcon,
  PlanningIcon,
  MenuIcon,
  CloseIcon,
  KPISetupIcon,
  KPIReportIcon,
} from '@/components/icons/Icons';

// Dedicated MemberTasks icon — person + task lines + check
const MemberTasksIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="9" cy="7" r="3" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.5h5" />
    <path d="M16 7.5h5" />
    <path d="M16 11.5h5" />
    <path d="M14 15.5l1.5 1.5 3-3" />
  </svg>
);

const navItems = [
  { label: 'Dashboard',          path: '/',             icon: DashboardIcon },
  { label: 'Workforce Planning', path: '/planning',     icon: PlanningIcon },
  { label: 'Kanban Board',       path: '/kanban',       icon: KanbanIcon },
  { label: 'Workers',            path: '/workers',      icon: WorkersIcon },
  { label: 'Member Tasks',       path: '/member-tasks', icon: MemberTasksIcon },
  { label: 'Tasks',              path: '/tasks',        icon: TasksIcon },
  { label: 'Schedule',           path: '/schedule',     icon: ScheduleIcon },
  { label: 'KPI Setup',          path: '/kpi-setup',    icon: KPISetupIcon },
  { label: 'KPI Reporting',      path: '/kpi-reporting',icon: KPIReportIcon },
];

export default function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">WF</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-sidebar-accent-foreground text-[15px] truncate">
            WorkForce
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {!collapsed && (
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground px-3 mb-2 block">
            Menu
          </span>
        )}
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                size={19}
                className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
        >
          {collapsed ? <MenuIcon size={18} /> : <CloseIcon size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}