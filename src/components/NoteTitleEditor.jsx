import React from 'react';

// Title-case: capitalize first letter of every word
function toTitleCase(str) {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function NoteTitleEditor({ title, onChangeTitle }) {
  const handleBlur = (e) => {
    const formatted = toTitleCase(e.target.value);
    if (formatted !== e.target.value) {
      onChangeTitle(formatted);
    }
  };

  return (
    <div className="note-title-section">
      <input
        type="text"
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
        onBlur={handleBlur}
        placeholder="Enter note title..."
        className="title-input"
        title="Type or voice-set the title — will be auto capitalised"
      />
    </div>
  );
}
