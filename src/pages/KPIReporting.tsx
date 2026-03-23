import { useState } from 'react';
import { clients, kpiDefinitions, kpiEntries, kpiReports, getClientKPIs, getClientEntries, getKPIStatusBg, getKPIStatusColor } from '@/data/kpiMockData';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';

const statusLabels: Record<string, string> = { exceeded: 'Exceeded', on_track: 'On Track', at_risk: 'At Risk', behind: 'Behind' };

export default function KPIReporting() {
  const [selectedClient, setSelectedClient] = useState(clients[0].id);
  const [viewMode, setViewMode] = useState<'manager' | 'client'>('manager');

  const client = clients.find(c => c.id === selectedClient)!;
  const clientKPIs = getClientKPIs(selectedClient);
  const clientEntries = getClientEntries(selectedClient);
  const reports = kpiReports.filter(r => r.clientId === selectedClient);
  const latestReport = reports[0];

  // Chart data
  const achievementData = latestReport?.kpiBreakdown.map(b => {
    const kpi = kpiDefinitions.find(k => k.id === b.kpiId);
    return { name: kpi?.name?.substring(0, 18) || '', achievement: b.achievement, target: 100 };
  }) || [];

  const radarData = clientKPIs.map(kpi => {
    const entry = clientEntries.find(e => e.kpiId === kpi.id);
    const achievement = entry ? (entry.actualValue / entry.targetValue) * 100 : 0;
    return { metric: kpi.name.substring(0, 14), value: Math.min(achievement, 120), fullMark: 120 };
  });

  // Trend data (mock multiple periods)
  const trendKPI = clientKPIs[0];
  const trendEntries = trendKPI ? clientEntries.filter(e => e.kpiId === trendKPI.id).reverse() : [];
  const trendData = trendEntries.map(e => ({ period: e.period.replace('2026-', ''), actual: e.actualValue, target: e.targetValue }));

  // KPI status distribution
  const statusCounts = { exceeded: 0, on_track: 0, at_risk: 0, behind: 0 };
  latestReport?.kpiBreakdown.forEach(b => { statusCounts[b.status]++; });
  const pieData = Object.entries(statusCounts).filter(([, v]) => v > 0).map(([k, v]) => ({ name: statusLabels[k], value: v, status: k }));
  const pieColors = { exceeded: 'hsl(152, 60%, 45%)', on_track: 'hsl(210, 100%, 56%)', at_risk: 'hsl(38, 92%, 55%)', behind: 'hsl(0, 72%, 55%)' };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-primary';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KPI Reporting</h1>
          <p className="text-sm text-muted-foreground mt-1">Performance insights for managers and clients</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button onClick={() => setViewMode('manager')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'manager' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              Manager View
            </button>
            <button onClick={() => setViewMode('client')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'client' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              Client View
            </button>
          </div>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px] bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {clients.filter(c => c.status === 'active').map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Score Cards */}
      {latestReport && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall Score</p>
            <p className={`text-3xl font-bold mt-2 ${getScoreColor(latestReport.overallScore)}`}>{latestReport.overallScore}</p>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={latestReport.overallScore} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Objective Score</p>
            <p className={`text-3xl font-bold mt-2 ${getScoreColor(latestReport.objectiveScore)}`}>{latestReport.objectiveScore}</p>
            <p className="text-xs text-muted-foreground mt-2">Data-driven metrics</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Subjective Score</p>
            <p className={`text-3xl font-bold mt-2 ${getScoreColor(latestReport.subjectiveScore)}`}>{latestReport.subjectiveScore}</p>
            <p className="text-xs text-muted-foreground mt-2">Qualitative assessments</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Report Period</p>
            <p className="text-lg font-semibold text-foreground mt-2">{latestReport.period}</p>
            <p className="text-xs text-muted-foreground mt-2">Generated {latestReport.generatedAt}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Achievement Chart */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">KPI Achievement vs Target</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={achievementData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 18%)" />
                    <XAxis type="number" domain={[0, 130]} tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(225, 22%, 13%)', border: '1px solid hsl(225, 18%, 18%)', borderRadius: 8, color: 'hsl(210, 20%, 92%)' }} />
                    <Bar dataKey="target" fill="hsl(225, 18%, 22%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="achievement" fill="hsl(210, 100%, 56%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Performance Radar</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(225, 18%, 18%)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 120]} tick={false} />
                    <Radar name="Achievement" dataKey="value" stroke="hsl(210, 100%, 56%)" fill="hsl(210, 100%, 56%)" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Pie */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">KPI Status Distribution</h3>
              <div className="h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4} strokeWidth={0}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={pieColors[entry.status as keyof typeof pieColors]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(225, 22%, 13%)', border: '1px solid hsl(225, 18%, 18%)', borderRadius: 8, color: 'hsl(210, 20%, 92%)' }} />
                    <Legend formatter={(value) => <span style={{ color: 'hsl(215, 15%, 55%)', fontSize: 12 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trend Preview */}
            {trendData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1">{trendKPI?.name} — Trend</h3>
                <p className="text-xs text-muted-foreground mb-4">Actual vs Target over time</p>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 18%)" />
                      <XAxis dataKey="period" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'hsl(225, 22%, 13%)', border: '1px solid hsl(225, 18%, 18%)', borderRadius: 8, color: 'hsl(210, 20%, 92%)' }} />
                      <Line type="monotone" dataKey="actual" stroke="hsl(210, 100%, 56%)" strokeWidth={2} dot={{ fill: 'hsl(210, 100%, 56%)', r: 4 }} />
                      <Line type="monotone" dataKey="target" stroke="hsl(215, 15%, 55%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Detailed Tab */}
        <TabsContent value="detailed" className="space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">KPI</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Target</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Actual</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Achievement</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Status</th>
                  {viewMode === 'manager' && <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Notes</th>}
                </tr>
              </thead>
              <tbody>
                {clientKPIs.map(kpi => {
                  const latestEntry = clientEntries.filter(e => e.kpiId === kpi.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
                  const breakdown = latestReport?.kpiBreakdown.find(b => b.kpiId === kpi.id);
                  return (
                    <tr key={kpi.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{kpi.name}</p>
                        <p className="text-xs text-muted-foreground">{kpi.category}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[10px] ${kpi.type === 'objective' ? 'border-primary/30 text-primary' : 'border-accent/30 text-accent'}`}>
                          {kpi.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{kpi.target}{kpi.unit}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{latestEntry?.actualValue ?? '—'}{latestEntry ? kpi.unit : ''}</td>
                      <td className="px-4 py-3">
                        {breakdown && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${breakdown.achievement >= 100 ? 'bg-success' : breakdown.achievement >= 90 ? 'bg-primary' : breakdown.achievement >= 75 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${Math.min(breakdown.achievement, 100)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{breakdown.achievement.toFixed(0)}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {breakdown && (
                          <Badge variant="outline" className={`text-[10px] ${getKPIStatusBg(breakdown.status)}`}>
                            {statusLabels[breakdown.status]}
                          </Badge>
                        )}
                      </td>
                      {viewMode === 'manager' && (
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{latestEntry?.notes || '—'}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {viewMode === 'manager' && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Recent KPI Submissions</h3>
              <div className="space-y-2">
                {clientEntries.slice(0, 6).map(entry => {
                  const kpi = kpiDefinitions.find(k => k.id === entry.kpiId);
                  return (
                    <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${entry.status === 'exceeded' ? 'bg-success' : entry.status === 'on_track' ? 'bg-primary' : entry.status === 'at_risk' ? 'bg-warning' : 'bg-destructive'}`} />
                        <div>
                          <p className="text-sm text-foreground">{kpi?.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.period} · by {entry.submittedBy}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{entry.actualValue}{kpi?.unit}</p>
                        <p className="text-xs text-muted-foreground">target: {entry.targetValue}{kpi?.unit}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {clientKPIs.filter(kpi => clientEntries.filter(e => e.kpiId === kpi.id).length > 1).map(kpi => {
            const entries = clientEntries.filter(e => e.kpiId === kpi.id).reverse();
            const data = entries.map(e => ({ period: e.period.replace('2026-', ''), actual: e.actualValue, target: e.targetValue }));
            return (
              <div key={kpi.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{kpi.name}</h3>
                    <p className="text-xs text-muted-foreground">{kpi.category} · {kpi.frequency} · Target: {kpi.target}{kpi.unit}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${kpi.type === 'objective' ? 'border-primary/30 text-primary' : 'border-accent/30 text-accent'}`}>{kpi.type}</Badge>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 18%)" />
                      <XAxis dataKey="period" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'hsl(225, 22%, 13%)', border: '1px solid hsl(225, 18%, 18%)', borderRadius: 8, color: 'hsl(210, 20%, 92%)' }} />
                      <Line type="monotone" dataKey="actual" stroke="hsl(210, 100%, 56%)" strokeWidth={2} dot={{ fill: 'hsl(210, 100%, 56%)', r: 4 }} name="Actual" />
                      <Line type="monotone" dataKey="target" stroke="hsl(38, 92%, 55%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Target" />
                      <Legend formatter={(value) => <span style={{ color: 'hsl(215, 15%, 55%)', fontSize: 12 }}>{value}</span>} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
          {clientKPIs.filter(kpi => clientEntries.filter(e => e.kpiId === kpi.id).length > 1).length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">Not enough data points for trend analysis yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
