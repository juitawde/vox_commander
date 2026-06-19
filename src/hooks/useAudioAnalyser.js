import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle Web Audio API setup, analyser node creation,
 * microphone stream handling, and frequency data extraction for the spectrogram.
 * 
 * @param {boolean} isListening - Controls whether the audio context and stream are active.
 * @returns {object} - Returns the analyserRef to be passed to the spectrogram component.
 */
export function useAudioAnalyser(isListening) { //This hook receives: isListening from App.jsx So: App.jsx → tells hook when mic is ON/OFF
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isListening) {
      //then is used to handle the promise returned by getUserMedia, which provides access to the user's microphone.
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        streamRef.current = stream; //store stream for cleanup later
        const AudioContext = window.AudioContext || window.webkitAudioContext; //creates audio processing engine
        const audioContext = new AudioContext(); //creates a new audio context instance
        const source = audioContext.createMediaStreamSource(stream); //converts microphone stream into audio node
        const analyser = audioContext.createAnalyser(); //creates analyser node to extract frequency data for visualization

        // Configure FFT (Fast Fourier Transform) size
        analyser.fftSize = 64; //breaks sound into frequency buckets, smaller value = fewer bars (simpler UI)
        source.connect(analyser); //connects microphone audio to analyser node for processing

        //store references for cleanup and access in animation loop
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount; //number of frequency slots
        const dataArray = new Uint8Array(bufferLength); //array to hold frequency data (0-255 values for each bucket)

        // requestAnimationFrame loop to update the UI
        const updateBars = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray); //fills array like: [12, 45, 200, 33, 90, ...] Each value = sound intensity

          const bars = document.querySelectorAll('.audio-wave .bar');
          if (bars && bars.length > 0) {
            for (let i = 0; i < bars.length; i++) {
              const dataIndex = Math.min(i, bufferLength - 1);
              const val = dataArray[dataIndex] / 255; //normalize value to 0-1 range
              const scaleY = 1.0 + (val * 7.5); //converts sound → bar height
              bars[i].style.transform = `scaleY(${scaleY})`; //visually animates bars
            }
          }
          animationFrameRef.current = requestAnimationFrame(updateBars); //loop for next frame
        };
        updateBars(); //start the animation loop
      }).catch((err) => console.warn('Audio analyser initiation failed:', err));
    } else {
      // Cleanup logic when listening stops
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); //CANCEL ANIMATION FRAME
      if (audioContextRef.current) audioContextRef.current.close().catch(() => { }); //CLOSE AUDIO CONTEXT
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); //STOP MICROPHONE

      // Reset bars to default state
      const bars = document.querySelectorAll('.audio-wave .bar');
      if (bars) bars.forEach(b => { b.style.transform = 'scaleY(1)'; });
    }

    // Cleanup logic on unmount or dependency change
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) { try { audioContextRef.current.close(); } catch (e) { } }
      if (streamRef.current) { try { streamRef.current.getTracks().forEach(t => t.stop()); } catch (e) { } }
    };
  }, [isListening]);

  return { analyserRef };
}
