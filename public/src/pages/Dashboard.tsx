import { workers, tasks, taskAssignments, getOverallWorkload, workerPerformance, scheduleSlots } from '@/data/mockData';
import { TrendUpIcon, WorkersIcon, TasksIcon, ClockIcon, AlertIcon, CheckIcon } from '@/components/icons/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const StatCard = ({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub: string; icon: any; color: string }) => (
  <div className="glass rounded-xl p-5 animate-fade-in">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const priorityCounts = {
  critical: tasks.filter(t => t.priority === 'critical').length,
  high: tasks.filter(t => t.priority === 'high').length,
  medium: tasks.filter(t => t.priority === 'medium').length,
  low: tasks.filter(t => t.priority === 'low').length,
};

const statusData = [
  { name: 'Backlog', value: tasks.filter(t => t.status === 'backlog').length },
  { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length },
  { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
  { name: 'Review', value: tasks.filter(t => t.status === 'review').length },
  { name: 'Done', value: tasks.filter(t => t.status === 'done').length },
];

const PIE_COLORS = ['hsl(225 18% 30%)', 'hsl(210 100% 56%)', 'hsl(38 92% 55%)', 'hsl(280 65% 60%)', 'hsl(152 60% 45%)'];

const workloadData = workers.filter(w => w.status === 'active').map(w => ({
  name: w.name.split(' ')[0],
  workload: getOverallWorkload(w.id),
  capacity: 100,
}));

const weeklyTrend = [
  { day: 'Mon', completed: 5, created: 8 },
  { day: 'Tue', completed: 7, created: 4 },
  { day: 'Wed', completed: 6, created: 6 },
  { day: 'Thu', completed: 9, created: 5 },
  { day: 'Fri', completed: 4, created: 7 },
];

export default function Dashboard() {
  const activeWorkers = workers.filter(w => w.status === 'active').length;
  const pendingApprovals = taskAssignments.filter(a => a.approvalStatus === 'pending').length;
  const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Workforce overview and task analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={tasks.length} sub={`${completedTasks} completed`} icon={TasksIcon} color="bg-primary/15 text-primary" />
        <StatCard label="Active Workers" value={activeWorkers} sub={`${workers.length} total`} icon={WorkersIcon} color="bg-success/15 text-success" />
        <StatCard label="Pending Approvals" value={pendingApprovals} sub="Awaiting review" icon={AlertIcon} color="bg-warning/15 text-warning" />
        <StatCard label="Total Work Hours" value={`${totalHours}h`} sub="Estimated this week" icon={ClockIcon} color="bg-purple-500/15 text-purple-400" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Workload chart */}
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Worker Workload (%)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={workloadData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'hsl(225 22% 13%)', border: '1px solid hsl(225 18% 18%)', borderRadius: '8px', color: 'hsl(210 20% 92%)' }}
              />
              <Bar dataKey="workload" fill="hsl(210 100% 56%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task distribution */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Task Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(225 22% 13%)', border: '1px solid hsl(225 18% 18%)', borderRadius: '8px', color: 'hsl(210 20% 92%)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {statusData.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weeklyTrend}>
              <XAxis dataKey="day" tick={{ fill: 'hsl(215 15% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(225 22% 13%)', border: '1px solid hsl(225 18% 18%)', borderRadius: '8px', color: 'hsl(210 20% 92%)' }} />
              <Area type="monotone" dataKey="completed" stroke="hsl(152 60% 45%)" fill="hsl(152 60% 45% / 0.15)" strokeWidth={2} />
              <Area type="monotone" dataKey="created" stroke="hsl(210 100% 56%)" fill="hsl(210 100% 56% / 0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priority breakdown */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Priority Breakdown</h3>
          <div className="space-y-3">
            {([['Critical', priorityCounts.critical, 'bg-destructive'], ['High', priorityCounts.high, 'bg-warning'], ['Medium', priorityCounts.medium, 'bg-primary'], ['Low', priorityCounts.low, 'bg-muted-foreground']] as [string, number, string][]).map(([label, count, color]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-14">{label}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${(count / tasks.length) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-foreground w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Assignments</h3>
          <div className="space-y-3">
            {taskAssignments.slice(0, 5).map(a => {
              const task = tasks.find(t => t.id === a.taskId);
              const worker = workers.find(w => w.id === a.workerId);
              return (
                <div key={a.id} className="flex items-center gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-medium shrink-0">
                    {worker?.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{task?.title}</p>
                    <p className="text-muted-foreground">{worker?.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    a.approvalStatus === 'approved' ? 'bg-success/15 text-success' :
                    a.approvalStatus === 'pending' ? 'bg-warning/15 text-warning' :
                    'bg-destructive/15 text-destructive'
                  }`}>
                    {a.approvalStatus}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
