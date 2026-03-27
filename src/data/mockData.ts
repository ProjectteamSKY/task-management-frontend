import { Worker, Task, TaskAssignment, ScheduleSlot, WorkerPerformance } from '@/types';

// ─── Dynamic current-week dates ───────────────────────────────────────────────

function getCurrentWeekDates(): string[] {
  const today = new Date();
  const day   = today.getDay();                        // 0 = Sun
  const mon   = new Date(today);
  mon.setDate(today.getDate() - ((day + 6) % 7));      // roll back to Monday
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const WEEK = getCurrentWeekDates();
// WEEK[0] = Mon, WEEK[1] = Tue, WEEK[2] = Wed, WEEK[3] = Thu, WEEK[4] = Fri

// ─── Workers ──────────────────────────────────────────────────────────────────

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

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasks: Task[] = [
  {
    id: 't1', title: 'Fix login authentication bug',
    description: 'Users report intermittent login failures on the mobile app. Need to debug OAuth flow.',
    estimatedHours: 6, startDate: WEEK[0], dueDate: WEEK[1], priority: 'high',
    status: 'in_progress', assignedWorkers: ['w2'], requiredCapabilities: ['Python', 'API Development'],
    dependencies: [], createdAt: WEEK[0], source: 'slack',
  },
  {
    id: 't2', title: 'Install wiring in Building B',
    description: 'Complete electrical wiring for the new wing. Includes panel installation and safety checks.',
    estimatedHours: 4, startDate: WEEK[0], dueDate: WEEK[2], priority: 'high',
    status: 'todo', assignedWorkers: ['w1'], requiredCapabilities: ['Electrical Wiring', 'Safety Inspection'],
    dependencies: [], createdAt: WEEK[0], source: 'slack',
  },
  {
    id: 't3', title: 'Test payment API integration',
    description: 'Run full regression suite on the new Stripe payment integration including edge cases.',
    estimatedHours: 3, startDate: WEEK[1], dueDate: WEEK[2], priority: 'medium',
    status: 'todo', assignedWorkers: ['w3'], requiredCapabilities: ['Software Testing'],
    dependencies: ['t1'], createdAt: WEEK[0], source: 'manual',
  },
  {
    id: 't4', title: 'Redesign dashboard UI',
    description: 'Implement the new dashboard mockups with improved data visualization components.',
    estimatedHours: 4, startDate: WEEK[1], dueDate: WEEK[3], priority: 'medium',
    status: 'backlog', assignedWorkers: ['w4'], requiredCapabilities: ['React', 'CSS'],
    dependencies: [], createdAt: WEEK[1], source: 'manual',
  },
  {
    id: 't5', title: 'Inspect Building A safety',
    description: 'Annual safety inspection of all electrical systems and fire suppression equipment.',
    estimatedHours: 2, startDate: WEEK[1], dueDate: WEEK[1], priority: 'critical',
    status: 'todo', assignedWorkers: ['w1', 'w5'], requiredCapabilities: ['Safety Inspection', 'Diagnostics'],
    dependencies: [], createdAt: WEEK[1], source: 'manual',
  },
  {
    id: 't6', title: 'Deploy microservices update',
    description: 'Roll out v2.3 of the order processing microservices with zero downtime.',
    estimatedHours: 2.5, startDate: WEEK[1], dueDate: WEEK[1], priority: 'high',
    status: 'review', assignedWorkers: ['w8'], requiredCapabilities: ['Docker', 'Kubernetes'],
    dependencies: [], createdAt: WEEK[0], source: 'manual',
  },
  {
    id: 't7', title: 'Pour concrete foundation',
    description: 'Foundation work for the new warehouse expansion.',
    estimatedHours: 4, startDate: WEEK[2], dueDate: WEEK[3], priority: 'high',
    status: 'backlog', assignedWorkers: [], requiredCapabilities: [],
    dependencies: ['t5'], createdAt: WEEK[1], source: 'slack',
  },
  {
    id: 't8', title: 'Setup CI/CD pipeline',
    description: 'Configure automated testing and deployment pipeline for the new frontend project.',
    estimatedHours: 3, startDate: WEEK[2], dueDate: WEEK[4], priority: 'medium',
    status: 'todo', assignedWorkers: ['w8', 'w2'], requiredCapabilities: ['CI/CD', 'Docker'],
    dependencies: ['t6'], createdAt: WEEK[1], source: 'manual',
  },
  {
    id: 't9', title: 'Fix plumbing in Sector C',
    description: 'Repair leaking pipes and replace damaged fittings in the break room area.',
    estimatedHours: 2, startDate: WEEK[3], dueDate: WEEK[3], priority: 'medium',
    status: 'backlog', assignedWorkers: [], requiredCapabilities: ['Plumbing', 'Pipe Fitting'],
    dependencies: [], createdAt: WEEK[2], source: 'slack',
  },
  {
    id: 't10', title: 'Performance test load balancer',
    description: 'Stress test the new load balancer configuration under simulated peak traffic.',
    estimatedHours: 1.5, startDate: WEEK[2], dueDate: WEEK[2], priority: 'low',
    status: 'done', assignedWorkers: ['w3'], requiredCapabilities: ['Performance Testing'],
    dependencies: [], createdAt: WEEK[0], source: 'manual',
  },
  {
    id: 't11', title: 'Calibrate sensor array',
    description: 'Monthly calibration of all IoT sensors in the manufacturing floor.',
    estimatedHours: 1.5, startDate: WEEK[1], dueDate: WEEK[1], priority: 'low',
    status: 'in_progress', assignedWorkers: ['w5'], requiredCapabilities: ['Calibration', 'Diagnostics'],
    dependencies: [], createdAt: WEEK[1], source: 'manual',
  },
  {
    id: 't12', title: 'Stakeholder review meeting',
    description: 'Prepare and facilitate Q1 review meeting with all project stakeholders.',
    estimatedHours: 1.5, startDate: WEEK[1], dueDate: WEEK[1], priority: 'medium',
    status: 'todo', assignedWorkers: ['w6'], requiredCapabilities: ['Stakeholder Mgmt'],
    dependencies: [], createdAt: WEEK[2], source: 'manual',
  },
  {
    id: 't13', title: 'Circuit breaker panel upgrade',
    description: 'Replace outdated circuit breaker panels in the east wing with modern units.',
    estimatedHours: 3, startDate: WEEK[1], dueDate: WEEK[2], priority: 'high',
    status: 'todo', assignedWorkers: ['w1'], requiredCapabilities: ['Electrical Wiring', 'Circuit Design'],
    dependencies: [], createdAt: WEEK[0], source: 'manual',
  },
];

// ─── Task Assignments ─────────────────────────────────────────────────────────

export const taskAssignments: TaskAssignment[] = [
  { id: 'a1',  taskId: 't1',  workerId: 'w2', assignedHours: 6,   approvalStatus: 'approved', confidence: 94, reasoning: ['Python expertise', 'Previous API bug fixes', 'Available capacity'] },
  { id: 'a2',  taskId: 't2',  workerId: 'w1', assignedHours: 4,   approvalStatus: 'approved', confidence: 92, reasoning: ['Electrical capability match', 'Previous similar tasks', 'Available capacity'] },
  { id: 'a3',  taskId: 't3',  workerId: 'w3', assignedHours: 3,   approvalStatus: 'pending',  confidence: 88, reasoning: ['QA specialization', 'Payment testing experience', 'Within capacity'] },
  { id: 'a4',  taskId: 't4',  workerId: 'w4', assignedHours: 4,   approvalStatus: 'pending',  confidence: 96, reasoning: ['React expert', 'Design background', 'UI/UX experience'] },
  { id: 'a5',  taskId: 't5',  workerId: 'w1', assignedHours: 2,   approvalStatus: 'approved', confidence: 90, reasoning: ['Safety certification', 'Building familiarity'] },
  { id: 'a6',  taskId: 't5',  workerId: 'w5', assignedHours: 2,   approvalStatus: 'approved', confidence: 85, reasoning: ['Diagnostics skill', 'Equipment expertise'] },
  { id: 'a7',  taskId: 't6',  workerId: 'w8', assignedHours: 2.5, approvalStatus: 'approved', confidence: 97, reasoning: ['DevOps lead', 'Kubernetes expert', 'Previous deployment success'] },
  { id: 'a8',  taskId: 't8',  workerId: 'w8', assignedHours: 3,   approvalStatus: 'pending',  confidence: 91, reasoning: ['CI/CD expertise', 'Docker mastery'] },
  { id: 'a9',  taskId: 't8',  workerId: 'w2', assignedHours: 2,   approvalStatus: 'pending',  confidence: 78, reasoning: ['Backend integration', 'Testing support'] },
  { id: 'a10', taskId: 't11', workerId: 'w5', assignedHours: 1.5, approvalStatus: 'approved', confidence: 95, reasoning: ['Calibration specialist', 'Sensor experience'] },
  { id: 'a11', taskId: 't12', workerId: 'w6', assignedHours: 1.5, approvalStatus: 'approved', confidence: 99, reasoning: ['Project lead', 'Stakeholder relations'] },
  { id: 'a12', taskId: 't13', workerId: 'w1', assignedHours: 3,   approvalStatus: 'approved', confidence: 93, reasoning: ['Circuit design expert', 'Panel upgrade experience'] },
];

// ─── Schedule Slots (dynamic, 30-min granularity) ────────────────────────────
//
// Each entry defines a task block for a worker on a given day.
// startTime / endTime are HH:MM strings (30-min aligned).
//
// Worker → Day → [{ startTime, endTime, taskId, status }]

type SlotDef = { startTime: string; endTime: string; taskId?: string; status: ScheduleSlot['status'] };

const SLOT_DEFS: Record<string, Record<number, SlotDef[]>> = {
  // Ahmed Hassan (w1) — Electrician
  w1: {
    0: [ // Mon
      { startTime: '09:00', endTime: '13:00', taskId: 't2',  status: 'allocated' },  // Wiring 4 h
      { startTime: '14:00', endTime: '17:00', taskId: 't13', status: 'allocated' },  // Panel upgrade 3 h
    ],
    1: [ // Tue
      { startTime: '09:00', endTime: '11:00', taskId: 't5',  status: 'allocated' },  // Safety inspect 2 h
      { startTime: '11:30', endTime: '14:30', taskId: 't13', status: 'allocated' },  // Panel upgrade cont. 3 h
    ],
    2: [ // Wed
      { startTime: '09:00', endTime: '13:00', taskId: 't2',  status: 'allocated' },  // Wiring cont.
    ],
    3: [], // Thu — free
    4: [], // Fri — free
  },

  // John Carter (w2) — Backend Engineer
  w2: {
    0: [
      { startTime: '09:00', endTime: '12:00', taskId: 't1', status: 'allocated' }, // Auth bug 3 h
    ],
    1: [
      { startTime: '09:30', endTime: '12:30', taskId: 't1', status: 'allocated' }, // Auth bug cont. 3 h
      { startTime: '13:30', endTime: '15:30', taskId: 't8', status: 'allocated' }, // CI/CD 2 h
    ],
    2: [
      { startTime: '10:00', endTime: '11:30', taskId: 't8', status: 'allocated' }, // CI/CD cont. 1.5 h
    ],
    3: [],
    4: [],
  },

  // Sara Williams (w3) — QA Tester
  w3: {
    0: [],
    1: [
      { startTime: '10:00', endTime: '13:00', taskId: 't3',  status: 'allocated' }, // Payment test 3 h
    ],
    2: [
      { startTime: '09:00', endTime: '10:30', taskId: 't10', status: 'allocated' }, // Load balancer 1.5 h
      { startTime: '11:00', endTime: '14:00', taskId: 't3',  status: 'allocated' }, // Payment test cont.
    ],
    3: [],
    4: [],
  },

  // Maria Lopez (w4) — Frontend Engineer
  w4: {
    0: [],
    1: [
      { startTime: '09:00', endTime: '13:00', taskId: 't4', status: 'allocated' }, // Dashboard UI 4 h
    ],
    2: [
      { startTime: '09:00', endTime: '13:00', taskId: 't4', status: 'allocated' }, // Dashboard UI cont.
    ],
    3: [
      { startTime: '09:00', endTime: '13:00', taskId: 't4', status: 'allocated' }, // Dashboard UI cont.
    ],
    4: [],
  },

  // David Kim (w5) — Technician
  w5: {
    0: [],
    1: [
      { startTime: '09:00', endTime: '10:30', taskId: 't11', status: 'allocated' }, // Calibrate sensors 1.5 h
      { startTime: '11:00', endTime: '13:00', taskId: 't5',  status: 'allocated' }, // Safety inspect 2 h
    ],
    2: [],
    3: [],
    4: [],
  },

  // Lisa Chen (w6) — Project Manager
  w6: {
    0: [],
    1: [
      { startTime: '10:00', endTime: '11:30', taskId: 't12', status: 'allocated' }, // Stakeholder meeting 1.5 h
    ],
    2: [],
    3: [],
    4: [],
  },

  // Omar Farooq (w7) — on leave all week
  w7: {
    0: [{ startTime: '09:00', endTime: '17:00', status: 'leave' }],
    1: [{ startTime: '09:00', endTime: '17:00', status: 'leave' }],
    2: [{ startTime: '09:00', endTime: '17:00', status: 'leave' }],
    3: [{ startTime: '09:00', endTime: '17:00', status: 'leave' }],
    4: [{ startTime: '09:00', endTime: '17:00', status: 'leave' }],
  },

  // Nina Patel (w8) — DevOps Engineer
  w8: {
    0: [
      { startTime: '09:00', endTime: '11:30', taskId: 't6', status: 'allocated' }, // Deploy microservices 2.5 h
    ],
    1: [
      { startTime: '09:00', endTime: '11:30', taskId: 't6', status: 'allocated' }, // Deploy cont.
    ],
    2: [
      { startTime: '09:00', endTime: '12:00', taskId: 't8', status: 'allocated' }, // CI/CD 3 h
    ],
    3: [
      { startTime: '09:00', endTime: '11:00', taskId: 't8', status: 'allocated' }, // CI/CD cont. 2 h
    ],
    4: [],
  },
};

function generateSlots(): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  let id = 0;

  for (const [workerId, dayMap] of Object.entries(SLOT_DEFS)) {
    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      const date     = WEEK[dayIndex];
      const daySlots = dayMap[dayIndex] ?? [];
      for (const def of daySlots) {
        slots.push({
          id:        `s${id++}`,
          workerId,
          date,
          startTime: def.startTime,
          endTime:   def.endTime,
          status:    def.status,
          taskId:    def.taskId,
        });
      }
    }
  }

  return slots;
}

