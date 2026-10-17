# TriageX 2.0 — Predictive Customer Support Triage & Sentiment Router
### Smart India Hackathon / Hello World 2026 | Team TriageX (Advanced Track - PS 4)

---

## 🌟 Overview
**TriageX** is an enterprise-grade, full-stack AI-driven customer support triage and sentiment-routing platform. Instead of primitive first-come, first-served (FIFO) queues, TriageX analyzes customer sentiment, emotional urgency, and plan tier in real-time, calculating an **Explainable Priority Score (0–100)** to route tickets to Senior Staff, Support Agents, or automated Knowledge Base deflection.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | Ultra-responsive dark enterprise UI with real-time NLP typing preview |
| **Backend** | Python FastAPI (Async REST + WebSockets) | High-throughput async API handling live ticket ingestion and queue broadcasts |
| **NLP Engine** | VADER Sentiment Analysis + Intent Regex | Evaluates frustration index, shouting detectors, outage indicators, and deadlines |
| **Database** | SQLite + Thread-Safe Connection Pool | Persistent tickets, audit logs, user profiles, and knowledge base rules |
| **Realtime** | Native Full-Duplex WebSockets | Broadcasts new tickets and dynamic recalculations without manual page refreshes |

---

## ⚡ How to Run

### Step 1: Open Terminal in Project Directory
```bash
cd /Users/abhishekkanadje7/.gemini/antigravity/scratch/triagex-fullstack
```

### Step 2: Launch with One Single Command
```bash
./start.sh
```

This automatically:
1. Launches the **Python FastAPI Backend** on `http://127.0.0.1:8000`
2. Launches the **Vite React Frontend** on `http://localhost:5173`
3. Initializes the SQLite database and seeds 5 realistic test tickets

---

## 🎯 Evaluator Demo Script (How to Present to Judges)

### Step 1: Open `http://localhost:5173`
Show the **Live Agent Queue**. Point out:
- Tickets are sorted by **Priority Score (0–100)**, NOT by arrival time (FIFO).
- Critical tickets ($\ge 70$) have a pulsing red glow and are escalated to **Senior Agent**.

### Step 2: Demonstrate "Explainable AI (XAI)"
Click the **"Explain AI"** button on ticket `TX-901`:
- Show the judges the point-by-point breakdown:
  - **Frustration Score (40%)**: compound sentiment, exclamation shouting, hostile keywords.
  - **Urgency Score (40%)**: outage triggers like `down`, `payment failed`.
  - **Customer Value (20%)**: Enterprise Plan Tier (100 pts).
- Show the **AI Auto-Suggested Response** ready for the agent to send in 1 click.

### Step 3: Switch to "Customer Portal" & 1-Click Scenarios
Click **"Customer Portal"** in the top navigation:
- Click the top button: **"🔥 Critical Enterprise Outage"**.
- Watch the **Live NLP Radar** update in real-time as the text is loaded:
  - Priority jumps to **~95/100**.
  - Route predicts **Senior Agent**.
- Click **"Submit Ticket"**:
  - Immediately, a WebSocket notification pings across all open screens!
  - Switch back to the **Live Queue** tab: The new ticket is at the very top of the list!

### Step 4: Demonstrate Knowledge Base Auto-Deflection
- In the Customer Portal, click **"💡 Routine Password Reset FAQ"**.
- Click **"Submit Ticket"**.
- Show the judges: It was **instantly Auto-Resolved by the AI Bot in 0 seconds**, without bothering any human agent!

### Step 5: Switch to "Admin & Weights"
- Show the sliders for $W_1$ (Frustration), $W_2$ (Urgency), and $W_3$ (Customer Value).
- Adjust the sliders and click **"Apply & Recalculate Live Queue"**.
- Show how the entire SQLite database is recalculated on the fly and pushed live over WebSockets.

---

## 👥 Pre-Configured Demo Accounts (1-Click Switcher)

Click **"Switch Role"** in the top-right navbar to test any persona:
1. **Rahul Deshmukh (Admin)** — `admin@triagex.ai` (Password: `admin123`)
2. **Pooja Sharma (Senior Agent)** — `pooja.senior@triagex.ai` (Password: `senior123`)
3. **Vikas Patil (Support Agent)** — `vikas.agent@triagex.ai` (Password: `agent123`)
4. **Abhishek Kanadje (Apex Corp)** — `abhishek@apexcorp.com` (Password: `client123`)
5. **Neha Kulkarni (Startuply)** — `neha@startuply.io` (Password: `client123`)
