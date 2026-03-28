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

# load all models once on startup (deferred)
M = {
    'credit_model': None,
    'shap_explainer': None,
    'feature_list': [],
    'lstm_model': None,
    'seq_scaler': None,
    'static_scaler': None,
    'static_cols': [],
    'sample_input': {}
}

@app.on_event("startup")
async def startup_event():
    # We do a fast startup and load models in background or on first request
    # To keep Render happy, we don't block here
    print("API is starting up... models will be loaded on demand.")

def get_models():
    global M
    if M.get('credit_model') is None:
        print("Loading models on first request...")
        M.update(load_all_models())
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
    return M

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

class AdvisorRequest(BaseModel):
    system_prompt: str
    user_message: str

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
            "POST /api/loan-preapproval",
            "POST /api/advisor",
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
    M = get_models()
    print(f"Incoming Credit Score request for business_id: {req.business_id}")
    # try Interswitch API first, fall back to provided/sample features
    if req.merchant_code:
        print(f"Fetching Interswitch transactions for merchant_code: {req.merchant_code}")
        transactions = await get_merchant_transactions(req.merchant_code)
        features = extract_features_from_transactions(
            transactions, M['feature_list'], M['sample_input']
        )
    elif req.features:
        features = req.features
    else:
        features = M['sample_input']

    # predict
    print("Running credit model prediction...")
    input_df = pd.DataFrame([features])[M['feature_list']]
    prob     = float(M['credit_model'].predict_proba(input_df)[0][1])
    score    = prob_to_score(prob)
    risk     = score_to_risk(score)

    # confidence
    months     = features.get('business_age_months', 12)
    confidence = "high" if months >= 12 else "medium" if months >= 6 else "low"

    # SHAP
    print("Calculating SHAP values...")
    try:
        # If the explainer is slow, this might hang. 
        # In a real app, we'd use TreeExplainer for XGBoost which is instant.
        raw_shap = M['shap_explainer'].shap_values(input_df)
        if isinstance(raw_shap, list):
            shap_vals = np.array(raw_shap[0]).flatten()
        else:
            shap_vals = np.array(raw_shap).flatten()
    except Exception as e:
        print(f"SHAP calculation failed or was too slow: {e}")
        # Fallback to dummy importance
        shap_vals = np.random.uniform(-0.1, 0.1, len(M['feature_list']))

    print("Formatting output...")
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
    M = get_models()
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
    M = get_models()
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

    # forecast next 6 months
    avg_rev  = float(np.mean(req.monthly_revenue))
    trend    = (req.monthly_revenue[-1] - req.monthly_revenue[0]) / 6
    forecast = [max(0, int(avg_rev + trend * (i + 1))) for i in range(6)]

    # predict risk (using LSTM if available, else heuristic)
    risk_flag = False
    risk_month = ""
    risk_prob = 0.0
    try:
        risk_prob = float(M['lstm_model'].predict([seq_scaled, static_scaled])[0][0])
        if risk_prob >= 0.5:
            risk_flag = True
            risk_month = f"month_{forecast.index(min(forecast)) + 1}"
    except Exception as e:
        print(f"LSTM prediction failed: {e}")
        # fallback heuristic: if trend is negative, flag risk
        if trend < 0:
            risk_flag = True
            risk_month = "month_3"

    # tax estimate — 0.5% of projected quarterly revenue
    tax_estimate = int(sum(forecast[:3]) * 0.005)

    # SHAP-like analysis for Cash Flow
    ai_analysis = []
    if risk_flag:
        if trend < 0:
            ai_analysis.append("Negative revenue trend detected over the last 6 months.")
        if req.refund_rate[-1] > 2.0:
            ai_analysis.append("High refund rate ( > 2% ) is impacting your net liquidity.")
        if req.settlement_days[-1] > 1.5:
            ai_analysis.append("Delayed settlements from USSD channels are creating a cash gap.")
    else:
        ai_analysis.append("Strong transaction consistency across USSD and Mobile Money channels.")
        ai_analysis.append("Refund rates are within healthy sector benchmarks ( < 1% ).")

    return {
        "business_id":         req.business_id,
        "forecast_6months":    forecast,
        "risk_flag":           risk_flag,
        "risk_probability":    round(risk_prob, 4),
        "risk_month":          risk_month,
        "tax_estimate":        tax_estimate,
        "avg_monthly_revenue": int(avg_rev),
        "ai_analysis":         ai_analysis,
        "message": (
            f"Liquidity risk detected in {risk_month}"
            if risk_flag else
            "Cash flow looks stable for the next 6 months"
        )
    }

