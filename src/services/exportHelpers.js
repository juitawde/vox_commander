import { speakFeedback } from './speechFeedback';

export const handleExportTXT = (noteTitle, noteContent, addTelemetryLog) => {
  const element = document.createElement('a');
  const fileContent = `Title: ${noteTitle}\n====================\n\n${noteContent}`;
  const file = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  const filename = noteTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_') || 'note';
  element.download = `${filename}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);

  addTelemetryLog('SUCCESS', `Notebook exported as text file: "${filename}.txt"`);
  speakFeedback('Notebook exported');
};

export const handleDownloadLogs = (telemetryLogs, addTelemetryLog) => {
  const element = document.createElement('a');
  const logText = telemetryLogs.map(log => `[${log.timestamp}] [${log.type}] ${log.message}`).join('\n');
  const file = new Blob([logText], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = `session_telemetry_${Date.now()}.log`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  addTelemetryLog('SUCCESS', 'Session telemetry logs downloaded.');
};
