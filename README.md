# 🚀 TriageX — Predictive Customer Support Triage & Sentiment Router
### Smart India Hackathon / Hello World 2026 | PS 4: AI Support Intelligence
[![Languages](https://img.shields.io/badge/Languages-Python%20%7C%20JavaScript%20%7C%20HTML%20%7C%20CSS-blue.svg)](#-technology-stack)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-success.svg)](https://abhishekkanadje7.github.io/Hello-World-Hackathon/)
[![Cloud Ready](https://img.shields.io/badge/Cloud-Render_Ready-blueviolet.svg)](#-cloud-deployment-render)

---

## 🌟 Executive Summary
**TriageX** is a production-grade AI-powered triage and sentiment routing system that replaces inefficient first-come, first-served (FIFO) ticket queues. Using multi-factor Natural Language Processing (NLP), TriageX computes an **Explainable Priority Score (0–100)** in real-time, considering:
1. **Frustration & Emotional Sentiment** (VADER NLP + hostility keyword boosters)
2. **Issue Urgency & Intent** (Financial loss, outages, critical keywords)
3. **Customer Account Tier** (VIP, Premium, Regular)

Tickets are routed dynamically with binding SLA deadlines to **Senior Engineers**, **Support Agents**, or deflected immediately via **Knowledge Base Automated FAQ Resolution**.

---

## 🗺️ System Architecture & Data Flow

The following sequence illustrates how an incoming customer issue is processed end-to-end:

```
[ Customer Submission ]
         │ (Ticket Subject & Description)
         ▼
[ NLP Triage Engine ] (backend/app/nlp_engine.py)
   ├── 1. VADER Sentiment Analysis (Frustration Compound)
   ├── 2. Urgency Lexicon Matching (Outage, Payment, Security)
   └── 3. Knowledge Base Matching (backend/app/kb_engine.py)
         │
         ▼
[ Scoring & SLA Router ]
   ├── Composite Score (0 - 100) = (Frustration * Wf) + (Urgency * Wu) + (Account * Wv)
   ├── Knowledge Base Match? ──────► [ Auto-Resolve & System FAQ Reply ]
   ├── Score ≥ 70 (Critical)? ────► [ Senior Agent Queue ] (15-min SLA Target)
   └── Score < 70 (Standard)? ────► [ Standard Agent Queue ] (1-hour to 4-hour SLA)
         │
         ▼
[ Real-Time Sync ] (WebSocket Broadcast / In-Memory Mock Engine)
   ├── In-App Live Notifications dispatched to active agents
   ├── Live SLA countdown timers ticking on customer & agent dashboards
   └── Agent claims ticket, replies with canned templates, or resolves issue
         │
         ▼
[ Customer Resolution & CSAT ]
   ├── Customer receives instant resolution notification
   └── Submits 1-to-5 Star CSAT Rating + Qualitative Feedback
         │
         ▼
[ Admin Telemetry & Governance ] (backend/app/main.py)
   ├── Real-time Resolution Rate & SLA Compliance Analytics
   ├── NLP Weight Tuning Sliders & Audit Logs
   └── CSV / JSON Export of full incident telemetry
```

---

## 📂 Repository File Structure & Module Responsibilities

The codebase is organized with clear separation of concerns across 4 core languages (**Python, JavaScript, HTML, CSS**):

```
├── backend/
│   └── app/
│       ├── __init__.py          # Python package initializer
│       ├── auth.py              # PBKDF2 password hashing, JWT creation & RBAC security checks
│       ├── config.py            # Global settings, SLA targets, Admin credentials & weights
│       ├── database.py          # SQLite schema, tables (tickets, users, replies, canned, logs) & seeds
│       ├── kb_engine.py         # Knowledge base engine, keyword matcher & auto-replies
│       ├── models.py            # Pydantic schemas for data validation, requests & responses
│       ├── nlp_engine.py        # VADER sentiment analysis, urgency detection & explainability
│       └── main.py              # FastAPI application, REST endpoints, WebSockets & SPA serving
│
├── frontend/
│   ├── index.html               # Main HTML entrypoint with responsive viewport & meta tags
│   ├── src/
│   │   ├── main.jsx             # React application bootstrap & root render
│   │   ├── App.jsx              # Main router, route definitions & notification provider
│   │   ├── api.js               # Unified API client with automatic offline fallback to mockEngine
│   │   ├── mockEngine.js        # Pure in-browser simulation engine (for GitHub Pages demo)
│   │   ├── index.css            # Custom CSS utilities, typography & scrollbar rules
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Clean, professional navigation bar with role badges & links
│   │   │   ├── Footer.jsx       # Global application footer with project attribution
│   │   │   ├── NotificationBell.jsx # Live dropdown bell with unread badges & click-to-read
│   │   │   └── PriorityBadge.jsx    # Visual urgency & sentiment indicator badge
│   │   └── pages/
│   │       ├── LandingPage.jsx  # Public hero page with live interactive score simulator
│   │       ├── LoginPage.jsx    # Professional customer & staff sign-in form with security lockout
│   │       ├── RegisterPage.jsx # Public customer self-registration with live password meter
│   │       ├── CustomerPortal.jsx # Customer ticket creation, SLA countdown & 5-star CSAT
│   │       ├── AgentPortal.jsx  # Agent queue with 1-click claim, canned replies & internal notes
│   │       ├── AdminDashboard.jsx # Admin telemetry, user provisioning, weights & audit logs
│   │       └── ProfilePage.jsx  # User personal settings & security credentials update
│   ├── package.json             # Frontend dependencies & Vite configuration
│   └── vite.config.js           # Build settings & base URL for GitHub Pages
│
├── .gitattributes               # Language statistics guard (Python, JS, HTML, CSS)
├── .gitignore                   # Excludes venv, sqlite databases, node_modules & temp files
├── Dockerfile                   # Multi-stage production container for Render / Cloud Run
├── README.md                    # Complete project documentation & architectural flow
├── render.yaml                  # Declarative Infrastructure-as-Code for Render deployment
├── requirements.txt             # Python backend dependencies (FastAPI, Uvicorn, VADER, PyJWT)
├── start.sh                     # Single-command local startup script (launches backend & frontend)
├── build.sh                     # Production build script for frontend bundle
├── deploy-gh-pages.sh           # Automated deployment pipeline to GitHub Pages
└── test_suite.py                # Consolidated master verification test suite (100% pass)
```
---

## 💻 Technology Stack

Strictly focused on four foundational, industry-standard web languages:
- **Python**: FastAPI backend, VADER Sentiment Analysis, SQLite ORM, PyJWT authentication, and asyncio WebSocket feeds.
- **JavaScript**: React 19, Vite, Tailwind CSS / Lucide icons, unified API client, and dual-mode in-browser simulation.
- **HTML5**: Semantic markup, accessible inputs, and modal dialogues.
- **CSS3**: Professional enterprise light theme, responsive flex/grid layouts, clean typography, and smooth transitions.

---

## ⚡ How to Run Locally

### Option 1: One-Click Startup (Recommended)
Clone the repository and run the automated startup script:
```bash
git clone https://github.com/abhishekkanadje7/Hello-World-Hackathon.git
cd Hello-World-Hackathon
./start.sh
```
- **Web Application**: `http://localhost:5173`
- **FastAPI Backend**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Live WebSocket Feed**: `ws://127.0.0.1:8000/ws`

### Option 2: Run Automated Verification Tests
Run the consolidated master test suite to verify all endpoints, security rules, and triage pipelines:
```bash
python3 test_suite.py
```
*(Tests RBAC, role sanitization, VADER scoring, critical escalations, claim/release, CSAT feedback, canned responses, and admin telemetry with 100% pass rate).*

---

## ☁️ Cloud Deployment (Render)

TriageX includes native support for one-click deployment on **Render**:
1. Connect your GitHub repository to Render (`render.yaml` is pre-configured).
2. Render will automatically detect the Python environment and build the frontend SPA into the FastAPI static directory.
3. Set the following environment variables if customizing:
   - `ADMIN_EMAIL`: `abhishekkanadje7@gmail.com`
   - `ADMIN_PASSWORD`: `Abhi*2007...`
   - `JWT_SECRET`: Any random 32-character string

---

## 🌐 Live Prototype & Links
- **GitHub Repository**: [https://github.com/abhishekkanadje7/Hello-World-Hackathon](https://github.com/abhishekkanadje7/Hello-World-Hackathon)
- **Live Demo (GitHub Pages)**: [https://abhishekkanadje7.github.io/Hello-World-Hackathon/](https://abhishekkanadje7.github.io/Hello-World-Hackathon/)

---
*Built with ❤️ for Hello World 2026 / Smart India Hackathon by Team TriageX.*
