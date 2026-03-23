import { Worker, Task, TaskAssignment, ScheduleSlot, WorkerPerformance } from '@/types';

export const workers: Worker[] = [
  {
    id: 'w1', name: 'Ahmed Hassan', email: 'ahmed@company.com', role: 'Electrician',
    department: 'Construction', status: 'active', avatar: 'AH', dailyCapacityHours: 8,
    capabilities: [{ name: 'Electrical Wiring', proficiency: 5 }, { name: 'Circuit Design', proficiency: 4 }, { name: 'Safety Inspection', proficiency: 3 }],
    specializations: ['electrical', 'industrial'],
  },
  {
    id: 'w2', name: 'John Carter', email: 'john@company.com', role: 'Backend Engineer',
    department: 'Engineering', status: 'active', avatar: 'JC', dailyCapacityHours: 6,
    capabilities: [{ name: 'Python', proficiency: 5 }, { name: 'API Development', proficiency: 5 }, { name: 'Database Design', proficiency: 4 }],
    specializations: ['backend', 'devops'],
  },
  {
    id: 'w3', name: 'Sara Williams', email: 'sara@company.com', role: 'QA Tester',
    department: 'QA', status: 'active', avatar: 'SW', dailyCapacityHours: 8,
    capabilities: [{ name: 'Software Testing', proficiency: 5 }, { name: 'Automation', proficiency: 4 }, { name: 'Performance Testing', proficiency: 3 }],
    specializations: ['qa', 'automation'],
  },
  {
    id: 'w4', name: 'Maria Lopez', email: 'maria@company.com', role: 'Frontend Engineer',
    department: 'Engineering', status: 'active', avatar: 'ML', dailyCapacityHours: 7,
    capabilities: [{ name: 'React', proficiency: 5 }, { name: 'TypeScript', proficiency: 4 }, { name: 'CSS', proficiency: 5 }],
    specializations: ['frontend', 'design'],
  },
  {
    id: 'w5', name: 'David Kim', email: 'david@company.com', role: 'Technician',
    department: 'Field Service', status: 'active', avatar: 'DK', dailyCapacityHours: 8,
    capabilities: [{ name: 'Equipment Repair', proficiency: 5 }, { name: 'Calibration', proficiency: 4 }, { name: 'Diagnostics', proficiency: 4 }],
    specializations: ['field_service', 'maintenance'],
  },
  {
    id: 'w6', name: 'Lisa Chen', email: 'lisa@company.com', role: 'Project Manager',
    department: 'Management', status: 'active', avatar: 'LC', dailyCapacityHours: 8,
    capabilities: [{ name: 'Project Planning', proficiency: 5 }, { name: 'Stakeholder Mgmt', proficiency: 5 }, { name: 'Risk Assessment', proficiency: 4 }],
    specializations: ['management', 'logistics'],
  },
  {
    id: 'w7', name: 'Omar Farooq', email: 'omar@company.com', role: 'Plumber',
    department: 'Construction', status: 'on_leave', avatar: 'OF', dailyCapacityHours: 8,
    capabilities: [{ name: 'Plumbing', proficiency: 5 }, { name: 'Pipe Fitting', proficiency: 5 }, { name: 'Water Systems', proficiency: 4 }],
    specializations: ['plumbing', 'construction'],
  },
  {
    id: 'w8', name: 'Nina Patel', email: 'nina@company.com', role: 'DevOps Engineer',
    department: 'Engineering', status: 'active', avatar: 'NP', dailyCapacityHours: 7,
    capabilities: [{ name: 'Docker', proficiency: 5 }, { name: 'Kubernetes', proficiency: 4 }, { name: 'CI/CD', proficiency: 5 }],
    specializations: ['devops', 'infrastructure'],
  },
];

