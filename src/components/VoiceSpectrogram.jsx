import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

/**
 * VoiceSpectrogram – a canvas-based real-time waveform visualiser.
 * When isListening is true, it reads from the shared analyserRef (Web Audio AnalyserNode).
 * When idle it shows a flat line with subtle noise.
 */
export default function VoiceSpectrogram({ isListening, isMuted, analyserRef }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas to match display size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // Dark background handled by CSS — just draw the waveform
      const analyser = analyserRef?.current;

      if (isListening && analyser && !isMuted) {
        // ── Live FFT waveform ──
        const bufLen = analyser.fftSize;
        const dataArr = new Float32Array(bufLen);
        analyser.getFloatTimeDomainData(dataArr);

        // Gradient stroke — cyan to teal
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, 'rgba(34, 211, 238, 0.9)');
        grad.addColorStop(0.5, 'rgba(20, 184, 166, 1)');
        grad.addColorStop(1, 'rgba(34, 211, 238, 0.9)');

        ctx.lineWidth = 2;
        ctx.strokeStyle = grad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(34, 211, 238, 0.5)';

        ctx.beginPath();
        const sliceW = W / bufLen;
        let x = 0;
        for (let i = 0; i < bufLen; i++) {
          const v = dataArr[i];
          const y = (H / 2) + v * (H / 2) * 0.85;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceW;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Glow fill below the wave
        const gradFill = ctx.createLinearGradient(0, 0, 0, H);
        gradFill.addColorStop(0, 'rgba(34, 211, 238, 0.06)');
        gradFill.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fillStyle = gradFill;
        ctx.fill();
      } else {
        ctx.clearRect(0, 0, W, H);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isListening, analyserRef]);

  return (
    <div className="spectrogram-card active">
      <div className="spectrogram-header">
        <div className="spectrogram-label">
          <span className="spec-dot" style={{ opacity: isMuted ? 0.4 : 1 }}></span>
          <Activity size={12} style={{ opacity: isMuted ? 0.4 : 1 }} />
          <span style={{ opacity: isMuted ? 0.6 : 1 }}>Voice Spectrogram — {isMuted ? 'Muted' : 'Live'}</span>
        </div>
        <div className="spectrogram-meta">
          <span className="spec-live-tag" style={{ opacity: isMuted ? 0.4 : 1 }}>{isMuted ? 'MUTED' : 'LIVE'}</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="spectrogram-canvas" />
    </div>
  );
}
