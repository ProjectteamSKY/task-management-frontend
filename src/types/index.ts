export type WorkerStatus = 'active' | 'on_leave' | 'inactive';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type SlotStatus = 'available' | 'allocated' | 'blocked' | 'leave';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Worker {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: WorkerStatus;
  avatar: string;
  dailyCapacityHours: number;
  capabilities: Capability[];
  specializations: string[];
}

export interface Capability {
  name: string;
  proficiency: number; // 1-5
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  startDate: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedWorkers: string[];
  requiredCapabilities: string[];
  dependencies: string[];
  createdAt: string;
  source: 'manual' | 'slack';
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  workerId: string;
  assignedHours: number;
  approvalStatus: ApprovalStatus;
  confidence?: number;
  reasoning?: string[];
}

export interface ScheduleSlot {
  id: string;
  workerId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  taskId?: string;
}

export interface WorkerPerformance {
  workerId: string;
  tasksCompleted: number;
  avgCompletionTime: number;
  onTimeRate: number;
  qualityScore: number;
}