export const tasks: Task[] = [
  {
    id: 't1', title: 'Fix login authentication bug', description: 'Users report intermittent login failures on the mobile app. Need to debug OAuth flow.',
    estimatedHours: 6, startDate: '2026-03-10', dueDate: '2026-03-12', priority: 'high',
    status: 'in_progress', assignedWorkers: ['w2'], requiredCapabilities: ['Python', 'API Development'],
    dependencies: [], createdAt: '2026-03-09', source: 'slack',
  },
  {
    id: 't2', title: 'Install wiring in Building B', description: 'Complete electrical wiring for the new wing. Includes panel installation and safety checks.',
    estimatedHours: 16, startDate: '2026-03-10', dueDate: '2026-03-13', priority: 'high',
    status: 'todo', assignedWorkers: ['w1'], requiredCapabilities: ['Electrical Wiring', 'Safety Inspection'],
    dependencies: [], createdAt: '2026-03-08', source: 'slack',
  },
  {
    id: 't3', title: 'Test payment API integration', description: 'Run full regression suite on the new Stripe payment integration including edge cases.',
    estimatedHours: 8, startDate: '2026-03-11', dueDate: '2026-03-13', priority: 'medium',
    status: 'todo', assignedWorkers: ['w3'], requiredCapabilities: ['Software Testing'],
    dependencies: ['t1'], createdAt: '2026-03-09', source: 'manual',
  },
  {
    id: 't4', title: 'Redesign dashboard UI', description: 'Implement the new dashboard mockups with improved data visualization components.',
    estimatedHours: 12, startDate: '2026-03-11', dueDate: '2026-03-14', priority: 'medium',
    status: 'backlog', assignedWorkers: ['w4'], requiredCapabilities: ['React', 'CSS'],
    dependencies: [], createdAt: '2026-03-10', source: 'manual',
  },
  {
    id: 't5', title: 'Inspect Building A safety', description: 'Annual safety inspection of all electrical systems and fire suppression equipment.',
    estimatedHours: 4, startDate: '2026-03-12', dueDate: '2026-03-12', priority: 'critical',
    status: 'todo', assignedWorkers: ['w1', 'w5'], requiredCapabilities: ['Safety Inspection', 'Diagnostics'],
    dependencies: [], createdAt: '2026-03-10', source: 'manual',
  },
  {
    id: 't6', title: 'Deploy microservices update', description: 'Roll out v2.3 of the order processing microservices with zero downtime.',
    estimatedHours: 5, startDate: '2026-03-11', dueDate: '2026-03-11', priority: 'high',
    status: 'review', assignedWorkers: ['w8'], requiredCapabilities: ['Docker', 'Kubernetes'],
    dependencies: [], createdAt: '2026-03-09', source: 'manual',
  },
  {
    id: 't7', title: 'Pour concrete foundation', description: 'Foundation work for the new warehouse expansion. Requires 3 workers for a full day.',
    estimatedHours: 24, startDate: '2026-03-13', dueDate: '2026-03-14', priority: 'high',
    status: 'backlog', assignedWorkers: [], requiredCapabilities: [],
    dependencies: ['t5'], createdAt: '2026-03-10', source: 'slack',
  },
  {
    id: 't8', title: 'Setup CI/CD pipeline', description: 'Configure automated testing and deployment pipeline for the new frontend project.',
    estimatedHours: 10, startDate: '2026-03-12', dueDate: '2026-03-15', priority: 'medium',
    status: 'todo', assignedWorkers: ['w8', 'w2'], requiredCapabilities: ['CI/CD', 'Docker'],
    dependencies: ['t6'], createdAt: '2026-03-10', source: 'manual',
  },
  {
    id: 't9', title: 'Fix plumbing in Sector C', description: 'Repair leaking pipes and replace damaged fittings in the break room area.',
    estimatedHours: 6, startDate: '2026-03-14', dueDate: '2026-03-14', priority: 'medium',
    status: 'backlog', assignedWorkers: [], requiredCapabilities: ['Plumbing', 'Pipe Fitting'],
    dependencies: [], createdAt: '2026-03-11', source: 'slack',
  },
  {
    id: 't10', title: 'Performance test load balancer', description: 'Stress test the new load balancer configuration under simulated peak traffic conditions.',
    estimatedHours: 4, startDate: '2026-03-13', dueDate: '2026-03-13', priority: 'low',
    status: 'done', assignedWorkers: ['w3'], requiredCapabilities: ['Performance Testing'],
    dependencies: [], createdAt: '2026-03-08', source: 'manual',
  },
  {
    id: 't11', title: 'Calibrate sensor array', description: 'Monthly calibration of all IoT sensors in the manufacturing floor.',
    estimatedHours: 3, startDate: '2026-03-11', dueDate: '2026-03-11', priority: 'low',
    status: 'in_progress', assignedWorkers: ['w5'], requiredCapabilities: ['Calibration', 'Diagnostics'],
    dependencies: [], createdAt: '2026-03-10', source: 'manual',
  },
  {
    id: 't12', title: 'Stakeholder review meeting', description: 'Prepare and facilitate Q1 review meeting with all project stakeholders.',
    estimatedHours: 3, startDate: '2026-03-12', dueDate: '2026-03-12', priority: 'medium',
    status: 'todo', assignedWorkers: ['w6'], requiredCapabilities: ['Stakeholder Mgmt'],
    dependencies: [], createdAt: '2026-03-11', source: 'manual',
  },
];