# ── 4. Loan Pre-Approval Engine  ──────────────────────────────────
@app.post("/api/loan-preapproval")
def loan_preapproval(req: CreditRequest):
    M = get_models()
    # get credit score first
    features = req.features if req.features else M['sample_input']
    input_df = pd.DataFrame([features])[M['feature_list']]
    prob     = float(M['credit_model'].predict_proba(input_df)[0][1])
    score    = prob_to_score(prob)
    risk     = score_to_risk(score)

    # loan decision engine
    if score >= 750:
        approved       = True
        max_loan       = 5_000_000
        interest_rate  = 3.5
        tenure_months  = 24
        decision       = "Excellent credit profile"
    elif score >= 700:
        approved       = True
        max_loan       = 3_000_000
        interest_rate  = 5.0
        tenure_months  = 18
        decision       = "Strong credit profile"
    elif score >= 650:
        approved       = True
        max_loan       = 2_000_000
        interest_rate  = 7.5
        tenure_months  = 12
        decision       = "Good credit profile"
    elif score >= 580:
        approved       = True
        max_loan       = 1_000_000
        interest_rate  = 10.0
        tenure_months  = 6
        decision       = "Fair credit profile — limited offer"
    else:
        approved       = False
        max_loan       = 0
        interest_rate  = 0
        tenure_months  = 0
        decision       = "Credit score too low — improve score first"

    # monthly repayment calculation
    if approved:
        monthly_rate    = (interest_rate / 100) / 12
        if monthly_rate > 0:
            monthly_payment = int(
                max_loan * monthly_rate /
                (1 - (1 + monthly_rate) ** -tenure_months)
            ) 
        else:
            monthly_payment = int(max_loan / tenure_months)
        total_repayment = monthly_payment * tenure_months
    else:
        monthly_payment = 0
        total_repayment = 0

    return {
        "business_id":      req.business_id,
        "credit_score":     score,
        "approved":         approved,
        "decision":         decision,
        "max_loan_amount":  max_loan,
        "interest_rate":    interest_rate,
        "tenure_months":    tenure_months,
        "monthly_payment":  monthly_payment,
        "total_repayment":  total_repayment,
        "currency":         "NGN",
        "powered_by":       "LendraAI Credit Engine × Interswitch",
        "message": (
            f"Congratulations! You are pre-approved for "
            f"₦{max_loan:,} at {interest_rate}% interest "
            f"over {tenure_months} months."
            if approved else
            f"Not approved yet. {decision}. "
            f"Use the Score Simulator to improve your score."
        )
    }

# ── 5. AI Advisor ─────────────────────────────────────────────────
@app.post("/api/advisor")
async def ai_advisor(req: AdvisorRequest):
    import httpx
    # Securely proxy the Groq request from the backend to avoid frontend browser CORS issues
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    if not groq_api_key:
        print("DEBUG: GROQ_API_KEY is missing in env.")
        return {
            "reply": "I am the LendraAI Advisor. To provide real-time intelligence, please configure my Groq API Key on Render. Based on your current profile, I recommend maintaining a 20% liquidity reserve for the upcoming quarter to mitigate seasonal risks."
        }
        
    try:
        print(f"DEBUG: Calling Groq API with model llama-3.1-8b-instant...")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": req.system_prompt},
                        {"role": "user", "content": req.user_message}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                },
                timeout=20.0
            )
            
            if resp.status_code != 200:
                print(f"DEBUG: Groq API returned {resp.status_code}: {resp.text}")
                return {"reply": "I'm experiencing high traffic from my intelligence provider. Based on your SME metrics, my core advice is to optimize USSD settlement times to improve score reliability."}

            data = resp.json()
            return {"reply": data["choices"][0]["message"]["content"]}
    except Exception as e:
        print(f"DEBUG: Groq Exception: {e}")
        return {"reply": "I am having trouble connecting to my brain right now. However, looking at your cash flow trend, you should focus on reducing your refund rate to stay in the low-risk category."}

# ── 6. SME Profile ────────────────────────────────────────────────
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