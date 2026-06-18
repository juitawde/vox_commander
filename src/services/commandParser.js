import { speakFeedback } from './speechFeedback';
import { getFormattedDate, getFormattedTime } from '../utils/dateTime';

// ───────── Auto-Punctuation Engine ────────────────
// Analyses pause-demarcated speech chunks and infers punctuation.
export function autoPunctuate(rawText, previousText) {
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
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const eraseLastWord = (str) => {
  return str.replace(/\s*\S+\s*$/, '');
};

export const processTranscriptCommand = ({
  rawText,
  currentText,
  setNoteContent,
  setNoteTitle,
  setDuration,
  toggleTheme,
  addTelemetryLog,
  setSessionStats,
  setErrorsCount
}) => {
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
    const formattedDate = getFormattedDate();
    const space = (currentText === '' || currentText.endsWith('\n') || currentText.endsWith(' ')) ? '' : ' ';
    setNoteContent(currentText + space + formattedDate);
    speakFeedback('Date inserted');
    addTelemetryLog('COMMAND', `command insert date executed. Inserted "${formattedDate}".`);
    setSessionStats(prev => ({ ...prev, commandsExecuted: prev.commandsExecuted + 1 }));
    return;
  }

  // 9. command insert time
  if (lowerText === 'command insert time') {
    const formattedTime = getFormattedTime();
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
};
