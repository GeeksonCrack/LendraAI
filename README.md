# LendraAI 

> Intelligent financial layer for African SMEs — powered by Interswitch APIs. 

Built for the **Interswitch × Enyata Buildathon 2025**.

---

## What is LendraAI? 

LendraAI is a high-fidelity, AI-powered financial platform designed to provide African SMEs with the tools they need to scale. We leverage alternative transaction data to bridge the credit gap.

- **ML Credit Scoring** — Real-time risk assessment using XGBoost & SHAP explainability.
- **Predictive Cash Flow** — 6-month revenue forecasting powered by LSTM neural networks.
- **Loan Pre-Approval** — Instant eligibility checks based on intelligent financial profiles.
- **AI Financial Advisor** — Tailored SME growth strategies powered by Llama 3 & Groq.

---

## Team (The Architects)

| Name | Alias | Role | Responsibility |
|------|-------|------|----------------|
| **Agoro Oluwatimilehin** | Drizzy | ML Engineer | Credit Model (XGBoost + SHAP) & Interactive Dashboard UI |
| **Ohine Ivori** | Lucid | Backend Engineer | Robust API Infrastructure & Interswitch Integration |
| **David Akuabue** | Code | ML Engineer | Cash Flow Forecasting Model (LSTM) |

---

## Tech Stack

- **Machine Learning:** Python, XGBoost, SHAP, TensorFlow (LSTM), Scikit-learn
- **Backend:** FastAPI, Python, Uvicorn
- **Frontend:** React (Vite), Tailwind CSS (v4), Lucide Icons, Recharts
- **LLM:** Groq (Llama 3.1) for AI Advisor
- **APIs:** Interswitch Payment & Identity APIs
- **Deployment:** Render (Backend), Vercel (Frontend)

---

## Project Structure

```text
LendraAI/
├── backend/            # FastAPI - Central API Layer
├── frontend/           # React + Vite - Concentrated Dark Dashboard
├── ml_credit/          # XGBoost Model & SHAP Explainer
├── ml_forecasting/     # LSTM Forecasting Model & Scalers
├── docs/               # Technical Documentation & Reports
└── README.md
```

---

## Quick Start

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

---

## Deployment Status

- **Backend:** Live on Render ([https://lendraai.onrender.com](https://lendraai.onrender.com))
- **Frontend:** Live on Vercel
- **Repository:** [https://github.com/GeeksonCrack/LendraAI.git](https://github.com/GeeksonCrack/LendraAI.git)

---

> © 2025 LendraAI. Empowering Smarter Lending with Intelligent Data.
