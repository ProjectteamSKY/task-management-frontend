import { XIcon } from '@/components/icons/Icons';
import { Input } from '@/components/ui/input';

export interface Capability {
  name: string;
  proficiency: number;
}

interface SkillsInputProps {
  /** Current list of capabilities */
  capabilities: Capability[];
  /** Called whenever the list changes */
  onChange: (capabilities: Capability[]) => void;
}

export default function SkillsInput({ capabilities, onChange }: SkillsInputProps) {
  function addCapability() {
    onChange([...capabilities, { name: '', proficiency: 3 }]);
  }

  function removeCapability(index: number) {
    onChange(capabilities.filter((_, i) => i !== index));
  }

  function updateCapability(index: number, field: keyof Capability, value: string | number) {
    onChange(
      capabilities.map((cap, i) =>
        i === index ? { ...cap, [field]: value } : cap
      )
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Capabilities
        </p>
        <button
          type="button"
          onClick={addCapability}
          className="text-[11px] text-primary hover:text-primary/80 transition-colors font-medium"
        >
          + Add skill
        </button>
      </div>

      {/* Skill rows */}
      <div className="space-y-2">
        {capabilities.map((cap, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* Skill name */}
            <Input
              placeholder="e.g. Electrical Wiring"
              value={cap.name}
              onChange={e => updateCapability(i, 'name', e.target.value)}
              className="flex-1"
            />

            {/* Proficiency dots (1–5) */}
            <div className="flex items-center gap-1 shrink-0">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateCapability(i, 'proficiency', level)}
                  className={`w-5 h-5 rounded-full border transition-colors ${
                    level <= cap.proficiency
                      ? 'bg-primary border-primary'
                      : 'bg-transparent border-border hover:border-primary/50'
                  }`}
                  aria-label={`Set proficiency to ${level}`}
                />
              ))}
            </div>

            {/* Remove row (hidden when only one row remains) */}
            {capabilities.length > 1 && (
              <button
                type="button"
                onClick={() => removeCapability(i)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                aria-label="Remove skill"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-2">
        Filled circles = proficiency level (1–5)
      </p>
    </div>
  );
}