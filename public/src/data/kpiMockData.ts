import { Client, KPIDefinition, KPIEntry, KPIReport } from '@/types/kpi';

export const clients: Client[] = [
  { id: 'c1', name: 'Apex Manufacturing', industry: 'Manufacturing', contactPerson: 'Robert Chen', contactEmail: 'robert@apex.com', onboardedDate: '2025-11-01', status: 'active', logo: 'AM' },
  { id: 'c2', name: 'TechNova Solutions', industry: 'Technology', contactPerson: 'Emily Park', contactEmail: 'emily@technova.io', onboardedDate: '2025-12-15', status: 'active', logo: 'TN' },
  { id: 'c3', name: 'BuildRight Corp', industry: 'Construction', contactPerson: 'James Miller', contactEmail: 'james@buildright.com', onboardedDate: '2026-01-10', status: 'active', logo: 'BR' },
  { id: 'c4', name: 'GreenField Energy', industry: 'Energy', contactPerson: 'Priya Sharma', contactEmail: 'priya@greenfield.co', onboardedDate: '2026-02-20', status: 'onboarding', logo: 'GF' },
];

export const kpiDefinitions: KPIDefinition[] = [
  // Apex Manufacturing KPIs
  { id: 'kpi1', clientId: 'c1', name: 'Task Completion Rate', description: 'Percentage of tasks completed on or before deadline', type: 'objective', measurement: 'percentage', target: 95, unit: '%', frequency: 'weekly', weight: 25, category: 'Productivity', createdBy: 'Sales Team', createdAt: '2025-11-05', isActive: true },
  { id: 'kpi2', clientId: 'c1', name: 'Worker Utilization', description: 'Average utilization rate across all allocated workers', type: 'objective', measurement: 'percentage', target: 85, unit: '%', frequency: 'weekly', weight: 20, category: 'Efficiency', createdBy: 'Sales Team', createdAt: '2025-11-05', isActive: true },
  { id: 'kpi3', clientId: 'c1', name: 'Quality Score', description: 'Average quality rating from task reviews and inspections', type: 'subjective', measurement: 'rating', target: 4.5, unit: '/5', frequency: 'monthly', weight: 20, category: 'Quality', createdBy: 'Sales Team', createdAt: '2025-11-05', isActive: true },
  { id: 'kpi4', clientId: 'c1', name: 'Safety Incidents', description: 'Number of safety incidents reported during task execution', type: 'objective', measurement: 'number', target: 0, unit: 'incidents', frequency: 'monthly', weight: 15, category: 'Safety', createdBy: 'Sales Team', createdAt: '2025-11-05', isActive: true },
  { id: 'kpi5', clientId: 'c1', name: 'Client Satisfaction', description: 'Overall satisfaction rating from client feedback', type: 'subjective', measurement: 'rating', target: 4.5, unit: '/5', frequency: 'monthly', weight: 20, category: 'Satisfaction', createdBy: 'Onboarding Team', createdAt: '2025-11-05', isActive: true },

  // TechNova KPIs
  { id: 'kpi6', clientId: 'c2', name: 'Sprint Velocity', description: 'Story points completed per sprint', type: 'objective', measurement: 'number', target: 42, unit: 'pts', frequency: 'weekly', weight: 25, category: 'Productivity', createdBy: 'Sales Team', createdAt: '2025-12-20', isActive: true },
  { id: 'kpi7', clientId: 'c2', name: 'Bug Resolution Time', description: 'Average time to resolve critical bugs', type: 'objective', measurement: 'number', target: 4, unit: 'hrs', frequency: 'weekly', weight: 20, category: 'Efficiency', createdBy: 'Sales Team', createdAt: '2025-12-20', isActive: true },
  { id: 'kpi8', clientId: 'c2', name: 'Code Quality Rating', description: 'Peer review score on delivered code', type: 'subjective', measurement: 'rating', target: 4.2, unit: '/5', frequency: 'monthly', weight: 20, category: 'Quality', createdBy: 'Sales Team', createdAt: '2025-12-20', isActive: true },
  { id: 'kpi9', clientId: 'c2', name: 'Deployment Success Rate', description: 'Percentage of deployments without rollback', type: 'objective', measurement: 'percentage', target: 98, unit: '%', frequency: 'weekly', weight: 15, category: 'Reliability', createdBy: 'Onboarding Team', createdAt: '2025-12-20', isActive: true },
  { id: 'kpi10', clientId: 'c2', name: 'Team Collaboration', description: 'Manager assessment of cross-team collaboration effectiveness', type: 'subjective', measurement: 'rating', target: 4.0, unit: '/5', frequency: 'monthly', weight: 20, category: 'Collaboration', createdBy: 'Onboarding Team', createdAt: '2025-12-20', isActive: true },

  // BuildRight KPIs
  { id: 'kpi11', clientId: 'c3', name: 'Project Milestone Hit Rate', description: 'Percentage of milestones delivered on schedule', type: 'objective', measurement: 'percentage', target: 90, unit: '%', frequency: 'monthly', weight: 30, category: 'Delivery', createdBy: 'Sales Team', createdAt: '2026-01-15', isActive: true },
  { id: 'kpi12', clientId: 'c3', name: 'Cost Efficiency', description: 'Actual cost vs budget ratio', type: 'objective', measurement: 'percentage', target: 100, unit: '%', frequency: 'monthly', weight: 25, category: 'Financial', createdBy: 'Sales Team', createdAt: '2026-01-15', isActive: true },
  { id: 'kpi13', clientId: 'c3', name: 'Workmanship Quality', description: 'Subjective assessment of construction quality standards', type: 'subjective', measurement: 'rating', target: 4.3, unit: '/5', frequency: 'monthly', weight: 25, category: 'Quality', createdBy: 'Onboarding Team', createdAt: '2026-01-15', isActive: true },
  { id: 'kpi14', clientId: 'c3', name: 'Communication Effectiveness', description: 'Client rating on communication responsiveness and clarity', type: 'subjective', measurement: 'rating', target: 4.5, unit: '/5', frequency: 'monthly', weight: 20, category: 'Communication', createdBy: 'Onboarding Team', createdAt: '2026-01-15', isActive: true },
];

