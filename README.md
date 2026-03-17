# LendraAI 

> Intelligent financial layer for African SMEs — powered by Interswitch APIs.

Built for the **Interswitch × Enyata Buildathon 2025**.

---

## What is LendraAI?

LendraAI is an AI-powered financial platform that gives African SMEs
access to three things they currently lack:

- **Credit scoring** — real-time creditworthiness from transaction history
- **Cash flow forecasting** — predict revenue dips before they happen  
- **Tax alerts** — know your liability before it's too late

Built on Interswitch's Payment and Identity APIs, with explainable AI
(SHAP) so every score comes with a reason — not just a number.

---

## Team

| Role | Responsibility |
|------|---------------|
| agoro oluwatimilehin | Credit scoring model (XGBoost + SHAP) |
| david akhabue | Cash flow forecasting (LSTM) |
| lucid ohine | Backend API + dashboard |

---

## Repo structure

```
lendraai-platform/
├── backend/          # FastAPI — SE owns this
├── ml_credit/        # XGBoost credit model — ML Eng 1
├── ml_forecasting/   # LSTM forecasting — ML Eng 2
├── frontend/         # Dashboard UI — SE owns this
├── docs/             # API contracts, decisions log
└── README.md
```

---

## Status

>  Building starts **March 20, 2025**. Repo is being organised pre-hackathon.

---

## Tech stack

- **ML:** Python, XGBoost, SHAP, LSTM (PyTorch/Keras)
- **Backend:** FastAPI, Python
- **Frontend:** React or Next.js
- **Deploy:** Render / Railway
- **APIs:** Interswitch Payment API, Interswitch Identity API
