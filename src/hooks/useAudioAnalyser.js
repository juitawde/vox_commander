import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle Web Audio API setup, analyser node creation,
 * microphone stream handling, and frequency data extraction for the spectrogram.
 * 
 * @param {boolean} isListening - Controls whether the audio context and stream are active.
 * @returns {object} - Returns the analyserRef to be passed to the spectrogram component.
 */
export function useAudioAnalyser(isListening) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isListening) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        streamRef.current = stream;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        
        // Configure FFT (Fast Fourier Transform) size
        analyser.fftSize = 64;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // requestAnimationFrame loop to update the UI
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
      }).catch((err) => console.warn('Audio analyser initiation failed:', err));
    } else {
      // Cleanup logic when listening stops
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

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
