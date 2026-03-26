import SkillsSection, { Skill }                    from '../ui/SkillsSection';         
import CertificationsSection, { Certification }    from '../ui/CertificationsSection';  

// ─── Types ────────────────────────────────────────────────────────────────────

export type { Skill, Certification };

interface SkillsAndCertsProps {
  initialSkills?: Skill[];
  initialCerts?:  Certification[];
  onSkillsChange?: (skills: Skill[]) => void;
  onCertsChange?:  (certs: Certification[]) => void;
}

// ─── Main: SkillsAndCerts (composer) ─────────────────────────────────────────

export default function SkillsAndCerts({
  initialSkills = [],
  initialCerts  = [],
  onSkillsChange,
  onCertsChange,
}: SkillsAndCertsProps) {
  return (
    <div className="space-y-6">
      {/* Skills — standalone SkillsSection component */}
      <SkillsSection
        initialSkills={initialSkills}
        onChange={onSkillsChange}
      />

      {/* Certifications — standalone CertificationsSection component */}
      <CertificationsSection
        initialCerts={initialCerts}
        onChange={onCertsChange}
      />
    </div>
  );
}