export const scheduleSlots: ScheduleSlot[] = generateSlots();

// ─── Worker Performance ───────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getWorkerWorkload = (workerId: string, date: string): number => {
  const worker     = workers.find(w => w.id === workerId);
  if (!worker) return 0;
  const daySlots   = scheduleSlots.filter(s => s.workerId === workerId && s.date === date && s.status === 'allocated');
  const totalMins  = daySlots.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    return sum + ((eh * 60 + em) - (sh * 60 + sm));
  }, 0);
  return Math.round((totalMins / 60 / worker.dailyCapacityHours) * 100);
};

export const getOverallWorkload = (workerId: string): number => {
  const loads = WEEK.map(d => getWorkerWorkload(workerId, d));
  return Math.round(loads.reduce((a, b) => a + b, 0) / loads.length);
};


// ─── Worker Notes ─────────────────────────────────────────────────────────────
 
export const workerNotes = [
  {
    id: 'n1', workerId: 'w1',
    content:   'Ahmed completed the east wing wiring ahead of schedule. Great attention to safety protocols throughout.',
    author:    'Lisa Chen',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'n2', workerId: 'w1',
    content:   'Passed annual electrical safety certification with top marks. Recommended for senior technician role.',
    author:    'Manager Admin',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'n3', workerId: 'w2',
    content:   'John resolved the authentication bug faster than estimated. Code quality review was excellent.',
    author:    'Lisa Chen',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'n4', workerId: 'w2',
    content:   'Needs to improve documentation practices. Code works well but comments are sparse.',
    author:    'Manager Admin',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 'n5', workerId: 'w3',
    content:   'Sara found 3 critical bugs in the payment API that would have caused production issues. Excellent work.',
    author:    'Lisa Chen',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n6', workerId: 'w4',
    content:   'Dashboard redesign looks fantastic. Stakeholders are very happy with the new layout.',
    author:    'Manager Admin',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'n7', workerId: 'w8',
    content:   'Nina deployed v2.3 with zero downtime as promised. Rollback plan was well prepared.',
    author:    'Lisa Chen',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

// ─── Emergency Contacts ───────────────────────────────────────────────────────
 
export const emergencyContacts = [
  { workerId: 'w1', fullName: 'Sarah Hassan',   relationship: 'Spouse',  phone: '+1 555 101 2020', email: 'sarah.hassan@email.com',  address: '12 Elm Street, Dubai, UAE' },
  { workerId: 'w2', fullName: 'Robert Carter',  relationship: 'Parent',  phone: '+1 555 202 3030', email: 'robert.carter@email.com',  address: '45 Oak Avenue, New York, USA' },
  { workerId: 'w3', fullName: 'James Williams', relationship: 'Sibling', phone: '+1 555 303 4040', email: 'james.williams@email.com', address: '78 Pine Road, London, UK' },
  { workerId: 'w4', fullName: 'Carlos Lopez',   relationship: 'Spouse',  phone: '+1 555 404 5050', email: 'carlos.lopez@email.com',   address: '22 Maple Drive, Madrid, Spain' },
  { workerId: 'w5', fullName: 'Jenny Kim',      relationship: 'Spouse',  phone: '+1 555 505 6060', email: 'jenny.kim@email.com',      address: '9 Cherry Lane, Seoul, South Korea' },
  { workerId: 'w6', fullName: 'Wei Chen',       relationship: 'Parent',  phone: '+1 555 606 7070', email: 'wei.chen@email.com',       address: '33 Lotus Blvd, Shanghai, China' },
  { workerId: 'w8', fullName: 'Raj Patel',      relationship: 'Sibling', phone: '+1 555 808 9090', email: 'raj.patel@email.com',      address: '17 Banyan Street, Mumbai, India' },
];
 
// ─── Equipment & Tools ────────────────────────────────────────────────────────
 
export const workerEquipment = [
  { id: 'eq1', workerId: 'w1', name: 'Power Drill',        equipmentId: 'EQ-2024-001', category: 'Tool',        assignedDate: '2024-01-15', returnDate: '',           condition: 'Good' as const },
  { id: 'eq2', workerId: 'w1', name: 'Safety Helmet',      equipmentId: 'EQ-2024-002', category: 'Safety Gear', assignedDate: '2024-01-15', returnDate: '',           condition: 'Good' as const },
  { id: 'eq3', workerId: 'w1', name: 'Voltage Tester',     equipmentId: 'EQ-2024-003', category: 'Tool',        assignedDate: '2024-03-01', returnDate: '2026-04-30', condition: 'Fair' as const },
  { id: 'eq4', workerId: 'w2', name: 'MacBook Pro 16"',    equipmentId: 'EQ-2024-010', category: 'Device',      assignedDate: '2023-06-01', returnDate: '',           condition: 'Good' as const },
  { id: 'eq5', workerId: 'w2', name: 'External Monitor',   equipmentId: 'EQ-2024-011', category: 'Device',      assignedDate: '2023-06-01', returnDate: '',           condition: 'Good' as const },
  { id: 'eq6', workerId: 'w3', name: 'Testing Laptop',     equipmentId: 'EQ-2024-020', category: 'Device',      assignedDate: '2023-09-01', returnDate: '',           condition: 'Fair' as const },
  { id: 'eq7', workerId: 'w4', name: 'iMac 27"',           equipmentId: 'EQ-2024-030', category: 'Device',      assignedDate: '2023-04-15', returnDate: '',           condition: 'Good' as const },
  { id: 'eq8', workerId: 'w5', name: 'Service Van',        equipmentId: 'EQ-2024-040', category: 'Vehicle',     assignedDate: '2024-02-01', returnDate: '2026-06-30', condition: 'Good' as const },
  { id: 'eq9', workerId: 'w5', name: 'Calibration Kit',    equipmentId: 'EQ-2024-041', category: 'Tool',        assignedDate: '2024-02-01', returnDate: '',           condition: 'Poor' as const },
  { id: 'eq10', workerId: 'w8', name: 'Server Access Card', equipmentId: 'EQ-2024-050', category: 'Device',     assignedDate: '2023-11-01', returnDate: '',           condition: 'Good' as const },
];

// ─── Training Sessions ────────────────────────────────────────────────────────
 
export const workerTrainingSessions = [
  { id: 'tr1', workerId: 'w1', title: 'Advanced Electrical Safety', provider: 'OSHA Training Institute', category: 'Safety', status: 'completed' as const, startDate: '2026-01-10', endDate: '2026-01-12', progress: 100, notes: 'Passed with distinction.' },
  { id: 'tr2', workerId: 'w1', title: 'Circuit Design Masterclass',  provider: 'IET Online',              category: 'Technical', status: 'in_progress' as const, startDate: '2026-03-01', endDate: '2026-04-30', progress: 45, notes: '' },
  { id: 'tr3', workerId: 'w1', title: 'High Voltage Systems',        provider: 'NFPA Academy',            category: 'Technical', status: 'upcoming' as const,    startDate: '2026-05-01', endDate: '2026-05-03', progress: 0,  notes: 'Scheduled pending approval.' },
  { id: 'tr4', workerId: 'w2', title: 'Python Advanced Patterns',    provider: 'Pluralsight',             category: 'Technical', status: 'completed' as const,    startDate: '2025-11-01', endDate: '2025-11-30', progress: 100, notes: '' },
  { id: 'tr5', workerId: 'w2', title: 'System Design Fundamentals',  provider: 'ByteByteGo',              category: 'Technical', status: 'in_progress' as const,  startDate: '2026-02-15', endDate: '2026-04-15', progress: 70, notes: '' },
  { id: 'tr6', workerId: 'w3', title: 'Selenium WebDriver Pro',      provider: 'Test Automation Univ.',  category: 'Technical', status: 'completed' as const,    startDate: '2025-12-01', endDate: '2025-12-15', progress: 100, notes: 'Excellent scores in practicals.' },
  { id: 'tr7', workerId: 'w3', title: 'Performance Testing with k6', provider: 'Grafana Labs',            category: 'Technical', status: 'upcoming' as const,     startDate: '2026-04-10', endDate: '2026-04-11', progress: 0,  notes: '' },
  { id: 'tr8', workerId: 'w8', title: 'CKA — Certified Kubernetes',  provider: 'Linux Foundation',       category: 'Technical', status: 'in_progress' as const,  startDate: '2026-02-01', endDate: '2026-05-01', progress: 60, notes: 'Exam booked for May.' },
];
 
// ─── Skill Goals ──────────────────────────────────────────────────────────────
 
export const workerSkillGoals = [
  { id: 'sg1', workerId: 'w1', goal: 'Achieve proficiency level 5 in Circuit Design',      progress: 60,  dueDate: '2026-06-30' },
  { id: 'sg2', workerId: 'w1', goal: 'Complete NFPA High Voltage certification',            progress: 0,   dueDate: '2026-07-31' },
  { id: 'sg3', workerId: 'w2', goal: 'Master distributed systems design patterns',          progress: 70,  dueDate: '2026-05-01' },
  { id: 'sg4', workerId: 'w2', goal: 'Contribute to 3 open-source Python projects',         progress: 100, dueDate: '2026-03-31' },
  { id: 'sg5', workerId: 'w3', goal: 'Build a full test automation framework from scratch', progress: 40,  dueDate: '2026-06-01' },
  { id: 'sg6', workerId: 'w8', goal: 'Pass CKA exam on first attempt',                     progress: 60,  dueDate: '2026-05-15' },
  { id: 'sg7', workerId: 'w8', goal: 'Reduce deployment pipeline time by 30%',             progress: 80,  dueDate: '2026-04-30' },
];
 
// ─── Shift Schedules ──────────────────────────────────────────────────────────
 
export const workerShiftSchedules = [
  { workerId: 'w1', shiftType: 'Morning'  as const, workingDays: ['Mon','Tue','Wed','Thu','Fri'] as const, startTime: '07:00', endTime: '15:00', breakDuration: 30 },
  { workerId: 'w2', shiftType: 'Morning'  as const, workingDays: ['Mon','Tue','Wed','Thu','Fri'] as const, startTime: '09:00', endTime: '17:00', breakDuration: 60 },
  { workerId: 'w3', shiftType: 'Morning'  as const, workingDays: ['Mon','Tue','Wed','Thu','Fri'] as const, startTime: '09:00', endTime: '17:00', breakDuration: 30 },
  { workerId: 'w4', shiftType: 'Morning'  as const, workingDays: ['Mon','Tue','Wed','Thu','Fri'] as const, startTime: '10:00', endTime: '18:00', breakDuration: 60 },
  { workerId: 'w5', shiftType: 'Morning'  as const, workingDays: ['Mon','Tue','Wed','Thu','Fri','Sat'] as const, startTime: '08:00', endTime: '16:00', breakDuration: 30 },
  { workerId: 'w6', shiftType: 'Morning'  as const, workingDays: ['Mon','Tue','Wed','Thu','Fri'] as const, startTime: '09:00', endTime: '17:00', breakDuration: 60 },
  { workerId: 'w7', shiftType: 'Rotating' as const, workingDays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const, startTime: '08:00', endTime: '20:00', breakDuration: 60 },
  { workerId: 'w8', shiftType: 'Evening'  as const, workingDays: ['Mon','Tue','Wed','Thu','Fri'] as const, startTime: '12:00', endTime: '20:00', breakDuration: 30 },
];