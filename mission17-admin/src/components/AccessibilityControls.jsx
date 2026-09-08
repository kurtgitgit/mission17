import React, { useEffect, useState } from 'react';
import { Accessibility } from 'lucide-react';
import '../styles/Legal.css';

const TEXT_SIZE_KEY = 'brgylink-text-size-v1';
const CONTRAST_KEY = 'brgylink-high-contrast-v1';

const readPreference = (key, expected) => {
  try {
    return window.localStorage.getItem(key) === expected;
  } catch {
    return false;
  }
};

const storePreference = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The controls still work for this visit if browser storage is unavailable.
  }
};

const AccessibilityControls = () => {
  const [largeText, setLargeText] = useState(() => readPreference(TEXT_SIZE_KEY, 'large'));
  const [highContrast, setHighContrast] = useState(() => readPreference(CONTRAST_KEY, 'on'));

  useEffect(() => {
    document.documentElement.classList.toggle('brgylink-large-text', largeText);
    storePreference(TEXT_SIZE_KEY, largeText ? 'large' : 'default');
  }, [largeText]);

  useEffect(() => {
    document.documentElement.classList.toggle('brgylink-high-contrast', highContrast);
    storePreference(CONTRAST_KEY, highContrast ? 'on' : 'off');
  }, [highContrast]);

  return (
    <details className="accessibility-controls">
      <summary><Accessibility size={18} aria-hidden="true" /> Accessibility options</summary>
      <div className="accessibility-controls__panel">
        <label><input type="checkbox" checked={largeText} onChange={(event) => setLargeText(event.target.checked)} /> Larger text</label>
        <label><input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} /> High contrast</label>
      </div>
    </details>
  );
};

export default AccessibilityControls;
