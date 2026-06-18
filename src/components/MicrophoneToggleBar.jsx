import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Square } from 'lucide-react';

export default function MicrophoneToggleBar({ isListening, isMuted, startListening, stopListening, muteListening, resumeListening, browserSupportsSpeech }) {
  return (
    <div className={`mic-status-bar ${isListening ? 'listening' : ''}`}>
      <div className="mic-left">
        <div className={`mic-square ${isListening ? 'active' : 'inactive'}`}>
          {isListening ? <Mic className="icon" /> : <MicOff className="icon" />}
        </div>
        <div className="mic-meta">
          <span className="mic-label">Engine State</span>
          <div className="mic-state">
            {isListening ? (
              <>
                <span className="live-badge" style={{ opacity: isMuted ? 0.6 : 1 }}>
                  {isMuted ? 'MUTED' : 'LIVE'}
                </span>
              </>
            ) : (
              <span className="voice-text">Inactive — Click Start</span>
            )}
          </div>
        </div>
      </div>

      <div className="mic-right">
        {/* Equalizer bars when listening and not muted */}
        {isListening && !isMuted && (
          <div className="audio-wave">
            {[...Array(16)].map((_, i) => (
              <div key={i} className={`bar bar-${i + 1}`}></div>
            ))}
          </div>
        )}

        {!browserSupportsSpeech ? (
          <div className="browser-warning">⚠️ Speech API not supported</div>
        ) : (
          <>
            {!isListening ? (
              <button
                onClick={startListening}
                className="btn btn-export"
                title="Start voice capture"
              >
                <Mic className="icon-sm" />
                <span>Start Engine</span>
              </button>
            ) : (
              <>
                {isMuted ? (
                  <button
                    onClick={resumeListening}
                    className="btn btn-mute"
                    title="Resume speech engine"
                  >
                    <Volume2 className="icon-sm" />
                    <span>Resume Engine</span>
                  </button>
                ) : (
                  <button
                    onClick={muteListening}
                    className="btn btn-mute"
                    title="Mute speech engine"
                  >
                    <VolumeX className="icon-sm" />
                    <span>Mute Engine</span>
                  </button>
                )}
                <button
                  onClick={stopListening}
                  className="btn btn-stop"
                  title="Stop speech stream"
                >
                  <Square className="icon-sm" />
                  <span>Stop Stream</span>
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
