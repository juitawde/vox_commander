import React from 'react';

// Title-case: capitalize first letter of every word
function toTitleCase(str) {
  if (!str) return '';
  return str
    .trim() //removes leading/trailing spaces
    .split(/\s+/) //splits on one or more spaces
    .filter(Boolean) //removes empty strings from multiple spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) //capitalizes first letter and adds rest of word using slice with map
    .join(' '); //joins words back into a single string with spaces
}

export default function NoteTitleEditor({ title, onChangeTitle }) {
  const handleBlur = (e) => { // When the input loses focus (user clicks away / tabs out)
    const formatted = toTitleCase(e.target.value); // Format the title to title case on blur
    if (formatted !== e.target.value) { // Only update if the formatted title is different from the current value
      onChangeTitle(formatted);
    }
  };

  return (
    <div className="note-title-section">
      <input
        type="text"
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
        onBlur={handleBlur} // Auto-format to title case when user finishes editing (on blur)
        placeholder="Enter note title..."
        className="title-input"
        title="Type or voice-set the title — will be auto capitalised"
      />
    </div>
  );
}
