import React, { useState } from 'react';
import { Search, ShieldCheck, FileSearch, XCircle } from 'lucide-react';
import { endpoints } from '../config/api';
import '../styles/DashboardHome.css'; // Reuse some basic styles

const PublicVerify = () => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!referenceNumber.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${endpoints.auth.backendBaseUrl}/api/blotter-reports/public/${referenceNumber.trim()}`);
      
      if (!res.ok) {
        throw new Error('Report not found or invalid reference number.');
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <ShieldCheck size={64} color="#0038A8" />
        </div>
        <h1 style={{ color: '#0f172a', fontSize: '28px', marginBottom: '8px' }}>Public Transparency Portal</h1>
        <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
          Verify the authenticity and resolution status of Barangay Pantal Blotter Reports. 
          Resolved cases are immutably recorded on the Ethereum Blockchain.
        </p>
      </div>

      {/* SEARCH BOX */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '600px', marginBottom: '30px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <div className="search-box" style={{ flex: 1, margin: 0, border: '2px solid #e2e8f0', borderRadius: '8px' }}>
            <Search size={20} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Enter Reference Number (e.g. BLOTTER-...)"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              style={{ width: '100%', padding: '12px 10px', fontSize: '16px' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn primary"
            disabled={loading || !referenceNumber.trim()}
            style={{ width: 'auto', padding: '0 24px', fontSize: '16px' }}
          >
            {loading ? 'Searching...' : 'Verify'}
          </button>
        </form>
      </div>

      {/* RESULTS AREA */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', color: '#dc2626', maxWidth: '600px', width: '100%' }}>
          <XCircle size={24} />
          <p style={{ margin: 0, fontWeight: '500' }}>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>Case: {result.referenceNumber}</h2>
              <span style={{ fontSize: '14px', color: '#64748b' }}>{result.incidentType}</span>
            </div>
            <div style={{
              background: result.status === 'Resolved' ? '#dcfce7' : '#f1f5f9',
              color: result.status === 'Resolved' ? '#16a34a' : '#475569',
              padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase'
            }}>
              {result.status}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>Date of Incident</p>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
              {new Date(result.dateOfIncident).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSearch size={16} /> Blockchain Verification
            </h3>
            
            {result.blockchainTxHash && result.blockchainTxHash.startsWith('0x') ? (
              <div>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                  ✓ Immutable record found on Ethereum Sepolia Testnet
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={result.blockchainTxHash} 
                    style={{ flex: 1, padding: '8px 12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}
                  />
                  <button 
                    onClick={() => window.open(`https://sepolia.etherscan.io/tx/${result.blockchainTxHash}`, '_blank')}
                    style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    View Ledger
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                No blockchain record exists for this case yet. Cases are only recorded upon official resolution.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicVerify;
