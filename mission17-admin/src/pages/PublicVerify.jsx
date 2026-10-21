import React, { useState } from 'react';
import { Search, ShieldCheck, FileSearch, XCircle, ArrowLeft } from 'lucide-react';
import { endpoints } from '../config/api';
import '../styles/PublicVerify.css';

const PublicVerify = () => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (event) => {
    event.preventDefault();
    const reference = referenceNumber.trim();
    if (!reference) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        `${endpoints.auth.backendBaseUrl}/api/blotter-reports/public/${encodeURIComponent(reference)}`,
      );

      if (!response.ok) {
        throw new Error('Report not found. Check the reference number and try again.');
      }

      setResult(await response.json());
    } catch (requestError) {
      setError(requestError.message || 'Unable to verify this report right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isResolved = result?.status === 'Resolved';

  return (
    <main className="public-verify-page">
      <div className="public-verify-shell">
        <a className="public-verify-back" href="https://mission17-app.vercel.app/">
          <ArrowLeft size={18} aria-hidden="true" /> Back to official website
        </a>
        <header className="public-verify-header">
          <div className="public-verify-icon" aria-hidden="true">
            <ShieldCheck size={42} strokeWidth={2.1} />
          </div>
          <p className="public-verify-eyebrow">BRGYLINK · PUBLIC RECORD CHECK</p>
          <h1>Public Transparency Portal</h1>
          <p className="public-verify-intro">
            Check the official status of a Barangay Bagong Pag-asa blotter report. If enabled,
            a confirmed resolution-ledger entry can also be viewed on Ethereum Sepolia.
          </p>
        </header>

        <form className="public-verify-search" onSubmit={handleSearch}>
          <label className="public-verify-field" htmlFor="blotter-reference">
            <Search size={20} aria-hidden="true" />
            <input
              id="blotter-reference"
              type="text"
              autoComplete="off"
              placeholder="Enter a blotter reference number"
              value={referenceNumber}
              onChange={(event) => setReferenceNumber(event.target.value)}
              aria-describedby="reference-help"
              required
            />
          </label>
          <p className="public-verify-help" id="reference-help">
            Use the reference number provided for the report.
          </p>
          <button className="public-verify-submit" type="submit" disabled={loading || !referenceNumber.trim()}>
            {loading ? 'Searching…' : 'Verify report'}
          </button>
        </form>

        {error && (
          <div className="public-verify-error" role="alert">
            <XCircle size={21} aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {result && (
          <section className="public-verify-result" aria-live="polite" aria-label="Verification result">
            <div className="public-verify-result-heading">
              <div className="public-verify-case-title">
                <p className="public-verify-eyebrow">VERIFIED BARANGAY RECORD</p>
                <h2>{result.referenceNumber}</h2>
                <p>{result.incidentType}</p>
              </div>
              <span className={`public-verify-status${isResolved ? ' is-resolved' : ''}`}>
                {result.status}
              </span>
            </div>

            <div className="public-verify-date">
              <span>Date of incident</span>
              <strong>
                {new Date(result.dateOfIncident).toLocaleDateString('en-PH', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </strong>
            </div>

            <div className="public-verify-ledger">
              <h3><FileSearch size={18} aria-hidden="true" /> Resolution ledger</h3>

              {result.blockchainRecordStatus === 'Recorded' && result.blockchainTxHash && result.blockchainRecordHash ? (
                <>
                  <p className="public-verify-ledger-success">Resolution integrity record found on Ethereum Sepolia.</p>
                  <p className="public-verify-ledger-note">
                    The ledger entry contains a cryptographic digest only—not resident details,
                    incident narratives, locations, or evidence.
                  </p>
                  <div className="public-verify-transaction">
                    <code>{result.blockchainTxHash}</code>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${encodeURIComponent(result.blockchainTxHash)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Sepolia
                    </a>
                  </div>
                  <p className="public-verify-digest">
                    <span>Integrity digest</span>
                    <code>{result.blockchainRecordHash}</code>
                  </p>
                </>
              ) : result.blockchainRecordStatus === 'Failed' ? (
                <p className="public-verify-ledger-note">
                  This case is resolved, but its ledger entry could not be created. Contact Barangay Hall for verification.
                </p>
              ) : result.blockchainRecordStatus === 'Not Configured' ? (
                <p className="public-verify-ledger-note">
                  The resolution ledger is not configured. The case status shown above remains the official Barangay record.
                </p>
              ) : (
                <p className="public-verify-ledger-note">
                  A resolution-ledger entry is created only after an official case resolution.
                </p>
              )}
            </div>
          </section>
        )}

        <footer className="public-verify-footer">
          This page displays limited verification details. Contact the barangay office for official assistance.
        </footer>
      </div>
    </main>
  );
};

export default PublicVerify;
