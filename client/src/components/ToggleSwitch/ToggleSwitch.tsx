// src/components/ToggleSwitch/ToggleSwitch.tsx

import React from 'react';
import './ToggleSwitch.css';

interface ToggleSwitchProps {
  id: string;                    // Note; Unique identifier for the checkbox
  checked: boolean;              // Note; Current on/off state
  onChange: (newState: boolean) => void; // Note; Callback when toggled
  label?: string;                // Note; Optional text label
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label }) => {
  // Note; Internal change handler to pass the new checked state upstream
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="toggle-switch">
      {/* Note; Render optional label */}
      {label && (
        <label htmlFor={id} className="toggle-switch__label">
          {label}
        </label>
      )}

      {/* Note; Hidden checkbox that drives the styled slider */}
      <input
        type="checkbox"
        id={id}
        className="toggle-switch__checkbox"
        checked={checked}
        onChange={handleToggle}
      />

      {/* Note; Visible slider track & knob */}
      <label htmlFor={id} className="toggle-switch__slider" />
    </div>
  );
};

export default ToggleSwitch;
