import React, { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const response = await fetch('http://localhost:5000/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to scan the website');
      }

      const data = await response.json();
      setScanResult(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderValue = (value) => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return '';
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Website Scanner</h1>
        <div className="scan-form">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to scan"
          />
          <button onClick={handleScan} disabled={loading}>
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </header>
      <main>
        {error && <p className="error">{error}</p>}
        {scanResult && (
          <div className="scan-result">
            <h2>Scan Result for {url}</h2>
            <div className="screenshot">
              <h3>Screenshot</h3>
              <img src={`data:image/png;base64,${scanResult.screenshot}`} alt="Website screenshot" />
            </div>
            <div className="security-details">
              <h3>Security Details</h3>
              {scanResult.certificate ? (
                <div className="certificate">
                  <h4>Certificate Information</h4>
                  <p><strong>Subject Name:</strong> {scanResult.certificate.subjectName}</p>
                  <p><strong>Issuer:</strong> {scanResult.certificate.issuer}</p>
                  <p><strong>Valid From:</strong> {new Date(scanResult.certificate.validFrom * 1000).toLocaleString()}</p>
                  <p><strong>Valid To:</strong> {new Date(scanResult.certificate.validTo * 1000).toLocaleString()}</p>
                  <p><strong>Protocol:</strong> {scanResult.certificate.protocol}</p>
                </div>
              ) : (
                <p>No certificate information available.</p>
              )}
              <div className="headers">
                <h4>Security Headers</h4>
                <ul>
                  {Object.entries(scanResult.securityHeaders).map(([key, value]) => (
                    <li key={key}><strong>{key}:</strong> {renderValue(value)}</li>
                  ))}
                </ul>
              </div>
              <div className="cookies">
                <h4>Cookies</h4>
                <ul>
                  {scanResult.cookies.map((cookie) => (
                    <li key={cookie.name}>
                      <strong>{cookie.name}:</strong> {renderValue(cookie.value)}
                    </li>
                  ))}
                </ul>
              </div>
              {scanResult.securityAnalysis && (
                <div className="security-analysis">
                  <h4>Security Analysis</h4>
                  <ul>
                    <li><strong>HTTPS:</strong> {scanResult.securityAnalysis.hasHttps ? 'Yes' : 'No'}</li>
                    <li><strong>HSTS:</strong> {scanResult.securityAnalysis.hasHsts ? 'Yes' : 'No'}</li>
                    <li><strong>Content Security Policy:</strong> {scanResult.securityAnalysis.hasCsp ? 'Yes' : 'No'}</li>
                    <li><strong>X-Frame-Options:</strong> {scanResult.securityAnalysis.hasXFrameOptions ? 'Yes' : 'No'}</li>
                    <li><strong>X-Content-Type-Options:</strong> {scanResult.securityAnalysis.hasXContentTypeOptions ? 'Yes' : 'No'}</li>
                    <li><strong>Referrer Policy:</strong> {scanResult.securityAnalysis.hasReferrerPolicy ? 'Yes' : 'No'}</li>
                    <li><strong>Total Requests:</strong> {scanResult.securityAnalysis.totalRequests}</li>
                    {scanResult.securityAnalysis.mixedContent.length > 0 && (
                      <li><strong>Mixed Content:</strong> {scanResult.securityAnalysis.mixedContent.length} insecure requests found</li>
                    )}
                  </ul>
                </div>
              )}
              {scanResult.dnsInfo && (
                <div className="dns-info">
                  <h4>DNS Information</h4>
                  {scanResult.dnsInfo.ipv4 && scanResult.dnsInfo.ipv4.length > 0 && (
                    <div>
                      <h5>IPv4 Addresses:</h5>
                      <ul>
                        {scanResult.dnsInfo.ipv4.map((ip, index) => (
                          <li key={index}>{ip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scanResult.dnsInfo.mx && scanResult.dnsInfo.mx.length > 0 && (
                    <div>
                      <h5>MX Records:</h5>
                      <ul>
                        {scanResult.dnsInfo.mx.map((record, index) => (
                          <li key={index}>{record.exchange} (priority: {record.priority})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {scanResult.geoInfo && scanResult.geoInfo.status === 'success' && (
                <div className="geo-info">
                  <h4>Geolocation Information</h4>
                  <ul>
                    <li><strong>Country:</strong> {scanResult.geoInfo.country} ({scanResult.geoInfo.countryCode})</li>
                    <li><strong>Region:</strong> {scanResult.geoInfo.regionName}</li>
                    <li><strong>City:</strong> {scanResult.geoInfo.city}</li>
                    <li><strong>ZIP:</strong> {scanResult.geoInfo.zip}</li>
                    <li><strong>ISP:</strong> {scanResult.geoInfo.isp}</li>
                    <li><strong>Organization:</strong> {scanResult.geoInfo.org}</li>
                    <li><strong>AS:</strong> {scanResult.geoInfo.as}</li>
                  </ul>
                </div>
              )}
              {scanResult.whoisInfo && Object.keys(scanResult.whoisInfo).length > 0 && (
                <div className="whois-info">
                  <h4>WHOIS Information</h4>
                  <pre>{JSON.stringify(scanResult.whoisInfo, null, 2)}</pre>
                </div>
              )}
              {scanResult.redirectChain && scanResult.redirectChain.length > 0 && (
                <div className="redirect-chain">
                  <h4>Redirect Chain</h4>
                  <ul>
                    {scanResult.redirectChain.map((redirect, index) => (
                      <li key={index}>
                        <strong>{redirect.status}:</strong> {redirect.from} → {redirect.to}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {scanResult.httpTransactions && scanResult.httpTransactions.length > 0 && (
                <div className="http-transactions">
                  <h4>HTTP Transactions ({scanResult.httpTransactions.length})</h4>
                  <div className="transactions-list">
                    {scanResult.httpTransactions.slice(0, 10).map((transaction, index) => (
                      <div key={index} className="transaction-item">
                        <div className="transaction-header">
                          <span className="method">{transaction.method}</span>
                          <span className="status" data-status={transaction.status.toString().charAt(0)}>{transaction.status}</span>
                          <span className="url">{transaction.url}</span>
                        </div>
                      </div>
                    ))}
                    {scanResult.httpTransactions.length > 10 && (
                      <p>... and {scanResult.httpTransactions.length - 10} more transactions</p>
                    )}
                  </div>
                </div>
              )}
              {scanResult.domInfo && (
                <div className="dom-analysis">
                  <h4>DOM Analysis</h4>
                  <div className="dom-summary">
                    <p><strong>Title:</strong> {scanResult.domInfo.title}</p>
                    <p><strong>Scripts:</strong> {scanResult.domInfo.totalScripts}</p>
                    <p><strong>Links:</strong> {scanResult.domInfo.totalLinks}</p>
                    <p><strong>Forms:</strong> {scanResult.domInfo.totalForms}</p>
                    <p><strong>Iframes:</strong> {scanResult.domInfo.totalIframes}</p>
                  </div>
                  {scanResult.domInfo.scripts && scanResult.domInfo.scripts.length > 0 && (
                    <div className="scripts-section">
                      <h5>Scripts (first 5)</h5>
                      <ul>
                        {scanResult.domInfo.scripts.slice(0, 5).map((script, index) => (
                          <li key={index}>
                            {script.src || '<inline>'} {script.async && '(async)'} {script.defer && '(defer)'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scanResult.domInfo.forms && scanResult.domInfo.forms.length > 0 && (
                    <div className="forms-section">
                      <h5>Forms</h5>
                      <ul>
                        {scanResult.domInfo.forms.map((form, index) => (
                          <li key={index}>
                            {form.method || 'GET'} → {typeof form.action === 'object' ? JSON.stringify(form.action) : form.action || 'same page'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;