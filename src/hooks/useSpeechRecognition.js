import { useState, useEffect, useRef } from 'react';

export const useSpeechRecognition = ({ onFinalTranscript, onInterimTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [confidence, setConfidence] = useState(1);
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(false);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const isMutedRef = useRef(false);
  const silenceTimeoutRef = useRef(null);

  // Keep references to callbacks to prevent SpeechRecognition from restarting when they change
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onInterimTranscriptRef = useRef(onInterimTranscript);

  // Sync callbacks to refs on every render
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    onInterimTranscriptRef.current = onInterimTranscript;
  }, [onInterimTranscript]);

  // Silence timer: Force-restarts speech recognition if no audio/result event occurs for 4 seconds
  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (shouldListenRef.current) {
      silenceTimeoutRef.current = setTimeout(() => {
        console.log('Silence threshold reached. Force-restarting speech session...');
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop(); // This triggers onend, which boots a clean session
          } catch (e) {
            console.warn('Failed to stop speech engine for heartbeat restart:', e);
          }
        }
      }, 4000); // 4 seconds of silence triggers a refresh
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setBrowserSupportsSpeech(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        resetSilenceTimeout(); // Reset timer upon receiving speech results

        // If muted, discard all results silently
        if (isMutedRef.current) return;
        
        let interimText = '';
        let accumulatedFinalText = '';
        let lastConfidence = 1;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            accumulatedFinalText += (accumulatedFinalText ? ' ' : '') + result[0].transcript;
            lastConfidence = result[0].confidence;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (accumulatedFinalText && onFinalTranscriptRef.current) {
          onFinalTranscriptRef.current(accumulatedFinalText.trim(), lastConfidence);
        }
        if (onInterimTranscriptRef.current) {
          onInterimTranscriptRef.current(interimText);
        }
        if (lastConfidence > 0) {
          setConfidence(lastConfidence);
        }
      };

      rec.onstart = () => {
        resetSilenceTimeout(); // Start timer when session starts
      };

      rec.onspeechstart = () => {
        resetSilenceTimeout(); // Reset timer when speech begins
      };

      rec.onend = () => {
        // Restart speech recognition automatically if user still wants it active
        if (shouldListenRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.warn('Speech recognition restart failed:', e);
              }
            }
          }, 300);
        } else {
          setIsListening(false);
          setIsMuted(false);
          isMutedRef.current = false;
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          shouldListenRef.current = false;
          setIsListening(false);
          setIsMuted(false);
          isMutedRef.current = false;
        }
        // Let it proceed to onend where it will attempt a clean restart if allowed
      };

      recognitionRef.current = rec;
    } else {
      setBrowserSupportsSpeech(false);
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []); // Run exactly once on mount

  const startListening = () => {
    if (!browserSupportsSpeech || !recognitionRef.current) return;
    shouldListenRef.current = true;
    isMutedRef.current = false;
    setIsMuted(false);
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
    }
  };

  const stopListening = () => {
    if (!browserSupportsSpeech || !recognitionRef.current) return;
    shouldListenRef.current = false;
    isMutedRef.current = false;
    setIsMuted(false);
    setIsListening(false);
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.warn('Speech recognition stop failed:', e);
    }
  };

  const muteListening = () => {
    isMutedRef.current = true;
    setIsMuted(true);
    // Clear any interim text since we're muting
    if (onInterimTranscriptRef.current) {
      onInterimTranscriptRef.current('');
    }
  };

  const resumeListening = () => {
    isMutedRef.current = false;
    setIsMuted(false);
  };

  return {
    isListening,
    isMuted,
    confidence,
    browserSupportsSpeech,
    startListening,
    stopListening,
    muteListening,
    resumeListening
  };
};
