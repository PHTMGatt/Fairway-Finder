// src/components/ToggleSwitch/'ToggleSwitch.tsx'
import React from 'react';
import './ToggleSwitch.css';

//Note; ToggleSwitch component for light/dark mode or feature toggles
interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (newState: boolean) => void;
  label?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label }) => {
  //Note; pass checked state to parent
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="toggle-switch">
      {label && (
        <label htmlFor={id} className="toggle-switch__label">
          {label}
        </label>
      )}
      <input
        type="checkbox"
        id={id}
        className="toggle-switch__checkbox"
        checked={checked}
        onChange={handleToggle}
      />
      <label htmlFor={id} className="toggle-switch__slider" />
    </div>
  );
};

export default ToggleSwitch;
