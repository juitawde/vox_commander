import React from 'react';
import { Type, FileText, AlignLeft, Clock } from 'lucide-react';

export default function StatisticsPanel({ content, duration, confidence }) {
  const characterCount = content.length;
  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).filter(Boolean).length;
  
  const formatDuration = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const confidencePercent = Math.round(confidence * 100);
  let barClass = 'bg-red-fill';
  if (confidencePercent >= 85) barClass = 'bg-green-fill';
  else if (confidencePercent >= 70) barClass = 'bg-amber-fill';

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <div className="stat-icon-box cyan-bg">
          <Type className="icon-sm" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{characterCount}</span>
          <span className="stat-label">Characters</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-box green-bg">
          <AlignLeft className="icon-sm" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{wordCount}</span>
          <span className="stat-label">Words</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-box amber-bg">
          <FileText className="icon-sm" />
        </div>
        <div className="stat-info">
          <div className="confidence-inline">
            <span className="stat-value">{confidencePercent}%</span>
            <span className="stat-label">Confidence</span>
            <div className="confidence-bar-track">
              <div className={`confidence-bar-fill ${barClass}`} style={{ width: `${confidencePercent}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-box red-bg">
          <Clock className="icon-sm" />
        </div>
        <div className="stat-info">
          <span className="stat-value">{formatDuration(duration)}</span>
          <span className="stat-label">Duration</span>
        </div>
      </div>
    </div>
  );
}