export const kpiEntries: KPIEntry[] = [
  // Apex - Week 10 (Mar 2-8)
  { id: 'e1', kpiId: 'kpi1', clientId: 'c1', period: '2026-W10', actualValue: 92, targetValue: 95, status: 'at_risk', submittedBy: 'Lisa Chen', submittedAt: '2026-03-09', notes: 'Two tasks delayed due to material shortage' },
  { id: 'e2', kpiId: 'kpi2', clientId: 'c1', period: '2026-W10', actualValue: 88, targetValue: 85, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-03-09' },
  { id: 'e3', kpiId: 'kpi3', clientId: 'c1', period: '2026-03', actualValue: 4.6, targetValue: 4.5, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-03-09' },
  { id: 'e4', kpiId: 'kpi4', clientId: 'c1', period: '2026-03', actualValue: 1, targetValue: 0, status: 'behind', submittedBy: 'Lisa Chen', submittedAt: '2026-03-09', notes: 'Minor incident in Building B — no injuries' },
  { id: 'e5', kpiId: 'kpi5', clientId: 'c1', period: '2026-03', actualValue: 4.3, targetValue: 4.5, status: 'at_risk', submittedBy: 'Lisa Chen', submittedAt: '2026-03-09' },

  // Apex - Week 9 (Feb 23 - Mar 1)
  { id: 'e6', kpiId: 'kpi1', clientId: 'c1', period: '2026-W09', actualValue: 96, targetValue: 95, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-03-02' },
  { id: 'e7', kpiId: 'kpi2', clientId: 'c1', period: '2026-W09', actualValue: 82, targetValue: 85, status: 'at_risk', submittedBy: 'Lisa Chen', submittedAt: '2026-03-02' },

  // Apex - Week 8
  { id: 'e8', kpiId: 'kpi1', clientId: 'c1', period: '2026-W08', actualValue: 97, targetValue: 95, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-02-23' },
  { id: 'e9', kpiId: 'kpi2', clientId: 'c1', period: '2026-W08', actualValue: 86, targetValue: 85, status: 'on_track', submittedBy: 'Lisa Chen', submittedAt: '2026-02-23' },

  // TechNova - Week 10
  { id: 'e10', kpiId: 'kpi6', clientId: 'c2', period: '2026-W10', actualValue: 45, targetValue: 42, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-03-09' },
  { id: 'e11', kpiId: 'kpi7', clientId: 'c2', period: '2026-W10', actualValue: 3.2, targetValue: 4, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-03-09' },
  { id: 'e12', kpiId: 'kpi8', clientId: 'c2', period: '2026-03', actualValue: 4.4, targetValue: 4.2, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-03-09' },
  { id: 'e13', kpiId: 'kpi9', clientId: 'c2', period: '2026-W10', actualValue: 100, targetValue: 98, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-03-09' },
  { id: 'e14', kpiId: 'kpi10', clientId: 'c2', period: '2026-03', actualValue: 3.8, targetValue: 4.0, status: 'at_risk', submittedBy: 'Lisa Chen', submittedAt: '2026-03-09' },

  // TechNova - Week 9
  { id: 'e15', kpiId: 'kpi6', clientId: 'c2', period: '2026-W09', actualValue: 38, targetValue: 42, status: 'behind', submittedBy: 'Lisa Chen', submittedAt: '2026-03-02' },
  { id: 'e16', kpiId: 'kpi7', clientId: 'c2', period: '2026-W09', actualValue: 5.1, targetValue: 4, status: 'behind', submittedBy: 'Lisa Chen', submittedAt: '2026-03-02' },
  { id: 'e17', kpiId: 'kpi9', clientId: 'c2', period: '2026-W09', actualValue: 95, targetValue: 98, status: 'at_risk', submittedBy: 'Lisa Chen', submittedAt: '2026-03-02' },

  // BuildRight - Feb
  { id: 'e18', kpiId: 'kpi11', clientId: 'c3', period: '2026-02', actualValue: 87, targetValue: 90, status: 'at_risk', submittedBy: 'Lisa Chen', submittedAt: '2026-03-05' },
  { id: 'e19', kpiId: 'kpi12', clientId: 'c3', period: '2026-02', actualValue: 104, targetValue: 100, status: 'behind', submittedBy: 'Lisa Chen', submittedAt: '2026-03-05', notes: '4% over budget due to material cost increase' },
  { id: 'e20', kpiId: 'kpi13', clientId: 'c3', period: '2026-02', actualValue: 4.5, targetValue: 4.3, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-03-05' },
  { id: 'e21', kpiId: 'kpi14', clientId: 'c3', period: '2026-02', actualValue: 4.7, targetValue: 4.5, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-03-05' },

  // BuildRight - Jan
  { id: 'e22', kpiId: 'kpi11', clientId: 'c3', period: '2026-01', actualValue: 93, targetValue: 90, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-02-05' },
  { id: 'e23', kpiId: 'kpi12', clientId: 'c3', period: '2026-01', actualValue: 98, targetValue: 100, status: 'exceeded', submittedBy: 'Lisa Chen', submittedAt: '2026-02-05' },
  { id: 'e24', kpiId: 'kpi13', clientId: 'c3', period: '2026-01', actualValue: 4.1, targetValue: 4.3, status: 'at_risk', submittedBy: 'Lisa Chen', submittedAt: '2026-02-05' },
  { id: 'e25', kpiId: 'kpi14', clientId: 'c3', period: '2026-01', actualValue: 4.4, targetValue: 4.5, status: 'at_risk', submittedBy: 'Lisa Chen', submittedAt: '2026-02-05' },
];

export const kpiReports: KPIReport[] = [
  {
    clientId: 'c1', period: '2026-W10', overallScore: 84, objectiveScore: 86, subjectiveScore: 81,
    kpiBreakdown: [
      { kpiId: 'kpi1', achievement: 96.8, status: 'at_risk' },
      { kpiId: 'kpi2', achievement: 103.5, status: 'exceeded' },
      { kpiId: 'kpi3', achievement: 102.2, status: 'exceeded' },
      { kpiId: 'kpi4', achievement: 0, status: 'behind' },
      { kpiId: 'kpi5', achievement: 95.6, status: 'at_risk' },
    ],
    generatedAt: '2026-03-09',
  },
  {
    clientId: 'c2', period: '2026-W10', overallScore: 91, objectiveScore: 95, subjectiveScore: 84,
    kpiBreakdown: [
      { kpiId: 'kpi6', achievement: 107.1, status: 'exceeded' },
      { kpiId: 'kpi7', achievement: 125, status: 'exceeded' },
      { kpiId: 'kpi8', achievement: 104.8, status: 'exceeded' },
      { kpiId: 'kpi9', achievement: 102, status: 'exceeded' },
      { kpiId: 'kpi10', achievement: 95, status: 'at_risk' },
    ],
    generatedAt: '2026-03-09',
  },
  {
    clientId: 'c3', period: '2026-02', overallScore: 78, objectiveScore: 74, subjectiveScore: 85,
    kpiBreakdown: [
      { kpiId: 'kpi11', achievement: 96.7, status: 'at_risk' },
      { kpiId: 'kpi12', achievement: 96.2, status: 'behind' },
      { kpiId: 'kpi13', achievement: 104.7, status: 'exceeded' },
      { kpiId: 'kpi14', achievement: 104.4, status: 'exceeded' },
    ],
    generatedAt: '2026-03-05',
  },
];

// Helper functions
export const getClientKPIs = (clientId: string) =>
  kpiDefinitions.filter(k => k.clientId === clientId && k.isActive);

export const getKPIEntries = (kpiId: string) =>
  kpiEntries.filter(e => e.kpiId === kpiId);

export const getClientEntries = (clientId: string) =>
  kpiEntries.filter(e => e.clientId === clientId);

export const getClientReport = (clientId: string) =>
  kpiReports.filter(r => r.clientId === clientId);

export const getKPIStatusColor = (status: string) => {
  switch (status) {
    case 'exceeded': return 'text-success';
    case 'on_track': return 'text-primary';
    case 'at_risk': return 'text-warning';
    case 'behind': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
};

export const getKPIStatusBg = (status: string) => {
  switch (status) {
    case 'exceeded': return 'bg-success/10 text-success border-success/20';
    case 'on_track': return 'bg-primary/10 text-primary border-primary/20';
    case 'at_risk': return 'bg-warning/10 text-warning border-warning/20';
    case 'behind': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground';
  }
};
