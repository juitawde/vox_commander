import { useState, useEffect, useRef } from 'react';

export const useSpeechRecognition = ({ onFinalTranscript, onInterimTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false); //muted means we're still listening but ignoring input (used for pause/resume without restarting engine)
  const [confidence, setConfidence] = useState(1); //how accurate speech recognition is (0–1)
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(false); //detect if browser supports Web Speech API
  const recognitionRef = useRef(null); //stores SpeechRecognition object
  const shouldListenRef = useRef(false); //important for auto-restart logic
  const isMutedRef = useRef(false); //avoids stale state inside async events and allows mute state to persist across restarts without affecting onFinalTranscript callback logic
  const silenceTimeoutRef = useRef(null); //stores timer for “silence detection”

  // Because callbacks change every render in React. So we store latest version here to avoid: stale closures, broken speech engine callbacks
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; //SpeechRecognition-	standard API, webkitSpeechRecognition-	Chrome-specific fallback
    if (SpeechRecognition) {
      setBrowserSupportsSpeech(true);
      //This creates a real browser object in memory
      const rec = new SpeechRecognition(); //creates a new microphone listener instance
      rec.continuous = true; //keeps listening until explicitly stopped
      rec.interimResults = true; //gives live partial results
      rec.lang = 'en-US'; //set language to US English

      rec.onresult = (event) => { //fires whenever speech is detected or updated
        resetSilenceTimeout(); // Reset timer upon receiving speech results

        // If muted, discard all results silently
        if (isMutedRef.current) return;
        
        let interimText = '';
        let accumulatedFinalText = '';
        let lastConfidence = 1;

        //processes only new speech results not old ones
        for (let i = event.resultIndex; i < event.results.length; ++i) { // ++i preincrements i before using it, but here it behaves the same as i++ since it's in a for loop
          const result = event.results[i]; //single speech chunk
          if (result.isFinal) {
            accumulatedFinalText += (accumulatedFinalText ? ' ' : '') + result[0].transcript; //transcript is the speech-to-text output.
            lastConfidence = result[0].confidence; //how accurate speech was (0–1)
          } else {
            interimText += result[0].transcript;
          }
        }

        if (accumulatedFinalText && onFinalTranscriptRef.current) { //check both because no sending empty text, no calling undefined function
          onFinalTranscriptRef.current(accumulatedFinalText.trim(), lastConfidence); //Sends data back to App.jsx
        }
        if (onInterimTranscriptRef.current) {
          onInterimTranscriptRef.current(interimText); //send live speech updates back to App.jsx for real-time display
        }
        if (lastConfidence > 0) {
          setConfidence(lastConfidence); //ensure valid confidence score
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
          setTimeout(() => { //small delay before restart (300ms) to avoid rapid restart loops, avoids browser crash
            if (shouldListenRef.current && recognitionRef.current) { //Double safety check: still supposed to listen then engine exists
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.warn('Speech recognition restart failed:', e);
              }
            }
          }, 300);
        } else {
          setIsListening(false); //user has stopped listening manually
          //reset mute state completely
          setIsMuted(false);
          isMutedRef.current = false;
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current); //No need anymore because mic is OFF
          }
        }
      };

      //This runs whenever speech recognition fails.
      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') { //special case: user denied microphone access
          shouldListenRef.current = false;
          setIsListening(false);
          setIsMuted(false);
          isMutedRef.current = false;
        }
        // Let it proceed to onend where it will attempt a clean restart if allowed
        //error tells me what happened, but onend tells me the final state
        //START → LISTEN → RESULT → ERROR? → END → RESTART?
        //Even when onerror fires, the Web Speech API still proceeds to onend as part of its lifecycle termination.
      };

      recognitionRef.current = rec; //save SpeechRecognition object globally so start, stop, restart can be called from anywhere in this hook
    } else {
      setBrowserSupportsSpeech(false);
    }

//     CONTROL layer:(called by App.jsx)
//     startListening
//     stopListening
//     restart logic
//     EVENT layer:(called by Web Speech API)
//     onresult
//     onerror
//     onend
//     onstart


    //Cleanup function begins..its required otherwise microphone keeps running, memory leaks, duplicate event listeners, crashes on remount 
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

//whole flowchart:
// START
//   ↓
// LISTENING
//   ↓
// onresult → App.jsx updates
//   ↓
// MUTE (ignore results)
//   ↓
// RESUME (process again)
//   ↓
// STOP (engine stops)
//   ↓
// onend
//   ↓
// START AGAIN (reuse same engine)