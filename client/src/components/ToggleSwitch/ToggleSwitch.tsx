import React from 'react';
import './ToggleSwitch.css';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (newState: boolean) => void;
  label?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label }) => (
  <div className="toggle-switch">
    {label && <label htmlFor={id} className="toggle-switch__label">{label}</label>}
    <input
      type="checkbox"
      id={id}
      className="toggle-switch__checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
    />
    <label htmlFor={id} className="toggle-switch__slider" />
  </div>
);

export default ToggleSwitch;
