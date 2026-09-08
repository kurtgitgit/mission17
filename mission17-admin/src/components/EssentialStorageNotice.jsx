import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Legal.css';

export const ESSENTIAL_STORAGE_NOTICE_VERSION = '2026-09-08-capstone-v1';
const ACKNOWLEDGMENT_KEY = 'brgylink-essential-storage-notice';

const hasAcknowledged = () => {
  try {
    return window.localStorage.getItem(ACKNOWLEDGMENT_KEY) === ESSENTIAL_STORAGE_NOTICE_VERSION;
  } catch {
    return false;
  }
};

const EssentialStorageNotice = () => {
  const [visible, setVisible] = useState(() => !hasAcknowledged());
  if (!visible) return null;

  const acknowledge = () => {
    try {
      window.localStorage.setItem(ACKNOWLEDGMENT_KEY, ESSENTIAL_STORAGE_NOTICE_VERSION);
    } catch {
      // Acknowledge for this visit even when persistent storage is blocked.
    }
    setVisible(false);
  };

  return (
    <section className="essential-storage-notice" role="region" aria-label="Essential browser storage notice">
      <div>
        <strong>Essential browser storage only</strong>
        <p>BrgyLink uses essential browser storage for secure Firebase sign-in and to remember this notice choice. It does not use advertising or analytics cookies in this prototype.</p>
        <Link to="/browser-storage">Read the Browser Storage Notice</Link>
      </div>
      <button type="button" onClick={acknowledge}>I understand</button>
    </section>
  );
};

export default EssentialStorageNotice;
