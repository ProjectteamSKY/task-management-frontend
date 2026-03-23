import { useState } from 'react';
import { clients, kpiDefinitions, getClientKPIs, getKPIStatusBg } from '@/data/kpiMockData';
import { KPIDefinition, KPIType, KPIMeasurement, KPIFrequency } from '@/types/kpi';
import { SearchIcon, PlusIcon, CheckIcon, CloseIcon, FilterIcon } from '@/components/icons/Icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

const KPIIcon = ({ className, size = 20 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
  </svg>
);

const ObjectiveIcon = ({ className, size = 20 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

const SubjectiveIcon = ({ className, size = 20 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function KPISetup() {
  const [selectedClient, setSelectedClient] = useState(clients[0].id);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | KPIType>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPIDefinition | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<KPIType>('objective');
  const [formMeasurement, setFormMeasurement] = useState<KPIMeasurement>('percentage');
  const [formTarget, setFormTarget] = useState('');
  const [formUnit, setFormUnit] = useState('%');
  const [formFrequency, setFormFrequency] = useState<KPIFrequency>('weekly');
  const [formWeight, setFormWeight] = useState([20]);
  const [formCategory, setFormCategory] = useState('');

  const client = clients.find(c => c.id === selectedClient)!;
  const clientKPIs = getClientKPIs(selectedClient);
  const totalWeight = clientKPIs.reduce((sum, k) => sum + k.weight, 0);

  const filteredKPIs = clientKPIs.filter(k => {
    const matchSearch = k.name.toLowerCase().includes(search.toLowerCase()) || k.category.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || k.type === typeFilter;
    return matchSearch && matchType;
  });

  const objectiveKPIs = filteredKPIs.filter(k => k.type === 'objective');
  const subjectiveKPIs = filteredKPIs.filter(k => k.type === 'subjective');

  const openCreate = () => {
    setEditingKPI(null);
    setFormName(''); setFormDesc(''); setFormType('objective');
    setFormMeasurement('percentage'); setFormTarget(''); setFormUnit('%');
    setFormFrequency('weekly'); setFormWeight([20]); setFormCategory('');
    setDialogOpen(true);
  };

  const openEdit = (kpi: KPIDefinition) => {
    setEditingKPI(kpi);
    setFormName(kpi.name); setFormDesc(kpi.description); setFormType(kpi.type);
    setFormMeasurement(kpi.measurement); setFormTarget(String(kpi.target)); setFormUnit(kpi.unit);
    setFormFrequency(kpi.frequency); setFormWeight([kpi.weight]); setFormCategory(kpi.category);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KPI Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure objective & subjective KPIs for each client</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <PlusIcon size={16} /> New KPI
        </button>
      </div>

      {/* Client Selector */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {clients.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClient(c.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all shrink-0 ${
              selectedClient === c.id
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5'
                : 'border-border bg-card hover:border-muted-foreground/30'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
              selectedClient === c.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
              {c.logo}
            </div>
            <div className="text-left">
              <p className={`text-sm font-medium ${selectedClient === c.id ? 'text-foreground' : 'text-muted-foreground'}`}>{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.industry}</p>
            </div>
            {c.status === 'onboarding' && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px]">Onboarding</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total KPIs</p>
          <p className="text-2xl font-bold text-foreground mt-1">{clientKPIs.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2">
            <ObjectiveIcon size={14} className="text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Objective</p>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{clientKPIs.filter(k => k.type === 'objective').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2">
            <SubjectiveIcon size={14} className="text-accent" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Subjective</p>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{clientKPIs.filter(k => k.type === 'subjective').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Weight Total</p>
          <p className={`text-2xl font-bold mt-1 ${totalWeight === 100 ? 'text-success' : totalWeight > 100 ? 'text-destructive' : 'text-warning'}`}>
            {totalWeight}%
          </p>
          <Progress value={Math.min(totalWeight, 100)} className="mt-2 h-1.5" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search KPIs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['all', 'objective', 'subjective'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                typeFilter === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'all' ? 'All' : t === 'objective' ? 'Objective' : 'Subjective'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Tables */}
      <div className="space-y-6">
        {(typeFilter === 'all' || typeFilter === 'objective') && objectiveKPIs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ObjectiveIcon size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Objective KPIs</h3>
              <span className="text-xs text-muted-foreground">— Measurable, data-driven metrics</span>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">KPI Name</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Target</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Frequency</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Weight</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {objectiveKPIs.map(kpi => (
                    <tr key={kpi.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{kpi.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{kpi.description}</p>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{kpi.category}</Badge></td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{kpi.target}{kpi.unit}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{kpi.frequency}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{kpi.weight}%</span>
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${kpi.weight}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(kpi)} className="text-xs text-primary hover:underline">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(typeFilter === 'all' || typeFilter === 'subjective') && subjectiveKPIs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SubjectiveIcon size={16} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Subjective KPIs</h3>
              <span className="text-xs text-muted-foreground">— Qualitative assessments & ratings</span>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">KPI Name</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Target</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Frequency</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Weight</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectiveKPIs.map(kpi => (
                    <tr key={kpi.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{kpi.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{kpi.description}</p>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] border-accent/30 text-accent">{kpi.category}</Badge></td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{kpi.target}{kpi.unit}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{kpi.frequency}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{kpi.weight}%</span>
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${kpi.weight}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(kpi)} className="text-xs text-primary hover:underline">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredKPIs.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <KPIIcon size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No KPIs found. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingKPI ? 'Edit KPI' : 'Create New KPI'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">KPI Name</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Task Completion Rate" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="What does this KPI measure?" className="bg-background border-border resize-none h-20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={formType} onValueChange={(v: KPIType) => setFormType(v)}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="objective">Objective</SelectItem>
                    <SelectItem value="subjective">Subjective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Measurement</Label>
                <Select value={formMeasurement} onValueChange={(v: KPIMeasurement) => setFormMeasurement(v)}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="boolean">Yes/No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Target</Label>
                <Input type="number" value={formTarget} onChange={e => setFormTarget(e.target.value)} placeholder="95" className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Unit</Label>
                <Input value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="%" className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Frequency</Label>
                <Select value={formFrequency} onValueChange={(v: KPIFrequency) => setFormFrequency(v)}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="e.g. Productivity" className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Weight: {formWeight[0]}%</Label>
                <Slider value={formWeight} onValueChange={setFormWeight} max={50} min={5} step={5} className="mt-3" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              {editingKPI ? 'Save Changes' : 'Create KPI'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