export const taskAssignments: TaskAssignment[] = [
  { id: 'a1', taskId: 't1', workerId: 'w2', assignedHours: 6, approvalStatus: 'approved', confidence: 94, reasoning: ['Python expertise', 'Previous API bug fixes', 'Available capacity'] },
  { id: 'a2', taskId: 't2', workerId: 'w1', assignedHours: 16, approvalStatus: 'approved', confidence: 92, reasoning: ['Electrical capability match', 'Previous similar tasks', 'Available capacity'] },
  { id: 'a3', taskId: 't3', workerId: 'w3', assignedHours: 8, approvalStatus: 'pending', confidence: 88, reasoning: ['QA specialization', 'Payment testing experience', 'Within capacity'] },
  { id: 'a4', taskId: 't4', workerId: 'w4', assignedHours: 12, approvalStatus: 'pending', confidence: 96, reasoning: ['React expert', 'Design background', 'UI/UX experience'] },
  { id: 'a5', taskId: 't5', workerId: 'w1', assignedHours: 2, approvalStatus: 'approved', confidence: 90, reasoning: ['Safety certification', 'Building familiarity'] },
  { id: 'a6', taskId: 't5', workerId: 'w5', assignedHours: 2, approvalStatus: 'approved', confidence: 85, reasoning: ['Diagnostics skill', 'Equipment expertise'] },
  { id: 'a7', taskId: 't6', workerId: 'w8', assignedHours: 5, approvalStatus: 'approved', confidence: 97, reasoning: ['DevOps lead', 'Kubernetes expert', 'Previous deployment success'] },
  { id: 'a8', taskId: 't8', workerId: 'w8', assignedHours: 6, approvalStatus: 'pending', confidence: 91, reasoning: ['CI/CD expertise', 'Docker mastery'] },
  { id: 'a9', taskId: 't8', workerId: 'w2', assignedHours: 4, approvalStatus: 'pending', confidence: 78, reasoning: ['Backend integration', 'Testing support'] },
  { id: 'a10', taskId: 't11', workerId: 'w5', assignedHours: 3, approvalStatus: 'approved', confidence: 95, reasoning: ['Calibration specialist', 'Sensor experience'] },
  { id: 'a11', taskId: 't12', workerId: 'w6', assignedHours: 3, approvalStatus: 'approved', confidence: 99, reasoning: ['Project lead', 'Stakeholder relations'] },
];

