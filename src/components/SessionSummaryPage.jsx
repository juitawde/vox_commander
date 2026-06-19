import React from 'react';
import { Download, FileText, Award, Clock, Type, Terminal, BarChart2, AlertTriangle } from 'lucide-react';

export default function SessionSummaryPage({ stats, onExportPDF, onDownloadLogs, onBack }) {
  const formatDuration = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`; //padStart(2, '0')? Ensures formatting always has 2 digits: 5 → 05, 2 → 02
  };

  const getFormattedTimestamp = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    //YYYY-MM-DD HH:MM:SS, Example: 2026-06-20 01:45:30
  };

  const confidence = stats.confidence || 0.94; // Default to 94% if confidence is not provided
  const confidencePercent = Math.round(confidence * 100); // Convert to percentage

  // SVG radial dial
  const radius = 72; // Radius of the circle in pixels
  const stroke = 7; // Stroke width of the circle in pixels
  const normalizedRadius = radius - stroke * 2; // Adjusted radius to account for stroke width, ensuring the stroke is fully visible within the SVG viewbox
  const circumference = normalizedRadius * 2 * Math.PI; // Circumference of the circle, used for stroke-dasharray and stroke-dashoffset to create the progress effect
  const strokeDashoffset = circumference - (confidencePercent / 100) * circumference; // Calculate the stroke-dashoffset based on the confidence percentage, creating the visual effect of a progress arc on the radial dial

  const metrics = [
    { icon: <Clock size={18} />, label: 'Session Duration', value: formatDuration(stats.duration), color: 'cyan' },
    { icon: <Type size={18} />, label: 'Words Dictated', value: stats.wordsDictated.toLocaleString(), color: 'green' },
    { icon: <Terminal size={18} />, label: 'Commands Run', value: stats.commandsExecuted, color: 'blue' },
    { icon: <BarChart2 size={18} />, label: 'Characters', value: stats.charactersWritten.toLocaleString(), color: 'purple' },
  ];

  return (
    <div className="summary-page">
      {/* Page Header */}
      <div className="summary-page-header">
        <div className="summary-page-title-row">
          <Award className="summary-award-icon" />
          <div>
            <h2 className="summary-page-title">SESSION_SUMMARY</h2>
            <p className="summary-page-subtitle">TERMINATED @ {getFormattedTimestamp()}</p>
          </div>
        </div>
        <button className="btn btn-mute" onClick={onBack} title="Return to editor">
          ← Return to Editor
        </button>
      </div>

      {/* Main Grid */}
      <div className="summary-page-grid">
        {/* Left Column — Metrics */}
        <div className="summary-left">
          <div className="summary-metrics-grid">
            {metrics.map((m, i) => (
              <div key={i} className={`summary-metric-card summary-metric-${m.color}`}>
                <div className="summary-metric-icon">{m.icon}</div>
                <div className="summary-metric-body">
                  <span className="summary-metric-label">{m.label}</span>
                  <span className="summary-metric-value">{m.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="summary-actions">
            <button
              onClick={onDownloadLogs}
              className="btn btn-mute summary-action-btn"
              title="Download telemetry session log file"
            >
              <Download size={14} />
              <span>Download Session Log</span>
            </button>
            <button
              onClick={onExportPDF}
              className="btn btn-export summary-action-btn"
              title="Export session contents to PDF report"
            >
              <FileText size={14} />
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>

        {/* Right Column — Confidence Dial */}
        <div className="summary-right">
          <div className="summary-dial-wrap">
            <svg height={radius * 2} width={radius * 2} className="summary-dial-svg">
              {/* Track circle */}
              <circle
                stroke="rgba(34, 211, 238, 0.08)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Progress arc */}
              <circle
                stroke="var(--accent-cyan)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                transform={`rotate(-90 ${radius} ${radius})`}
              />
            </svg>
            <div className="summary-dial-overlay">
              <span className="summary-dial-percent">{confidencePercent}%</span>
              <span className="summary-dial-label">Confidence</span>
            </div>
          </div>

          <p className="summary-dial-caption">Speech_Coherence_Engine</p>

          {/* Coherence bars */}
          <div className="summary-coherence-meter">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`summary-coherence-bar ${i < Math.round((confidencePercent / 100) * 5) ? 'active' : ''}`}
              />
            ))}
          </div>

          {/* Engine status footer */}
          <div className="summary-engine-status">
            <span className="summary-engine-dot"></span>
            <span>ENGINE_STATUS: ARCHIVING_COMPLETE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
