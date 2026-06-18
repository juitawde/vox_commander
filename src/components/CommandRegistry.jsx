import React from 'react';
import { Grid3X3, Mic } from 'lucide-react';

const COMMANDS = [
  { phrase: 'INSERT LINE', color: 'text-cyan' },
  { phrase: 'ERASE WORD', color: 'text-red' },
  { phrase: 'TITLE [TEXT]', color: 'text-blue' },
  { phrase: 'TOGGLE THEME', color: 'text-green' },
  { phrase: 'INSERT DATE', color: 'text-cyan' },
  { phrase: 'INSERT TIME', color: 'text-cyan' },
  { phrase: 'CLEAR NOTE', color: 'text-red' }
];

export default function CommandRegistry({ isListening, startListening }) {
  return (
    <div className="sidebar-card">
      {/* Header */}
      <div className="sidebar-card-header">
        <div className="header-left">
          <Grid3X3 className="grid-icon" />
          <h3>Reference Matrix</h3>
        </div>
        <span className="version-tag">v1.0.4</span>
      </div>

      {/* Keyword Matrix */}
      <div className="keyword-matrix">
        <h4 className="keyword-matrix-title">Keyword Matrix</h4>
        <div className="keyword-tags">
          {COMMANDS.map((cmd, i) => (
            <span key={i} className="keyword-tag">{cmd.phrase}</span>
          ))}
        </div>
      </div>

      {/* Engine Status */}
      <div className="engine-status">
        <h4 className="engine-status-title">Engine Status</h4>
        <div className="engine-table">
          <div className="engine-row">
            <span className="row-label">Vocab Size</span>
            <span className="row-value">1.2M Tokens</span>
          </div>
          <div className="engine-row">
            <span className="row-label">Language</span>
            <span className="row-value">en-US (Neural)</span>
          </div>
          <div className="engine-row">
            <span className="row-label">Model</span>
            <span className="row-value">WebSpeech v2</span>
          </div>
          <div className="engine-row">
            <span className="row-label">Status</span>
            <span className="row-value" style={{ color: isListening ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {isListening ? '● ACTIVE' : '○ STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Capture Button */}
      <div className="live-capture-section">
        <button
          className="btn-live"
          onClick={startListening}
          title="Toggle live voice capture"
        >
          <Mic className="icon-sm" />
          <span className="pulse-dot"></span>
          <span>Live Capture</span>
        </button>
      </div>
    </div>
  );
}