const generateSlots = (): ScheduleSlot[] => {
  const slots: ScheduleSlot[] = [];
  const dates = ['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14'];
  const hours = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  const workerAllocations: Record<string, Record<string, { start: number; end: number; taskId: string }[]>> = {
    w1: {
      '2026-03-10': [{ start: 0, end: 4, taskId: 't2' }],
      '2026-03-11': [{ start: 0, end: 4, taskId: 't2' }],
      '2026-03-12': [{ start: 0, end: 2, taskId: 't5' }],
    },
    w2: {
      '2026-03-10': [{ start: 0, end: 3, taskId: 't1' }],
      '2026-03-11': [{ start: 0, end: 3, taskId: 't1' }],
    },
    w3: {
      '2026-03-11': [{ start: 2, end: 6, taskId: 't3' }],
      '2026-03-12': [{ start: 0, end: 4, taskId: 't3' }],
    },
    w4: {
      '2026-03-11': [{ start: 0, end: 4, taskId: 't4' }],
      '2026-03-12': [{ start: 0, end: 4, taskId: 't4' }],
      '2026-03-13': [{ start: 0, end: 4, taskId: 't4' }],
    },
    w5: {
      '2026-03-11': [{ start: 0, end: 3, taskId: 't11' }],
      '2026-03-12': [{ start: 2, end: 4, taskId: 't5' }],
    },
    w6: {
      '2026-03-12': [{ start: 0, end: 3, taskId: 't12' }],
    },
    w7: {},
    w8: {
      '2026-03-10': [{ start: 0, end: 5, taskId: 't6' }],
      '2026-03-12': [{ start: 0, end: 4, taskId: 't8' }],
      '2026-03-13': [{ start: 0, end: 2, taskId: 't8' }],
    },
  };

  let id = 0;
  for (const wId of Object.keys(workerAllocations)) {
    for (const date of dates) {
      for (let i = 0; i < hours.length; i++) {
        const allocs = workerAllocations[wId]?.[date] || [];
        const alloc = allocs.find(a => i >= a.start && i < a.end);
        const isLeave = wId === 'w7';
        slots.push({
          id: `s${id++}`,
          workerId: wId,
          date,
          startTime: hours[i],
          endTime: hours[Math.min(i + 1, hours.length - 1)] || '18:00',
          status: isLeave ? 'leave' : alloc ? 'allocated' : 'available',
          taskId: alloc?.taskId,
        });
      }
    }
  }
  return slots;
};

export const scheduleSlots: ScheduleSlot[] = generateSlots();

export const workerPerformance: WorkerPerformance[] = [
  { workerId: 'w1', tasksCompleted: 47, avgCompletionTime: 7.2, onTimeRate: 0.91, qualityScore: 4.5 },
  { workerId: 'w2', tasksCompleted: 63, avgCompletionTime: 5.8, onTimeRate: 0.95, qualityScore: 4.7 },
  { workerId: 'w3', tasksCompleted: 55, avgCompletionTime: 6.4, onTimeRate: 0.88, qualityScore: 4.3 },
  { workerId: 'w4', tasksCompleted: 38, avgCompletionTime: 9.1, onTimeRate: 0.84, qualityScore: 4.6 },
  { workerId: 'w5', tasksCompleted: 72, avgCompletionTime: 4.2, onTimeRate: 0.93, qualityScore: 4.4 },
  { workerId: 'w6', tasksCompleted: 29, avgCompletionTime: 3.5, onTimeRate: 0.97, qualityScore: 4.8 },
  { workerId: 'w7', tasksCompleted: 41, avgCompletionTime: 6.8, onTimeRate: 0.86, qualityScore: 4.1 },
  { workerId: 'w8', tasksCompleted: 58, avgCompletionTime: 5.1, onTimeRate: 0.94, qualityScore: 4.6 },
];

export const getWorkerWorkload = (workerId: string, date: string): number => {
  const workerSlots = scheduleSlots.filter(s => s.workerId === workerId && s.date === date);
  const allocated = workerSlots.filter(s => s.status === 'allocated').length;
  const worker = workers.find(w => w.id === workerId);
  if (!worker) return 0;
  return Math.round((allocated / worker.dailyCapacityHours) * 100);
};

export const getOverallWorkload = (workerId: string): number => {
  const dates = ['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14'];
  const loads = dates.map(d => getWorkerWorkload(workerId, d));
  return Math.round(loads.reduce((a, b) => a + b, 0) / loads.length);
};
