export type KPIType = 'objective' | 'subjective';
export type KPIMeasurement = 'percentage' | 'number' | 'currency' | 'rating' | 'boolean';
export type KPIFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type KPIStatus = 'on_track' | 'at_risk' | 'behind' | 'exceeded';

export interface Client {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  contactEmail: string;
  onboardedDate: string;
  status: 'active' | 'onboarding' | 'churned';
  logo: string; // initials
}

export interface KPIDefinition {
  id: string;
  clientId: string;
  name: string;
  description: string;
  type: KPIType;
  measurement: KPIMeasurement;
  target: number;
  unit: string;
  frequency: KPIFrequency;
  weight: number; // 0-100, contributes to overall score
  category: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface KPIEntry {
  id: string;
  kpiId: string;
  clientId: string;
  period: string; // e.g. "2026-W10", "2026-03", "2026-Q1"
  actualValue: number;
  targetValue: number;
  status: KPIStatus;
  notes?: string;
  submittedBy: string;
  submittedAt: string;
}

export interface KPIReport {
  clientId: string;
  period: string;
  overallScore: number;
  objectiveScore: number;
  subjectiveScore: number;
  kpiBreakdown: {
    kpiId: string;
    achievement: number; // percentage
    status: KPIStatus;
  }[];
  generatedAt: string;
}
