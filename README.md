# 🤟 SignTube: Sign Language for YouTube

> **Making the web more accessible, one video at a time.**

SignTube is an intelligent accessibility tool that automatically generates sign language animations for YouTube videos in real-time. By combining the power of OpenAI's Whisper for transcription and spaCy for NLP, we translate spoken English into grammatically correct American Sign Language (ASL), displayed via seamless overlays.

---

## ✨ Features

- **📺 Real-Time Translation**: Instantly translates YouTube video audio into sign language.
- **🧠 Smart ASL Grammar**: Not just word-for-word! Uses **spaCy** to reorder sentences into proper ASL structure (Time → Subject → Verb → Object).
- **🗣️ AI Transcription**: Leverages **OpenAI Whisper** for state-of-the-art speech-to-text accuracy.
- **🔌 Browser Extension**: A plug-and-play Chrome extension that integrates directly into the YouTube player.
- **🚀 Modern Web App**: A beautiful Next.js frontend to explore and manage the platform.
- **🎭 3D & GIF Support**: Uses a rich library of GIFs and 3D avatar fallbacks to ensure every word is signed.

---

## 🛠️ Tech Stack

### **Frontend & Extension**
- **Framework**: [Next.js 16](https://nextjs.org/) & [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Extension**: Manifest V3 (Chrome/Edge)

### **Backend & AI**
- **Server**: Python [Flask](https://flask.palletsprojects.com/)
- **AI/ML**: 
  - [OpenAI Whisper](https://github.com/openai/whisper) (Speech-to-Text)
  - [spaCy](https://spacy.io/) (NLP & Grammar Logic)
- **Media Processing**: [yt-dlp](https://github.com/yt-dlp/yt-dlp) & [FFmpeg](https://ffmpeg.org/) (Audio extraction)

---

## 🚀 Getting Started

### 1. Backend Setup
The backend handles the heavy lifting of downloading audio, transcribing it, and processing the NLP.

```bash
cd backend
# Install dependencies
pip install -r requirements.txt
# Download the spacy model
python -m spacy download en_core_web_trf
# Run the server
python app.py
```
*Server runs on `http://localhost:5001`*

### 2. Frontend Setup
The web interface for the project.

```bash
cd frontend
# Install dependencies
npm install
# Run the dev server
npm run dev
```
*App runs on `http://localhost:3000`*

### 3. Extension Setup
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `extension` folder in this repository.
5. Open a YouTube video and watch the magic happen! ✨

---

## 📂 Project Structure

- **/backend**: Flask server, Whisper integration, and NLP logic.
- **/frontend**: Next.js web application.
- **/extension**: Chrome extension content scripts and manifest.
- **/gif**: Asset library for sign language visualizations.
- **/animation**: 3D animation assets.

---

