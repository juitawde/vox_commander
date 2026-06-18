import { useState, useCallback, useEffect } from 'react';

export function useTelemetry() {
  const [telemetryLogs, setTelemetryLogs] = useState(() => {
    const saved = localStorage.getItem('telemetryLogs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('telemetryLogs', JSON.stringify(telemetryLogs));
  }, [telemetryLogs]);

  const addTelemetryLog = useCallback((type, message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      type,
      message
    };
    setTelemetryLogs((prev) => {
      const updated = [...prev, newLog];
      if (updated.length > 80) return updated.slice(-80);
      return updated;
    });
  }, []);

  const handleClearLogs = () => {
    setTelemetryLogs([]);
    localStorage.setItem('telemetryLogs', JSON.stringify([]));
  };

  return { telemetryLogs, addTelemetryLog, handleClearLogs };
}
