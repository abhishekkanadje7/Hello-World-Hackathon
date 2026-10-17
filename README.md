# TriageX 2.1 — Predictive Customer Support Triage & Sentiment Router
### Smart India Hackathon / Hello World 2026 | Team TriageX (Advanced Track - PS 4)

---

## 🌟 Overview
**TriageX** is an enterprise-grade AI-powered customer support triage and sentiment routing system. Instead of primitive first-come, first-served (FIFO) queues, TriageX analyzes customer sentiment, emotional urgency, and account plan value in real-time, calculating an **Explainable Priority Score (0–100)** to route tickets to Senior Engineers, Support Agents, or automated Knowledge Base deflection with binding SLA targets.

---

## 🔐 Account Rules & Role-Based Access Control (RBAC)

1. **Customers**:
   - Can register publicly on `/register`.
   - Public registration **always** creates role `customer` with customer type `Regular`.
   - The server strictly ignores any client-supplied role or customer type. Only an admin can promote accounts to Premium or VIP.
   - Customers see and create **only their own tickets**; the customer type is bound securely from their account profile.
2. **Admin**:
   - Exactly **one fixed admin account**, bootstrapped automatically at first startup if no admin exists.
   - Credentials configured via environment variables `ADMIN_EMAIL` and `ADMIN_PASSWORD` (defaults: `admin@triagex.com` / `Admin@123`).
   - There is no public way to register as an admin.
3. **Support Agents**:
   - Cannot self-register. Created and provisioned exclusively by the admin.
   - Must change temporary password upon first login (`must_change_password`).
   - Senior Agents see **Critical** tier tickets ($\ge 70$) + assigned tickets.
   - Standard Agents see **Standard** ($40-69$) and **Routine** ($<40$) tickets + assigned tickets.
4. **Security Lockout & Headers**:
   - 5 consecutive failed login attempts locks the account for 5 minutes.
   - JWT tokens valid for 12 hours with `Authorization: Bearer <token>` header.
   - Internal notes (`is_internal = True`) are hidden from customers and visible only to agents and admins.

---

## 👥 Seeded Demo Accounts

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Admin** | System Administrator | `admin@triagex.com` | `Admin@123` | Full system control & weights tuning |
| **Senior Agent** | Pooja Sharma | `senior@triagex.com` | `Agent@123` | Senior Engineer (Critical Tier) |
| **Standard Agent** | Vikas Patil | `agent@triagex.com` | `Agent@123` | Support Agent (Standard / Routine) |
| **Customer (VIP)** | Abhishek Kanadje | `customer@triagex.com` | `Customer@123` | VIP Plan (100 baseline pts) |
| **Customer (Premium)** | Neha Kulkarni | `neha@startuply.io` | `Customer@123` | Premium Plan (60 baseline pts) |
| **Customer (Regular)** | Siddharth Joshi | `siddharth@gmail.com` | `Customer@123` | Regular Plan (20 baseline pts) |

> ⚠️ **Note**: When upgrading from earlier versions, delete `backend/triagex.db` so the database recreates all tables fresh.

---

## 🚀 How to Run

### Step 1: Start Platform (One Single Command)
```bash
./start.sh
```
- **Frontend App**: `http://localhost:5173`
- **Backend REST API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Live WebSocket Feed**: `ws://127.0.0.1:8000/ws`

### Step 2: Run Automated Backend Tests
```bash
# Run C1 Suite (13 tests - Auth, RBAC, Customer Portal, VADER)
./venv/bin/python3 test_c1_backend.py

# Run C2 Suite (14 tests - Agent Portal, Admin Console, KB CRUD, SLA engine)
./venv/bin/python3 test_c2_backend.py

# Run C3 Suite (9 tests - Pagination, Notifications, CSAT, Canned Replies, Profile)
./venv/bin/python3 test_c3_backend.py
```

---

## 🗺️ Application Routes

| Path | Access | Description |
|---|---|---|
| `/` | Public | Hero landing page with live interactive score simulator |
| `/login` | Public | Sign in with 1-click demo logins & failed attempt lockout protection |
| `/register` | Public | Customer registration with password strength meter (forces Regular customer) |
| `/change-password` | Authenticated | Password change with current verification & strength meter |
| `/profile` | Authenticated | User profile page to manage personal display name and account tier |
| `/customer/new` | Customer | Submit ticket with character counter & 3 quick example presets |
| `/customer/tickets` | Customer | Table of customer's own tickets with pagination, status, and priority badges |
| `/customer/tickets/:id` | Customer | Ticket workspace, SLA target, 5-star CSAT rating, and conversation thread |
| `/agent` | Agent, Admin | Agent triage queue with 4 stat cards, 3 tabs, SLA countdown, and 1-click claim |
| `/agent/tickets/:id` | Agent, Admin | Agent ticket workspace with internal staff notes, canned replies (`/` shortcuts), and KB |
| `/admin` | Admin | Full Admin Console (Overview analytics, All Tickets + CSV export, Users & Agents, KB FAQs, Engine Settings & Sliders, System Audit Log) |
| `/dashboard` | Agent, Admin | Live priority queue, explainable AI modal, and admin controls |

---

## 🌐 Live Prototype & Repository Links
- **GitHub Repository**: [https://github.com/abhishekkanadje7/Hello-World-Hackathon](https://github.com/abhishekkanadje7/Hello-World-Hackathon)
- **Live Demo (GitHub Pages)**: [https://abhishekkanadje7.github.io/Hello-World-Hackathon/](https://abhishekkanadje7.github.io/Hello-World-Hackathon/)


