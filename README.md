# 🧠 AI Meeting Assistant

An intelligent meeting copilot that listens to conversations, generates real-time suggestions, and assists with contextual chat responses.

---

## 🚀 Overview

AI Meeting Assistant is a full-stack application that captures live speech, converts it into text, and uses AI to provide:

* 📝 Live transcript of conversations
* 💡 Context-aware suggestions (questions, insights, follow-ups)
* 💬 Interactive chat assistant based on conversation context
* ⚙️ Customizable prompts and settings
* 📦 Export session data

The system is designed to feel like a real-time assistant that helps users stay productive during discussions.

---

## 🏗️ Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS

### Backend

* Django
* Django REST Framework

### AI Models

* Whisper (speech-to-text)
* GPT-based model (for suggestions and chat)

---

## 📂 Project Structure

```
twinMind/
├── frontend/   # Next.js app
└── backend/    # Django API server
```

---

## ⚙️ Setup Instructions

Follow these steps to run the project locally.

---

### 🔧 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-meeting-assistant.git
cd ai-meeting-assistant
```

---

## 🖥️ Backend Setup (Django)

### 1. Navigate to backend

```bash
cd backend
```

### 2. Create virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate   # Mac/Linux
# OR
.venv\Scripts\activate      # Windows
```

---

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Create environment file

```bash
cp .env.example .env
```

Add your API key:

```env
GROQ_API_KEY=your_api_key_here
```

---

### 5. Run migrations

```bash
python manage.py migrate
```

---

### 6. Start backend server

```bash
python manage.py runserver
```

Backend will run on:

```
http://127.0.0.1:8000
```

---

## 🌐 Frontend Setup (Next.js)

### 1. Open new terminal and go to frontend

```bash
cd frontend
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Create environment file

```bash
cp .env.example .env.local
```

Update API URL:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

### 4. Start frontend

```bash
npm run dev
```

Frontend will run on:

```
http://localhost:3000
```

---

## 🧪 How It Works

1. User starts recording via mic
2. Audio is sent to backend for transcription
3. Transcript is updated in chunks
4. Suggestions are generated based on recent context
5. User can:

   * click suggestions
   * ask custom questions
6. Chat assistant responds using conversation context

---

## 🎯 Key Features

* Real-time transcription (chunk-based)
* Context-aware AI suggestions
* Interactive chat assistant
* Prompt customization
* Clean and responsive UI
* Session export

---

## ⚠️ Notes

* Ensure microphone permissions are enabled in your browser
* Backend must be running before starting frontend
* API keys are required for AI features

---

## 📌 Future Improvements

* Streaming transcription
* Multi-speaker detection
* Persistent session storage
* Collaboration features

---

## 👨‍💻 Author

Built with focus on real-time AI interaction and clean UX.

---
