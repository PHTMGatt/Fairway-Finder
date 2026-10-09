import React, { KeyboardEvent, useEffect, useState } from 'react';
import './LocationAutocomplete.css';

interface LocationSuggestion {
  label: string;
  value: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  inputClassName,
  disabled = false,
  ariaLabel,
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2 || disabled) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/locations/suggest?q=${encodeURIComponent(query)}`
        );
        if (!response.ok) return;

        const data: LocationSuggestion[] = await response.json();
        if (cancelled) return;

        const compactSuggestions = data.slice(0, 4);
        setSuggestions(compactSuggestions);
        setOpen(compactSuggestions.length > 0);
        setActiveIndex(-1);
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setOpen(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [value, disabled]);

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    onChange(suggestion.value);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1
      );
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className={`location-autocomplete${open ? ' is-open' : ''}`}>
      <input
        className={inputClassName}
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        aria-label={ariaLabel || placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />

      {open && suggestions.length > 0 && (
        <div className="location-autocomplete__menu" role="listbox">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${index}`}
              type="button"
              className={`location-autocomplete__option${
                index === activeIndex ? ' active' : ''
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
              role="option"
              aria-selected={index === activeIndex}
            >
              <span className="location-autocomplete__pin" aria-hidden="true">📍</span>
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
