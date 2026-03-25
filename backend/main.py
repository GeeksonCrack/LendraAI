# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import numpy as np
import pandas as pd
import os

from model_loader import load_all_models
from interswitch import (
    get_merchant_transactions,
    get_merchant_profile,
    extract_features_from_transactions
)

# ── Startup ───────────────────────────────────────────────────────
app = FastAPI(title="LendraAI API", version="1.0.0",
              description="Intelligent Financial Layer for African SMEs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# load all models once on startup
M = load_all_models()

# ── Override sample input with complete hardcoded values ──────────
M['sample_input'] = {
    'PAY_0':          0,
    'PAY_2':          0,
    'PAY_3':          0,
    'PAY_4':          0,
    'PAY_5':          0,
    'PAY_6':          0,
    'high_risk':      0,
    'months_delayed': 1,
    'max_pay_delay':  1,
    'avg_pay_delay':  0.3,
    'pay_trend':      0,
    'LIMIT_BAL':      200000.0,
    'credit_util':    0.45,
    'payment_ratio':  0.75,
    'avg_bill_amt':   85000.0,
    'avg_pay_amt':    65000.0,
    'bill_trend':     -2000.0,
    'limit_per_age':  5000.0,
    'business_age_months': 12,
}

# ── Helpers ───────────────────────────────────────────────────────
def prob_to_score(prob: float) -> int:
    return int(round(300 + (1 - prob) * 550))

def score_to_risk(score: int) -> str:
    if score >= 700: return "low"
    if score >= 580: return "medium"
    return "high"

def get_improvement_tips(shap_df) -> list:
    tips = []
    top = shap_df.head(3)['feature'].tolist()
    tip_map = {
        'months_delayed':  "Reduce payment delays — pay all bills on time for 3+ months",
        'high_risk':       "Avoid 2+ month payment delays — this is your biggest risk factor",
        'max_pay_delay':   "Your worst payment month is hurting your score — clear overdue bills",
        'avg_pay_delay':   "Improve average payment consistency across all accounts",
        'credit_util':     "Reduce credit utilisation — aim for below 70% of your limit",
        'PAY_0':           "Your most recent payment status needs improvement",
        'payment_ratio':   "Increase the amount you pay each month relative to your bill",
    }
    for feature in top:
        if feature in tip_map:
            tips.append(tip_map[feature])
    if not tips:
        tips.append("Maintain your current payment behaviour — you are in good standing")
    return tips

# ── Request schemas ───────────────────────────────────────────────
class CreditRequest(BaseModel):
    business_id: str
    merchant_code: Optional[str] = None
    features: Optional[Dict] = None

class SimulateRequest(BaseModel):
    business_id: str
    changes: Dict
    features: Optional[Dict] = None

class ForecastRequest(BaseModel):
    business_id: str
    monthly_revenue: List[float]      # 6 values
    ussd_count: List[float]           # 6 values
    mobile_money: List[float]         # 6 values
    refund_rate: List[float]          # 6 values
    settlement_days: List[float]      # 6 values
    static_features: Optional[Dict] = None

# ── Endpoints ─────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "LendraAI API is live ",
        "version": "1.0.0",
        "endpoints": [
            "POST /api/credit-score",
            "POST /api/simulate-score",
            "POST /api/cash-flow-forecast",
            "GET  /api/sme/{business_id}",
            "GET  /health"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "models_loaded": True}

# ── 1. Credit Score ───────────────────────────────────────────────
@app.post("/api/credit-score")
async def credit_score(req: CreditRequest):
    # try Interswitch API first, fall back to provided/sample features
    if req.merchant_code:
        transactions = await get_merchant_transactions(req.merchant_code)
        features = extract_features_from_transactions(
            transactions, M['feature_list'], M['sample_input']
        )
    elif req.features:
        features = req.features
    else:
        features = M['sample_input']

    # predict
    input_df = pd.DataFrame([features])[M['feature_list']]
    prob     = float(M['credit_model'].predict_proba(input_df)[0][1])
    score    = prob_to_score(prob)
    risk     = score_to_risk(score)

    # confidence
    months     = features.get('business_age_months', 12)
    confidence = "high" if months >= 12 else "medium" if months >= 6 else "low"

    # SHAP
    raw_shap = M['shap_explainer'].shap_values(input_df)
    # TreeExplainer for binary classifiers returns [array_class0, array_class1]
    if isinstance(raw_shap, list):
        shap_vals = np.array(raw_shap[0]).flatten()
    else:
        shap_vals = np.array(raw_shap).flatten()
    shap_df   = pd.DataFrame({
        'feature':    M['feature_list'],
        'shap_value': shap_vals
    }).sort_values('shap_value', ascending=False)

    tips = get_improvement_tips(shap_df)

    return {
        "business_id":            req.business_id,
        "score":                  score,
        "probability_of_default": round(prob, 4),
        "risk_level":             risk,
        "confidence":             confidence,
        "top_factors":            shap_df.head(3)['feature'].tolist(),
        "improvement_tips":       tips,
        "data_source":            "interswitch_api" if req.merchant_code else "synthetic",
        "shap_values": {
            M['feature_list'][i]: round(float(shap_vals[i]), 4)
            for i in range(len(M['feature_list']))
        }
    }

# ── 2. Score Simulator ────────────────────────────────────────────
@app.post("/api/simulate-score")
def simulate_score(req: SimulateRequest):
    base = req.features if req.features else M['sample_input'].copy()

    # base score
    base_df    = pd.DataFrame([base])[M['feature_list']]
    base_prob  = float(M['credit_model'].predict_proba(base_df)[0][1])
    base_score = prob_to_score(base_prob)

    # apply changes
    modified = base.copy()
    for k, v in req.changes.items():
        if k in modified:
            modified[k] = v

    mod_df    = pd.DataFrame([modified])[M['feature_list']]
    mod_prob  = float(M['credit_model'].predict_proba(mod_df)[0][1])
    new_score = prob_to_score(mod_prob)
    diff      = new_score - base_score

    return {
        "business_id":     req.business_id,
        "current_score":   base_score,
        "simulated_score": new_score,
        "improvement":     diff,
        "changes_applied": req.changes,
        "message": (
            f"Making these changes improves your score by {diff} points"
            if diff > 0 else
            "These changes would reduce your score — reconsider"
        )
    }

# ── 3. Cash Flow Forecast ─────────────────────────────────────────
@app.post("/api/cash-flow-forecast")
def cash_flow_forecast(req: ForecastRequest):
    # build sequence (6 x 5)
    seq = np.array([[
        req.monthly_revenue[i],
        req.ussd_count[i],
        req.mobile_money[i],
        req.refund_rate[i],
        req.settlement_days[i],
    ] for i in range(6)])

    # scale
    seq_scaled = M['seq_scaler'].transform(
        seq.reshape(1, -1)).reshape(1, 6, 5)

    static_vals   = req.static_features or {c: 0.0 for c in M['static_cols']}
    static_arr    = np.array([[static_vals.get(c, 0.0) for c in M['static_cols']]])
    static_scaled = M['static_scaler'].transform(static_arr)

    # predict risk
    risk_prob = float(
        M['lstm_model'].predict([seq_scaled, static_scaled])[0][0])
    risk_flag = risk_prob >= 0.5

    # forecast next 6 months
    avg_rev  = float(np.mean(req.monthly_revenue))
    trend    = (req.monthly_revenue[-1] - req.monthly_revenue[0]) / 6
    forecast = [max(0, int(avg_rev + trend * (i + 1))) for i in range(6)]
    risk_month = f"month_{forecast.index(min(forecast)) + 1}"

    # tax estimate — 0.5% of projected quarterly revenue
    tax_estimate = int(sum(forecast[:3]) * 0.005)

    return {
        "business_id":         req.business_id,
        "forecast_6months":    forecast,
        "risk_flag":           risk_flag,
        "risk_probability":    round(risk_prob, 4),
        "risk_month":          risk_month,
        "tax_estimate":        tax_estimate,
        "avg_monthly_revenue": int(avg_rev),
        "message": (
            " Cash flow dip predicted — start saving now"
            if risk_flag else
            " Cash flow looks stable for the next 6 months"
        )
    }

# ── 4. SME Profile ────────────────────────────────────────────────
@app.get("/api/sme/{business_id}")
async def get_sme(business_id: str):
    profile = await get_merchant_profile(business_id)

    # fallback to mock profile for demo
    if not profile:
        profile = {
            "business_id":          business_id,
            "name":                 "Sample Nigerian SME",
            "category":             "retail",
            "months_of_data":       13,
            "confidence":           "high",
            "interswitch_verified": False,
            "note": "Connect merchant_code to pull real Interswitch data"
        }
    return profile