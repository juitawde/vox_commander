import React from 'react';
import { Grid3X3, Mic } from 'lucide-react';

const COMMANDS = [
  { phrase: 'INSERT LINE' },
  { phrase: 'ERASE WORD'},
  { phrase: 'TITLE [TEXT]' },
  { phrase: 'CLEAR TITLE' },
  { phrase: 'TOGGLE THEME' },
  { phrase: 'INSERT DATE' },
  { phrase: 'INSERT TIME' },
  { phrase: 'CLEAR NOTE' }
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
            <span key={i} className="keyword-tag">{cmd.phrase} </span> // The color classes (e.g. text-cyan) can be used to style the tags differently based on command type or category, but for simplicity they are not applied here. You can easily add them back by including `className={`keyword-tag ${cmd.color}`}` if you want color differentiation.
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
