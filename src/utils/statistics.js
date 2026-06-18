export const buildSummaryStats = (duration, sessionStats, charactersWritten, errorsCount, confidence) => ({
  duration: duration,
  wordsDictated: sessionStats.wordsDictated,
  commandsExecuted: sessionStats.commandsExecuted,
  charactersWritten: charactersWritten,
  errorsCount: errorsCount,
  confidence: confidence
});
