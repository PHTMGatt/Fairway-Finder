// client/src/components/ScoreCard/ScoreInput.tsx
// One hole cell on the full card: commits on blur/Enter, reverts on Escape or a bad value.
import React, { useEffect, useState } from 'react';
import { scoreFromDraft } from './scorecardUtils';

interface ScoreInputProps {
  value: number;
  onCommit: (score: number) => boolean | Promise<boolean>;
  ariaLabel?: string;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ value, onCommit, ariaLabel }) => {
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitDraft = async () => {
    const score = scoreFromDraft(draft);
    if (score === null) {
      setDraft(String(value));
      return;
    }
    if (score === value) return;

    setSaving(true);
    try {
      const saved = await onCommit(score);
      if (!saved) setDraft(String(value));
    } finally {
      setSaving(false);
    }
  };

  return (
    <input
      type="number"
      min={0}
      max={30}
      step={1}
      inputMode="numeric"
      className="scorecard__input"
      value={draft}
      aria-label={ariaLabel}
      disabled={saving}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void commitDraft()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === 'Escape') {
          setDraft(String(value));
          event.currentTarget.blur();
        }
      }}
    />
  );
};

export default ScoreInput;
