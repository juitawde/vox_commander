import React from 'react';
import { Sun, Moon, Download, FileText, Mic } from 'lucide-react';

export default function Header({ theme, toggleTheme, onExportPDF, onExportTXT, currentView, onNavigate, isListening }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-icon-wrap">
          <Mic className="logo-mic-icon" />
          {isListening && <span className="logo-pulse-ring" />}
        </div>
        <h1 className="brand-title">VoxCommander</h1>
      </div>

      <nav className="header-nav">
        <button
          className={`nav-tab ${currentView === 'editor' ? 'active' : ''}`}
          onClick={() => onNavigate('editor')}
        >
          Editor
        </button>
        <button
          className={`nav-tab ${currentView === 'summary' ? 'active' : ''}`}
          onClick={() => onNavigate('summary')}
          title="View session performance telemetry summary"
        >
          Session Summary
        </button>
      </nav>

      <div className="header-actions">
        <button
          onClick={toggleTheme}
          className="btn-icon"
          aria-label="Toggle Theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="icon-sm" /> : <Moon className="icon-sm" />}
        </button>

        <button
          onClick={onExportPDF}
          className="btn-icon"
          title="Export note as PDF"
        >
          <Download className="icon-sm" />
        </button>

        <button
          onClick={onExportTXT}
          className="btn btn-export"
          title="Export note as text file"
        >
          <FileText className="icon-sm" />
          <span>Export Notebook</span>
        </button>
      </div>
    </header>
  );
}
