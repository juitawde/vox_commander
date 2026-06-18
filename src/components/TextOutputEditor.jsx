import React, { useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';

export default function TextOutputEditor({ content, onChangeContent, interimTranscript, isListening, addTelemetryLog }) {
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll when new text is added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content, interimTranscript]);

  const handleDisplayClick = () => {
    if (addTelemetryLog) {
      addTelemetryLog('ERROR', 'Manual editing disabled during voice capture. Stop the engine to edit note content.');
    }
  };

  return (
    <div className="text-editor-card" ref={containerRef}>
      {isListening ? (
        // Dictation Mode Display with Live Interim Results
        <div 
          className="editor-display-div"
          onClick={handleDisplayClick}
          title="Dictation active. Stop stream to edit text manually."
        >
          {content}
          {interimTranscript && <span className="interim-speech"> {interimTranscript}</span>}
          <span className="editor-cursor"></span>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          placeholder="Start typing your note here, or activate the Voice Engine and begin speaking..."
          className="editor-textarea"
          title="Type or dictate your note content"
        />
      )}

      <div className="editor-tip">
        <Zap className="icon-xs text-cyan" />
        <span>Say <code className="tip-code">command insert line</code> for new paragraph</span>
      </div>
    </div>
  );
}
