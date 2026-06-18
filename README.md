<div align="center">

<img src="https://img.shields.io/badge/CrisisGrid-Emergency%20Dispatch-A3E635?style=for-the-badge&logo=satellite&logoColor=0F1C23" alt="CrisisGrid" />

# CrisisGrid
### AI-Powered Emergency Dispatch & Triage Platform

[![React](https://img.shields.io/badge/Framework-React%2018-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Build%20Tool-Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Made with Groq](https://img.shields.io/badge/AI-Groq%20LLaMA-F55036?style=flat-square)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet.js-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Turn raw distress calls into structured incident tickets in seconds.**  
AI triage · Live tactical map · Real-time analytics · Vite React SPA

Built for [NextGenHacks 2026](https://nextgenhacks.devpost.com)

</div>

---

## 📸 Screenshots

<img width="1908" height="882" alt="Homepage" src="https://github.com/user-attachments/assets/6509617d-7001-42eb-ae70-baca2933d6be" />
<img width="1908" height="882" alt="Active Grid" src="https://github.com/user-attachments/assets/8c737b09-5d4b-47d4-abb5-1bd51fd001c9" />
<img width="1908" height="882" alt="Ai" src="https://github.com/user-attachments/assets/9c1d16cf-a74c-4546-b8bf-18db846a4e46" />
<img width="1908" height="882" alt="Analysis" src="https://github.com/user-attachments/assets/7bf8a3ad-2a87-4c30-bcc8-fdb8514f5cbd" />

---

## 💡 The Problem

Emergency dispatchers receive raw, unstructured distress calls and have to manually extract location, threat type, severity, and the right response unit under time pressure. CrisisGrid uses AI to turn that raw input into a structured, actionable ticket in seconds.

## ✨ Features

| Module | What it does |
|--------|-------------|
| 🧠 **AI Triage Engine** | Raw distress calls, pasted or dictated, are processed by LLaMA 3 to extract location, GPS, threat type, severity, recommended asset, and ETA |
| 🗺️ **Active Grid** | Live Leaflet.js tactical map — color-coded incident markers, real-time Supabase sync, status updates |
| 📊 **Analytics** | 24-hour incident timeline, severity breakdown, pipeline status doughnut — all from live data |
| 🔒 **Auth & Protection** | Google OAuth via Supabase — operators must be authenticated before accessing the operations center or triage engine |
| 📡 **Commander's SitRep** | One-click AI briefing synthesizing all active incidents on the grid into a tactical summary paragraph |
| 🎙️ **Live Radio Input** | Web Speech API dictation (custom hook) for distress calls entered directly into the triage engine |
| 📱 **Simulate SMS** | Mimics an incoming text-based distress report with an alert notification overlay |
| ☣️ **Mass Casualty Sim** | Seeds the system with a realistic multi-incident scenario for load and layout testing |

---

## 🛠️ Tech Stack

- **Framework**: React 18 (Hooks, Context, State Management)
- **Build Tooling**: Vite 5 (Fast HMR & Dev Server)
- **Styling**: Tailwind CSS 3 (Custom styles for glassmorphism, tickers, and dark mode filters)
- **Database & Auth**: Supabase (PostgreSQL + Auth + Real-time Postgres Changes Subscriptions)
- **AI Triage / SitRep**: Groq API (`llama-3.1-8b-instant`)
- **Maps**: Leaflet.js (Custom map canvas overrides for dark grids)
- **Telemetry Charts**: Chart.js (Encapsulated React hooks with lifecycle teardowns)
- **Voice Input**: Web Speech API
- **Telemetry Lock**: Web Geolocation API

---

## 🗄️ Database Schema

One Supabase table, **`tickets`**, storing:
- `title` (String)
- `location` (String)
- `landmark` (String)
- `subjects` (String)
- `threat` (String)
- `level` (String: 1-3)
- `asset` (String)
- `lat` (Float)
- `lng` (Float)
- `status` (String: pending, en_route, on_scene, resolved)
- `notes` (String)
- `time_string` (Timestamp)
- `id` (UUID - Primary Key)
- `created_at` (Timestamp)

---

## 🚀 Running Locally

### 1. Clone the repository
```bash
git clone https://github.com/immanuel-thomas-j/CrisisGrid.git
cd CrisisGrid
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create an `env/.env` file in the root directory and add your Groq API key:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```
*(Alternatively, you can define `VITE_GROQ_API_KEY` in your system environment or a root `.env` file).*

### 4. Run the development server
```bash
npm run dev
```
Then open `http://localhost:5173`.

### 5. Production build
To build and optimize the project for production deployment:
```bash
npm run build
npm run preview
```

---

## 📄 License

Distributed under the MIT License.

---

<div align="center">
  <sub>Built with ❤️ for NextGenHacks 2026</sub>
</div>
