export const buildSummaryStats = (duration, sessionStats, charactersWritten, confidence) => ({
  duration: duration,
  wordsDictated: sessionStats.wordsDictated,
  commandsExecuted: sessionStats.commandsExecuted,
  charactersWritten: charactersWritten,
  confidence: confidence
});
