import { useState, useCallback }                   from 'react';
import SkillsSection, { Skill }                    from '../ui/SkillsSection';
import CertificationsSection, { Certification }    from '../ui/CertificationsSection';
import { capabilityService }                       from '@/services/workerService';

export type { Skill, Certification };

type SyncState = 'idle' | 'saving' | 'error';

interface SkillsAndCertsProps {
  workerId:        number;
  initialSkills?:  Skill[];
  initialCerts?:   Certification[];
  onSkillsChange?: (skills: Skill[]) => void;
  onCertsChange?:  (certs: Certification[]) => void;
}

export default function SkillsAndCerts({
  workerId,
  initialSkills = [],
  initialCerts  = [],
  onSkillsChange,
  onCertsChange,
}: SkillsAndCertsProps) {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSkillsChange = useCallback(
    async (skills: Skill[]) => {
      onSkillsChange?.(skills);
      setSyncState('saving');
      setSyncError(null);
      try {
        await capabilityService.replaceAll(
          workerId,
          skills.map(s => ({ capability: s.name, proficiency: s.proficiency })), // ✅ s.name → capability
        );
        setSyncState('idle');
      } catch (err: any) {
        setSyncState('error');
        setSyncError(err.message ?? 'Failed to save skills');
      }
    },
    [workerId, onSkillsChange],
  );

  return (
    <div className="space-y-6">
      {syncState === 'saving' && (
        <p className="text-[11px] text-muted-foreground animate-pulse">Saving skills…</p>
      )}
      {syncState === 'error' && (
        <p className="text-[11px] text-destructive">{syncError}</p>
      )}

      <SkillsSection
        initialSkills={initialSkills}
        onChange={handleSkillsChange}
      />

      <CertificationsSection
        initialCerts={initialCerts}
        onChange={onCertsChange}
      />
    </div>
  );
}