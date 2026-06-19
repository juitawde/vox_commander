import { speakFeedback } from './speechFeedback';

export const handleExportTXT = (noteTitle, noteContent, addTelemetryLog) => {
  const element = document.createElement('a'); //create a temporary anchor element to trigger download (<a>)
  const fileContent = `Title: ${noteTitle}\n====================\n\n${noteContent}`;
  const file = new Blob([fileContent], { type: 'text/plain;charset=utf-8' }); //Blob = raw file in browser memory
  element.href = URL.createObjectURL(file); //converts blob → downloadable URL like: blob:http://app/xyz123
  const filename = noteTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_') || 'note'; // example: "My First Note!" → my_first_note
  element.download = `${filename}.txt`; //browser will download file with this name
  document.body.appendChild(element);
  element.click(); //this triggers download instantly
  document.body.removeChild(element); //cleanup (no leftover DOM node)

  addTelemetryLog('SUCCESS', `Notebook exported as text file: "${filename}.txt"`);
  speakFeedback('Notebook exported');
};

export const handleDownloadLogs = (telemetryLogs, addTelemetryLog) => {
  const element = document.createElement('a');
  const logText = telemetryLogs.map(log => `[${log.timestamp}] [${log.type}] ${log.message}`).join('\n'); //format logs as plain text
  const file = new Blob([logText], { type: 'text/plain;charset=utf-8' }); //Blob = raw file in browser memory
  element.href = URL.createObjectURL(file);
  element.download = `session_telemetry_${Date.now()}.log`; //timestamp ensures unique file name
  document.body.appendChild(element);
  element.click(); //this triggers download instantly
  document.body.removeChild(element);
  addTelemetryLog('SUCCESS', 'Session telemetry logs downloaded.');
};
