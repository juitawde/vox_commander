import React from 'react';

export default function ConfidenceMeter({ confidence }) {
  // Convert decimal confidence to percentage (0 - 100)
  const percentage = Math.round(confidence * 100);

  // Determine color theme based on confidence level
  let statusColor = 'bg-red';
  let statusLabel = 'Weak';
  
  if (percentage >= 85) {
    statusColor = 'bg-green';
    statusLabel = 'Excellent';
  } else if (percentage >= 70) {
    statusColor = 'bg-yellow';
    statusLabel = 'Good';
  }

  // Generate the text-based bar block indicator as requested: █████████░ 92%
  const totalBlocks = 10;
  const activeBlocks = Math.round((percentage / 100) * totalBlocks);
  const blockString = '█'.repeat(activeBlocks) + '░'.repeat(totalBlocks - activeBlocks);

  return (
    <div className="confidence-meter-container">
      <div className="meter-header">
        <span className="meter-title">Speech Confidence</span>
        <span className={`meter-badge badge-${statusLabel.toLowerCase()}`}>{statusLabel}</span>
      </div>

      <div className="meter-blocks-wrapper" title={`Confidence score: ${percentage}%`}>
        <span className="meter-blocks">{blockString}</span>
        <span className="meter-percent font-mono">{percentage}%</span>
      </div>

      <div className="meter-bar-track">
        <div 
          className={`meter-bar-fill ${statusColor}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
