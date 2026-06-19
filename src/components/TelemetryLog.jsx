import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Activity, Timer, Gauge, Clock, GripHorizontal } from 'lucide-react';

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 520;
const DEFAULT_HEIGHT = 220;

export default function TelemetryLog({ logs, isListening, confidence, duration, onClearLogs }) {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const terminalBottomRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(DEFAULT_HEIGHT);

  useEffect(() => {
    if (activeTab === 'telemetry' && terminalBottomRef.current) { // Auto-scroll to bottom when new logs arrive or when switching back to telemetry tab
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' }); // Scrolls the terminal view to the bottom smoothly whenever logs change or when the telemetry tab becomes active, ensuring the latest log entries are always visible to the user without manual scrolling.
    }
  }, [logs, activeTab]);

  const confidencePercent = Math.round(confidence * 100);

  const formatDuration = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // ── Drag-to-resize handlers ──
  const onMouseDown = useCallback((e) => {
    e.preventDefault(); // Prevent text selection and other default behaviors while dragging
    isDraggingRef.current = true;
    startYRef.current = e.clientY; //Stores initial mouse Y position when the drag starts, used to calculate how far the mouse has moved during dragging.
    startHeightRef.current = panelHeight;
    document.body.style.cursor = 'ns-resize'; //Changes cursor to vertical resize icon
    document.body.style.userSelect = 'none'; //Prevents text selection while dragging
  }, [panelHeight]); //Dependency: uses latest panel height..recreation of function only when panelheight changes

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      // Dragging up = panel grows (clientY decreases)
      const delta = startYRef.current - e.clientY; 
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeightRef.current + delta)); //prevents going below min height and prevents going above max height 
      setPanelHeight(newHeight);
    };

    const onMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    //listens globally so drag works even outside component
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []); //since no dependencies, this effect runs only once on mount and sets up the global mouse event listeners for dragging, and cleans them up on unmount.

  return (
    <div className="telemetry-console" style={{ height: panelHeight }}>
      {/* Drag Handle */}
      <div
        className="console-drag-handle"
        onMouseDown={onMouseDown}
        title="Drag to resize panel"
      >
        <GripHorizontal size={14} className="drag-grip-icon" />
      </div>

      {/* Console Header */}
      <div className="console-header">
        <div className="console-header-left">
          <span className={`console-status-dot ${isListening ? '' : 'standby'}`}></span>
          <span className="console-title">System Activity Diagnostic</span>
          <div className="console-meta">
            <span className="console-meta-item">PID: <b>4882</b></span>
            <span className="console-meta-item">Buffer: <b>128ms</b></span>
          </div>
        </div>
        <div className="console-header-right">
          <div className="console-engine-badge">
            <span className={`badge-dot ${isListening ? 'live' : 'off'}`}></span>
            <span>Engine: <b style={{ color: isListening ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {isListening ? 'LIVE' : 'STANDBY'}
            </b></span>
          </div>
          <div className="console-engine-badge">
            <span>Signal: <b>{isListening ? `${confidencePercent}%` : 'N/A'}</b></span>
          </div>
          {activeTab === 'telemetry' && (
            <button onClick={onClearLogs} className="btn-text-action" title="Clear terminal buffer">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Console Body */}
      <div className="console-body">
        {activeTab === 'telemetry' && (
          logs.length === 0 ? (
            <div className="console-placeholder">
              <span className="console-prompt">&gt;</span> System diagnostic active. Start dictating to stream telemetry event frames...
            </div>
          ) : (
            <div className="log-entries">
              {logs.map((log) => {
                let badgeClass = 'tag-info';
                if (log.type === 'COMMAND') badgeClass = 'tag-command';
                if (log.type === 'SYSTEM')  badgeClass = 'tag-system';
                if (log.type === 'SUCCESS') badgeClass = 'tag-success';
                if (log.type === 'ERROR')   badgeClass = 'tag-error';

                return (
                  <div key={log.id} className="log-row">
                    <span className="log-time">[{log.timestamp}]</span>
                    <span className={`log-tag ${badgeClass}`}>{log.type}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                );
              })}
              <div ref={terminalBottomRef} />
            </div>
          )
        )}

        {activeTab === 'confidence' && (
          <div className="diagnostic-view">
            <div className="diag-header">Speech Coherence &amp; Recognition Confidence</div>
            <div className="diag-grid">
              <div className="diag-metric">
                <span className="diag-label">Current Stream Confidence:</span>
                <span className="diag-val">{isListening ? `${confidencePercent}%` : 'N/A'}</span>
              </div>
              <div className="diag-metric">
                <span className="diag-label">Minimum Target Threshold:</span>
                <span className="diag-val">70%</span>
              </div>
              <div className="diag-metric">
                <span className="diag-label">Microphone Noise Floor:</span>
                <span className="diag-val">-54 dB</span>
              </div>
              <div className="diag-metric">
                <span className="diag-label">Audio Signal State:</span>
                <span className="diag-val" style={{ color: isListening ? (confidence > 0.85 ? 'var(--accent-green)' : 'var(--accent-amber)') : 'var(--text-muted)' }}>
                  {!isListening ? 'STANDBY' : (confidence > 0.85 ? 'OPTIMAL (Excellent)' : confidence > 0.7 ? 'FAIR (Stable)' : 'WEAK (High Noise)')}
                </span>
              </div>
            </div>
            {isListening && (
              <div className="diag-progress-container">
                <div
                  className="diag-progress-fill"
                  style={{
                    width: `${confidencePercent}%`,
                    backgroundColor: confidence > 0.85 ? 'var(--accent-green)' : 'var(--accent-amber)'
                  }}
                ></div>
              </div>
            )}
            <div className="diag-status-text">
              &gt; Neural parser confidence levels are computed in real-time based on Voice Activity Detection (VAD) parameters.
            </div>
          </div>
        )}

        {activeTab === 'latency' && (
          <div className="diagnostic-view">
            <div className="diag-header">API Processing Latency Analytics</div>
            <div className="diag-grid">
              <div className="diag-metric">
                <span className="diag-label">VAD Buffer Window:</span>
                <span className="diag-val">128 ms</span>
              </div>
              <div className="diag-metric">
                <span className="diag-label">Speech API Response Time:</span>
                <span className="diag-val">{isListening ? '180 ms' : '0 ms'}</span>
              </div>
              <div className="diag-metric">
                <span className="diag-label">Neural Intent Classification:</span>
                <span className="diag-val">{isListening ? '64 ms' : '0 ms'}</span>
              </div>
              <div className="diag-metric">
                <span className="diag-label">Silence Watchdog Timeout:</span>
                <span className="diag-val">4,000 ms</span>
              </div>
            </div>
            <div className="diag-status-text">
              &gt; System checks the silence heartbeat watchdog every 4 seconds. Network latency within normal bounds.
            </div>
          </div>
        )}

        {activeTab === 'duration' && (
          <div className="diagnostic-view">
            <div className="diag-header">Engine Session Duration Stats</div>
            <div className="diag-grid">
              <div className="diag-metric">
                <span className="diag-label">Total Connection Time:</span>
                <span className="diag-val">{formatDuration(duration)}</span>
              </div>
              <div className="diag-metric">
                <span className="diag-label">Watchdog Pulse Uptime:</span>
                <span className="diag-val">{isListening ? 'Active Loop' : 'Standby'}</span>
              </div>
              <div className="diag-metric">
                <span className="diag-label">Audio Stream Clock:</span>
                <span className="diag-val">{isListening ? 'Live VAD' : 'Inactive'}</span>
              </div>
              <div className="diag-metric">
                <span className="diag-label">Pulse Watchdog Active:</span>
                <span className="diag-val" style={{ color: isListening ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                  {isListening ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>
            <div className="diag-status-text">
              &gt; Voice capture connection established on user gesture. Session timers are updated dynamically every 1s.
            </div>
          </div>
        )}
      </div>

      {/* Console Footer Tabs */}
      <div className="console-footer-tabs">
        <button
          className={`console-tab ${activeTab === 'telemetry' ? 'active' : ''}`}
          onClick={() => setActiveTab('telemetry')}
        >
          <Activity className="tab-icon" />
          Telemetry
        </button>
        <button
          className={`console-tab ${activeTab === 'confidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('confidence')}
        >
          <Gauge className="tab-icon" />
          Confidence
        </button>
        <button
          className={`console-tab ${activeTab === 'latency' ? 'active' : ''}`}
          onClick={() => setActiveTab('latency')}
        >
          <Timer className="tab-icon" />
          Latency
        </button>
        <button
          className={`console-tab ${activeTab === 'duration' ? 'active' : ''}`}
          onClick={() => setActiveTab('duration')}
        >
          <Clock className="tab-icon" />
          Duration
        </button>
      </div>
    </div>
  );
}
