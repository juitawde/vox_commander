import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import MicrophoneToggleBar from './components/MicrophoneToggleBar';
import NoteTitleEditor from './components/NoteTitleEditor';
import TextOutputEditor from './components/TextOutputEditor';
import StatisticsPanel from './components/StatisticsPanel';
import CommandRegistry from './components/CommandRegistry';
import TelemetryLog from './components/TelemetryLog';
import SessionSummaryPage from './components/SessionSummaryPage';
import VoiceSpectrogram from './components/VoiceSpectrogram';

// Hooks
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTelemetry } from './hooks/useTelemetry';
import { useAudioAnalyser } from './hooks/useAudioAnalyser';

// Services
import { speakFeedback } from './services/speechFeedback';
import { processTranscriptCommand } from './services/commandParser';
import { exportToPDF } from './services/exportPDF';
import { handleExportTXT, handleDownloadLogs } from './services/exportHelpers';

// Utils
import { buildSummaryStats } from './utils/statistics';

import './App.css';

export default function App() {
  // --- 1. State Management ---
  const [currentView, setCurrentView] = useState('editor'); // 'editor' | 'summary'
  const [noteTitle, setNoteTitle] = useLocalStorage('noteTitle', '');
  const [noteContent, setNoteContent] = useLocalStorage('noteContent', '');
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const [errorsCount, setErrorsCount] = useLocalStorage('errorsCount', 0);

  const [duration, setDuration] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    wordsDictated: 0,
    commandsExecuted: 0,
    charactersWritten: 0
  });
  const [interimTranscript, setInterimTranscript] = useState('');

  const { telemetryLogs, addTelemetryLog, handleClearLogs } = useTelemetry();

  // Refs for callbacks
  const contentRef = useRef(noteContent);
  const themeRef = useRef(theme);

  useEffect(() => {
    contentRef.current = noteContent;
  }, [noteContent]);

  useEffect(() => {
    themeRef.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Scroll to top and log telemetry when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addTelemetryLog('SYSTEM', `UI Navigation: Entered ${currentView === 'summary' ? 'SESSION SUMMARY' : 'NOTE EDITOR'} view.`);
  }, [currentView, addTelemetryLog]);

  // --- 2. Theme Toggle Handler ---
  const toggleTheme = useCallback(() => {
    const nextTheme = themeRef.current === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    speakFeedback(nextTheme === 'dark' ? 'Dark Mode Enabled' : 'Light Mode Enabled');
    addTelemetryLog('SYSTEM', `UI theme changed to: ${nextTheme.toUpperCase()}`);
  }, [addTelemetryLog, setTheme]);

  // --- 3. Command Parsing ---
  const processFinalTranscript = useCallback((rawText, conf) => {
    processTranscriptCommand({
      rawText,
      currentText: contentRef.current,
      setNoteContent,
      setNoteTitle,
      setDuration,
      toggleTheme,
      addTelemetryLog,
      setSessionStats,
      setErrorsCount
    });
  }, [setNoteContent, setNoteTitle, toggleTheme, addTelemetryLog, setErrorsCount]);

  const handleInterimTranscript = useCallback((text) => {
    setInterimTranscript(text);
  }, []);

  // --- 4. Speech Recognition ---
  const {
    isListening,
    isMuted,
    confidence,
    browserSupportsSpeech,
    startListening,
    stopListening,
    muteListening,
    resumeListening
  } = useSpeechRecognition({
    onFinalTranscript: processFinalTranscript,
    onInterimTranscript: handleInterimTranscript
  });

  // Track duration
  useEffect(() => {
    if (isListening) {
      setDuration(0);
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isListening]);

  // Log engine events
  useEffect(() => {
    if (isListening) {
      addTelemetryLog('SYSTEM', 'Continuous Speech Recognition engine started. Listening...');
    } else {
      addTelemetryLog('SYSTEM', 'Speech Recognition engine went to standby mode.');
    }
  }, [isListening, addTelemetryLog]);

  useEffect(() => {
    if (isListening) {
      addTelemetryLog('SYSTEM', `Speech Recognition engine ${isMuted ? 'muted (input paused)' : 'resumed (input active)'}.`);
    }
  }, [isMuted, isListening, addTelemetryLog]);

  // --- 5. Web Audio API Analyser ---
  const { analyserRef } = useAudioAnalyser(isListening);

  // --- 6. Export Handlers ---
  const onExportTXT = () => handleExportTXT(noteTitle, noteContent, addTelemetryLog);
  const onExportPDF = () => {
    exportToPDF(noteTitle, noteContent);
    addTelemetryLog('SUCCESS', 'Notebook exported as PDF.');
    speakFeedback('PDF exported');
  };
  const onDownloadLogs = () => handleDownloadLogs(telemetryLogs, addTelemetryLog);

  const summaryStats = buildSummaryStats(duration, sessionStats, noteContent.length, errorsCount, confidence);

  return (
    <div className="app-layout">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onExportPDF={onExportPDF}
        onExportTXT={onExportTXT}
        currentView={currentView}
        onNavigate={setCurrentView}
        isListening={isListening}
      />

      <main className="app-main">
        {currentView === 'summary' ? (
          <SessionSummaryPage
            stats={summaryStats}
            onExportPDF={onExportPDF}
            onDownloadLogs={onDownloadLogs}
            onBack={() => setCurrentView('editor')}
          />
        ) : (
          <div className="workspace-grid">
            <div className="workspace-main">
              <MicrophoneToggleBar
                isListening={isListening}
                isMuted={isMuted}
                startListening={startListening}
                stopListening={stopListening}
                muteListening={muteListening}
                resumeListening={resumeListening}
                browserSupportsSpeech={browserSupportsSpeech}
              />
              <NoteTitleEditor title={noteTitle} onChangeTitle={setNoteTitle} />
              <TextOutputEditor
                content={noteContent}
                onChangeContent={setNoteContent}
                interimTranscript={interimTranscript}
                isListening={isListening}
                addTelemetryLog={addTelemetryLog}
              />
              <StatisticsPanel content={noteContent} duration={duration} confidence={confidence} />
              {isListening && (
                <VoiceSpectrogram isListening={isListening} isMuted={isMuted} analyserRef={analyserRef} />
              )}
            </div>
            <div className="workspace-sidebar">
              <CommandRegistry isListening={isListening} startListening={startListening} />
            </div>
          </div>
        )}
      </main>

      <TelemetryLog
        logs={telemetryLogs}
        isListening={isListening}
        confidence={confidence}
        duration={duration}
        onClearLogs={handleClearLogs}
      />
    </div>
  );
}
