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
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { exportToPDF } from './utils/pdfExporter';
import './App.css';

// ───────── Auto-Punctuation Engine ────────────────
// Analyses pause-demarcated speech chunks and infers punctuation.
function autoPunctuate(rawText, previousText) {
  if (!rawText || !rawText.trim()) return rawText;

  let text = rawText.trim();


  // 3. Capitalize standalone "i" to "I"
  text = text.replace(/\bi\b/g, 'I');

  // 4. Capitalize first letter of every sentence
  text = text.replace(/(^|[.!?]\s+)([a-z])/g, (match, separator, letter) => {
    return separator + letter.toUpperCase();
  });

  return text;
}

// Title-case: capitalize first letter of every word
function toTitleCase(str) {
  if (!str) return '';
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function App() {
  // --- 1. State Management & Initialization from LocalStorage ---
  const [currentView, setCurrentView] = useState('editor'); // 'editor' | 'summary'

  const [noteTitle, setNoteTitle] = useState(() => {
    return localStorage.getItem('noteTitle') || '';
  });

  const [noteContent, setNoteContent] = useState(() => {
    return localStorage.getItem('noteContent') || '';
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Duration in seconds — counts only while mic is active, resets each activation
  const [duration, setDuration] = useState(0);

  const [telemetryLogs, setTelemetryLogs] = useState(() => {
    const saved = localStorage.getItem('telemetryLogs');
    return saved ? JSON.parse(saved) : [];
  });

  // Errors Tracker
  const [errorsCount, setErrorsCount] = useState(() => {
    const saved = localStorage.getItem('errorsCount');
    return saved ? parseInt(saved, 10) : 0;
  });


  // Session Statistics
  const [sessionStats, setSessionStats] = useState({
    wordsDictated: 0,
    commandsExecuted: 0,
    charactersWritten: 0
  });

  // Live Speech State
  const [interimTranscript, setInterimTranscript] = useState('');

  // Refs for callbacks
  const contentRef = useRef(noteContent);
  const themeRef = useRef(theme);

  useEffect(() => {
    contentRef.current = noteContent;
  }, [noteContent]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // --- 2. LocalStorage Mirrors ---
  useEffect(() => {
    localStorage.setItem('noteTitle', noteTitle);
  }, [noteTitle]);

  useEffect(() => {
    localStorage.setItem('noteContent', noteContent);
  }, [noteContent]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('telemetryLogs', JSON.stringify(telemetryLogs));
  }, [telemetryLogs]);



  useEffect(() => {
    localStorage.setItem('errorsCount', errorsCount.toString());
  }, [errorsCount]);

  // --- 3. Telemetry Logger ---
  const addTelemetryLog = useCallback((type, message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      type,
      message
    };
    setTelemetryLogs((prev) => {
      const updated = [...prev, newLog];
      if (updated.length > 80) return updated.slice(-80);
      return updated;
    });
  }, []);

  // Scroll to top and log telemetry when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addTelemetryLog('SYSTEM', `UI Navigation: Entered ${currentView === 'summary' ? 'SESSION SUMMARY' : 'NOTE EDITOR'} view.`);
  }, [currentView, addTelemetryLog]);

  const handleClearLogs = () => {
    setTelemetryLogs([]);
    localStorage.setItem('telemetryLogs', JSON.stringify([]));
  };

  // --- 4. Speech Synthesis Feedback ---
  const speakFeedback = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // --- 5. Theme Toggle Handler ---
  const toggleTheme = useCallback(() => {
    const nextTheme = themeRef.current === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    speakFeedback(nextTheme === 'dark' ? 'Dark Mode Enabled' : 'Light Mode Enabled');
    addTelemetryLog('SYSTEM', `UI theme changed to: ${nextTheme.toUpperCase()}`);
  }, [addTelemetryLog, speakFeedback]);


  // Text utilities
  const eraseLastWord = (str) => {
    return str.replace(/\s*\S+\s*$/, '');
  };

  // --- 7. Macro Command Parser Router ---
  const processFinalTranscript = useCallback((rawText, conf) => {
    const currentText = contentRef.current;
    const cleanedText = rawText.trim().replace(/[.!?]+$/, '');
    const lowerText = cleanedText.toLowerCase();

    // 1. command insert line
    if (lowerText === 'command insert line') {
      setNoteContent(currentText + '\n');
      speakFeedback('Line inserted');
      addTelemetryLog('COMMAND', 'command insert line executed.');
      setSessionStats(prev => ({ ...prev, commandsExecuted: prev.commandsExecuted + 1 }));
      return;
    }

    // 2. command erase word
    if (lowerText === 'command erase word') {
      const updated = eraseLastWord(currentText);
      setNoteContent(updated);
      speakFeedback('Word deleted');
      addTelemetryLog('COMMAND', 'command erase word executed. Last word removed.');
      setSessionStats(prev => ({ ...prev, commandsExecuted: prev.commandsExecuted + 1 }));
      return;
    }

    // 3. command title [text]
    const titleMatch = rawText.match(/^command title\s+(.+)$/i);
    if (titleMatch) {
      const rawTitle = titleMatch[1].trim().replace(/[.!?]+$/, '');
      const formattedTitle = toTitleCase(rawTitle);
      setNoteTitle(formattedTitle);
      speakFeedback('Title updated');
      addTelemetryLog('COMMAND', `command title executed. Title renamed to "${formattedTitle}".`);
      setSessionStats(prev => ({ ...prev, commandsExecuted: prev.commandsExecuted + 1 }));
      return;
    }

    // 6. command clear note
    if (lowerText === 'command clear note') {
      setNoteContent('');
      setDuration(0);
      speakFeedback('Note cleared');
      addTelemetryLog('COMMAND', 'command clear note executed. Content wiped.');
      setSessionStats(prev => ({ ...prev, commandsExecuted: prev.commandsExecuted + 1 }));
      return;
    }

    // 7. command toggle theme
    if (lowerText === 'command toggle theme') {
      toggleTheme();
      setSessionStats(prev => ({ ...prev, commandsExecuted: prev.commandsExecuted + 1 }));
      return;
    }

    // 8. command insert date
    if (lowerText === 'command insert date') {
      const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = new Date().toLocaleDateString('en-US', dateOptions);
      const space = (currentText === '' || currentText.endsWith('\n') || currentText.endsWith(' ')) ? '' : ' ';
      setNoteContent(currentText + space + formattedDate);
      speakFeedback('Date inserted');
      addTelemetryLog('COMMAND', `command insert date executed. Inserted "${formattedDate}".`);
      setSessionStats(prev => ({ ...prev, commandsExecuted: prev.commandsExecuted + 1 }));
      return;
    }

    // 9. command insert time
    if (lowerText === 'command insert time') {
      const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
      const formattedTime = new Date().toLocaleTimeString('en-US', timeOptions);
      const space = (currentText === '' || currentText.endsWith('\n') || currentText.endsWith(' ')) ? '' : ' ';
      setNoteContent(currentText + space + formattedTime);
      speakFeedback('Time inserted');
      addTelemetryLog('COMMAND', `command insert time executed. Inserted "${formattedTime}".`);
      setSessionStats(prev => ({ ...prev, commandsExecuted: prev.commandsExecuted + 1 }));
      return;
    }

    // Unrecognized command check
    if (lowerText.startsWith('command ')) {
      speakFeedback('Unknown command');
      addTelemetryLog('ERROR', `Rejected unrecognized command phrase: "${rawText}"`);
      setErrorsCount((prev) => prev + 1);
      return;
    }

    // ─── Dictation Mode with Auto-Punctuation ───
    const punctuatedText = autoPunctuate(rawText, currentText);
    const space = (currentText === '' || currentText.endsWith('\n')) ? '' : ' ';
    const newContent = currentText + space + punctuatedText;
    setNoteContent(newContent);
    addTelemetryLog('SUCCESS', `Dictated: "${punctuatedText}"`);

    const wordCount = punctuatedText.trim().split(/\s+/).filter(Boolean).length;
    setSessionStats((prev) => ({
      ...prev,
      wordsDictated: prev.wordsDictated + wordCount,
      charactersWritten: prev.charactersWritten + punctuatedText.length
    }));
  }, [toggleTheme, speakFeedback, addTelemetryLog]);

  const handleInterimTranscript = useCallback((text) => {
    setInterimTranscript(text);
  }, []);

  // --- 8. Speech Recognition Hook Integration ---
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

  // Reset duration to 0 when mic turns on, tick every second while listening
  useEffect(() => {
    if (isListening) {
      setDuration(0);
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isListening]);

  // Log voice engine events
  useEffect(() => {
    if (isListening) {
      addTelemetryLog('SYSTEM', 'Continuous Speech Recognition engine started. Listening...');
    } else {
      addTelemetryLog('SYSTEM', 'Speech Recognition engine went to standby mode.');
    }
  }, [isListening, addTelemetryLog]);

  useEffect(() => {
    if (isListening) {
      if (isMuted) {
        addTelemetryLog('SYSTEM', 'Speech Recognition engine muted (input paused).');
      } else {
        addTelemetryLog('SYSTEM', 'Speech Recognition engine resumed (input active).');
      }
    }
  }, [isMuted, isListening, addTelemetryLog]);

  // --- 9. Web Audio API Analyser for Voice Equalizer ---
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isListening) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          streamRef.current = stream;
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          audioContextRef.current = audioContext;
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateBars = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            const bars = document.querySelectorAll('.audio-wave .bar');
            if (bars && bars.length > 0) {
              for (let i = 0; i < bars.length; i++) {
                const dataIndex = Math.min(i, bufferLength - 1);
                const val = dataArray[dataIndex] / 255;
                const scaleY = 1.0 + (val * 7.5);
                bars[i].style.transform = `scaleY(${scaleY})`;
              }
            }
            animationFrameRef.current = requestAnimationFrame(updateBars);
          };

          updateBars();
        })
        .catch((err) => {
          console.warn('Microphone audio analyser initiation failed:', err);
        });
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => { });
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const bars = document.querySelectorAll('.audio-wave .bar');
      if (bars) {
        bars.forEach(bar => {
          bar.style.transform = 'scaleY(1)';
        });
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) { }
      }
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) { }
      }
    };
  }, [isListening]);

  // --- 10. Export & Session Summary Actions ---
  const handleExportTXT = () => {
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

  const handleExportPDF = () => {
    exportToPDF(noteTitle, noteContent);
    addTelemetryLog('SUCCESS', `Notebook exported as PDF.`);
    speakFeedback('PDF exported');
  };

  const handleDownloadLogs = () => {
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

  // Build summary stats for the summary page
  const buildSummaryStats = () => ({
    duration: duration,
    wordsDictated: sessionStats.wordsDictated,
    commandsExecuted: sessionStats.commandsExecuted,
    charactersWritten: noteContent.length,
    errorsCount: errorsCount,
    confidence: confidence
  });

  return (
    <div className="app-layout">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onExportPDF={handleExportPDF}
        onExportTXT={handleExportTXT}
        currentView={currentView}
        onNavigate={setCurrentView}
        isListening={isListening}
      />

      <main className="app-main">
        {currentView === 'summary' ? (
          // ── Inline Session Summary Page ──
          <SessionSummaryPage
            stats={buildSummaryStats()}
            onExportPDF={handleExportPDF}
            onDownloadLogs={handleDownloadLogs}
            onBack={() => setCurrentView('editor')}
          />
        ) : (
          // ── Editor View ──
          <div className="workspace-grid">
            {/* Main Content Column */}
            <div className="workspace-main">
              {/* Mic Status Bar */}
              <MicrophoneToggleBar
                isListening={isListening}
                isMuted={isMuted}
                startListening={startListening}
                stopListening={stopListening}
                muteListening={muteListening}
                resumeListening={resumeListening}
                browserSupportsSpeech={browserSupportsSpeech}
              />

              {/* Note Title */}
              <NoteTitleEditor
                title={noteTitle}
                onChangeTitle={setNoteTitle}
              />

              {/* Text Editor */}
              <TextOutputEditor
                content={noteContent}
                onChangeContent={setNoteContent}
                interimTranscript={interimTranscript}
                isListening={isListening}
                addTelemetryLog={addTelemetryLog}
              />

              {/* Statistics Cards */}
              <StatisticsPanel
                content={noteContent}
                duration={duration}
                confidence={confidence}
              />

              {/* Voice Spectrogram */}
              {isListening && (
                <VoiceSpectrogram
                  isListening={isListening}
                  isMuted={isMuted}
                  analyserRef={analyserRef}
                />
              )}
            </div>

            {/* Sidebar Column */}
            <div className="workspace-sidebar">
              <CommandRegistry
                isListening={isListening}
                startListening={startListening}
              />
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
