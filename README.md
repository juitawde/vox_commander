# 🎙️ Voice Activated Note Commander

A voice-controlled smart note-taking application that enables users to create, edit, and manage notes using speech commands. The application combines real-time speech recognition, voice commands, audio visualization, telemetry logging, and document export features to provide a hands-free note-taking experience.

---

## 🚀 Live Demo

🔗 **Live Application:** https://vox-commander.vercel.app

---

## 📖 Project Description

Voice Activated Note Commander is a browser-based note-taking application that allows users to dictate notes and control the editor using voice commands. It uses the Web Speech API for speech recognition, the Web Audio API for real-time audio visualization, and speech synthesis for voice feedback.

Users can:

* Dictate notes in real time.
* Execute voice commands.
* View live speech transcription.
* Track session statistics and telemetry logs.
* Export notes as TXT and PDF files.
* Switch between light and dark themes.

---

## ✨ Features

### 🎤 Real-Time Speech Recognition

* Continuous speech recognition.
* Interim and final transcript support.
* Confidence score tracking.
* Automatic speech session restart.

### 🗣 Voice Commands

* `command insert line`
* `command erase word`
* `command title <text>`
* Theme switching commands.

### 📝 Smart Note Editing

* Auto capitalization.
* Title formatting.
* Automatic punctuation handling.
* Live note updates.

### 🔊 Speech Feedback

* Voice confirmations using Speech Synthesis API.

### 📊 Telemetry System

* Session event logging.
* Command execution tracking.
* Success and error monitoring.

### 🌊 Audio Visualization

* Real-time microphone audio wave animation.
* Web Audio API analyser integration.

### 📁 Export Features

* Export notes as TXT.
* Export notes as PDF.
* Download telemetry logs.

### 🎨 UI Features

* Dark/Light theme support.
* Responsive design.
* Session summary view.

---

## 🛠 Tech Stack

### Frontend

* React.js
* JavaScript (ES6+)
* CSS3

### Browser APIs

* Web Speech API
* Speech Synthesis API
* Web Audio API
* MediaDevices API

### Libraries

* jsPDF

### Deployment

* Vercel

---

## 📂 Project Structure

```text
src/
│
├── components/
├── hooks/
├── utils/
├── services/
├── App.jsx
└── main.jsx
```

---

## 📸 Screenshots

### Home Screen(Dark Mode)

<img width="1470" height="834" alt="Screenshot 2026-06-19 at 6 22 10 AM" src="https://github.com/user-attachments/assets/626db4b4-ee85-4658-b5fc-2399333073d7" />


### Home Screen(Light Mode)

<img width="1470" height="831" alt="Screenshot 2026-06-19 at 6 22 23 AM" src="https://github.com/user-attachments/assets/10cc22f5-5f45-4bdc-8685-1aa7321cae28" />


### Voice Dictation

<img width="1470" height="956" alt="Screenshot 2026-06-19 at 6 25 14 AM" src="https://github.com/user-attachments/assets/c003273b-4740-439c-9c25-b62da01b8c8b" />


### Session Summary

<img width="1470" height="831" alt="Screenshot 2026-06-19 at 6 23 10 AM" src="https://github.com/user-attachments/assets/009a2c4b-7c0e-4708-a7e0-c7a2b2d5a2bc" />


### Telemetry Logs

<img width="1467" height="518" alt="Screenshot 2026-06-19 at 6 26 07 AM" src="https://github.com/user-attachments/assets/ecda7881-5268-4d6c-a492-07e6b8a89681" />


---

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/voice-activated-note-commander.git
```

### 2. Navigate to the project folder

```bash
cd voice-activated-note-commander
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the browser

```text
http://localhost:5173
```

---

## 🔐 Browser Requirements

* Google Chrome (recommended)
* Microsoft Edge

**Note:** Microphone permission must be enabled for speech recognition features to work.

---

## 🎯 Future Enhancements

* Multiple language support.
* Cloud note storage.
* User authentication.
* AI-generated note summaries.
* Voice command customization.
* Database integration.

---

## 👩‍💻 Author

**Jui Sudhir Tawde**

---
