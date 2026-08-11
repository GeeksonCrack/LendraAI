# LendraAI — Upgrade Implementation Plan

> **Goal:** Evolve LendraAI from an Interswitch × Enyata Buildathon 2025 demo into a production-grade **SME credit intelligence + cash-flow decisioning platform** for African fintech — powered by real banking data, advanced ML, and financial engineering.

**Status:** Implementation blueprint  
**Audience:** Founders, ML engineers, backend engineers, product  
**Scope:** API replacement, ML/quant upgrades, platform hardening, phased delivery

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Audit](#2-current-state-audit)
3. [Product Vision (Post-Hackathon)](#3-product-vision-post-hackathon)
4. [Real Finance Problems We Solve](#4-real-finance-problems-we-solve)
5. [API Migration: Interswitch → Open Banking](#5-api-migration-interswitch--open-banking)
6. [ML & Financial Engineering Upgrades](#6-ml--financial-engineering-upgrades)
7. [System Architecture Target State](#7-system-architecture-target-state)
8. [Backend / Platform Upgrades](#8-backend--platform-upgrades)
9. [Frontend Product Upgrades](#9-frontend-product-upgrades)
10. [Data Strategy](#10-data-strategy)
11. [Phased Roadmap](#11-phased-roadmap)
12. [Success Metrics & Evaluation](#12-success-metrics--evaluation)
13. [Risks, Compliance & Ethics](#13-risks-compliance--ethics)
14. [Repo Mapping (What Changes Where)](#14-repo-mapping-what-changes-where)
15. [Appendix: API & Model Specs](#15-appendix-api--model-specs)

---

## 1. Executive Summary

### What exists today

LendraAI is a high-fidelity **hackathon prototype** with:

| Module | Current implementation | Production gap |
|--------|------------------------|----------------|
| Credit scoring | XGBoost + SHAP on **UCI Taiwan credit-card features** | Wrong domain; not SME/Africa-native |
| Cash flow | **Linear trend heuristic** for revenue; BiLSTM only for binary risk | No real multi-horizon forecasting |
| Loan engine | Score-tier rules (750→₦5M, etc.) | No PD/LGD/EAD, no pricing, no affordability |
| Data rails | Interswitch OAuth + merchant txs (sandbox) | Weak feature extraction; hackathon-locked |
| Advisor | Groq Llama 3.1 with static context | No tool use, no structured recommendations |
| Platform | Single FastAPI file, no auth, no DB, demo IDs | Not multi-tenant or auditable |

### What we are building

A **full SME financial intelligence stack**:

1. **Open banking data plane** (Mono primary; Paystack/Flutterwave secondary) replacing Interswitch.
2. **Africa-native credit risk models** with survival analysis, calibration, and explainability.
3. **True multi-horizon cash-flow forecasting** (probabilistic time series + scenario optimization).
4. **Financial-engineering loan engine**: risk-based pricing, DSCR/affordability, expected loss, optimal tenure.
5. **Working-capital & liquidity optimization** (cash buffer, inventory/receivables tradeoffs).
6. **Portfolio-level risk** for lenders who consume LendraAI scores.
7. Production platform: auth, multi-tenant, audit logs, model registry, monitoring.

### Non-negotiable principles

- Every upgrade must solve a **real SME or lender pain point**, not just look impressive.
- Models must be **calibrated, backtested, and explainable** enough for credit decisions.
- Replace Interswitch completely; do not leave dual-vendor debt.
- Prefer **probabilistic outputs** (distributions, intervals, PDs) over single point scores.

---

## 2. Current State Audit

### 2.1 Repository map

```text
LendraAI/
├── backend/                 # FastAPI monolith (main.py + interswitch.py + model_loader.py)
├── frontend/                # React + Vite dashboard (Overview, Simulator, CashFlow, Loan, Advisor)
├── ml_credit/               # UCI XGBoost + SHAP; Lending Club CSVs unused in API path
├── ml_forecasting/          # Synthetic Nigerian SME + BiLSTM risk classifier
├── docs/                    # Wireframes only (this file expands technical docs)
└── README.md                # Buildathon positioning
```

### 2.2 Critical technical findings

**A. Interswitch layer (`backend/interswitch.py`)**

- OAuth client-credentials to sandbox/production Interswitch.
- Fetches merchant transactions + profile.
- Feature extraction is **shallow**: averages amounts, maps failed tx ratio → `months_delayed`.
- Falls back to hardcoded sample features constantly in demos.

**B. Credit model (`ml_credit/`)**

- Production path loads `lendraai_uci_model.pkl` — trained on **UCI Credit Card Default** (Taiwan retail revolving credit).
- Features (`PAY_0`…`PAY_6`, `LIMIT_BAL`, `credit_util`, …) are **not** African SME transaction features.
- Lending Club dataset exists but is not wired into the live API.
- SHAP explainer present but can fall back to random noise on failure.

**C. Forecasting gap (`ml_forecasting/` + `main.py`)**

- README claims “6-month revenue forecasting powered by LSTM.”
- **Actual revenue forecast** in `cash_flow_forecast`:

```python
avg_rev = mean(monthly_revenue)
trend = (last - first) / 6
forecast = [avg_rev + trend * (i+1) for i in range(6)]
```

- BiLSTM is a **binary liquidity-risk classifier** (AUC on synthetic labels), not a sequence-to-sequence forecaster.
- Tax estimate is a flat 0.5% of next-quarter revenue (not FIRS/SME tax reality).

**D. Loan pre-approval**

- Pure score buckets → max amount / rate / tenure.
- No cash-flow affordability, no probability of default term structure, no expected loss, no collateral haircuts.
- EMI uses standard amortization only.

**E. Platform**

- No database, auth, rate limits, webhooks, or job queues.
- Models load on first request (Render cold starts).
- Frontend hardcodes `NG-SME-001` and demo fallbacks.

### 2.3 What to keep

- FastAPI surface shape (`/api/credit-score`, `/api/cash-flow-forecast`, `/api/loan-preapproval`, `/api/simulate-score`, `/api/advisor`).
- SHAP / explainability product pattern.
- Score simulator UX concept (counterfactual “what if”).
- Dark dashboard UI system (Card, layout, Recharts).
- Nigerian seasonal intuition from synthetic data notebooks (Sallah, Christmas, school fees).
- Groq advisor as a thin reasoning layer **on top of** structured model outputs.

---

## 3. Product Vision (Post-Hackathon)

### Positioning

> **LendraAI is the credit + liquidity intelligence layer for African SMEs and the lenders who fund them.**

Two customer modes:

| Mode | User | Value |
|------|------|-------|
| **B2B2C (SME app)** | Business owners | Understand score, forecast cash, get pre-approval terms, act on advice |
| **B2B (Lender API)** | MFIs, digital lenders, banks, BNPL | Underwrite SMEs with alternative data, price risk, monitor portfolios |

### Product pillars

1. **Connect** — Bank + payment rails via open banking (not card-acquirer-only).
2. **Score** — Calibrated PD + explainable credit grade.
3. **Forecast** — Probabilistic cash-flow and liquidity runway.
4. **Price & Size** — Risk-based loan offers with affordability constraints.
5. **Optimize** — Working capital, repayment schedules, cash buffers.
6. **Monitor** — Early warning, portfolio drift, model monitoring.

---

## 4. Real Finance Problems We Solve

These are the **problems** upgrades must address — not technology for its own sake.

### P1 — SME credit invisibility

**Problem:** Banks reject SMEs without traditional bureau files or collateral.  
**Solution:** Transaction-based PD models + alternative features (settlement consistency, revenue volatility, supplier concentration, bounce rates).  
**Advanced methods:** Gradient boosting + survival models + calibration + SHAP/counterfactuals.

### P2 — Liquidity surprises kill SMEs

**Problem:** Owners see “average monthly revenue” but miss seasonal troughs, delayed settlements, tax shocks.  
**Solution:** Multi-horizon probabilistic forecasts + liquidity risk flags + runway months.  
**Advanced methods:** Temporal Fusion Transformer / N-BEATS / DeepAR-style probabilistic forecasts; CVaR cash buffers.

### P3 — Wrong loan sizing & pricing

**Problem:** Flat rates and max-loan tables ignore PD, cash-flow capacity, and loss given default.  
**Solution:** Expected Loss pricing, DSCR constraints, optimal tenure under default risk.  
**Advanced methods:** Risk-based pricing, term-structure PD, LGD estimation, constrained optimization.

### P4 — Working capital inefficiency

**Problem:** Cash trapped in inventory/receivables while owners take expensive short-term debt.  
**Solution:** Cash conversion cycle (CCC) analytics + optimization of payables/receivables/inventory policy.  
**Advanced methods:** Linear/quadratic programming; reinforcement learning later for dynamic policies.

### P5 — Lender portfolio blind spots

**Problem:** Originators underwrite one-by-one; portfolios correlate in FX, oil, or seasonal shocks.  
**Solution:** Portfolio expected shortfall, sector concentration limits, stress scenarios.  
**Advanced methods:** Copulas / Gaussian factor models; Monte Carlo stress; Vasicek-style portfolio credit risk.

### P6 — Advice without actionability

**Problem:** Chatbots give generic tips.  
**Solution:** Advisor grounded in model outputs + optimization results + counterfactual simulator.  
**Advanced methods:** Tool-calling LLM over structured APIs; constrained recommendation ranking.

---

## 5. API Migration: Interswitch → Open Banking

### 5.1 Decision: remove Interswitch entirely

| Action | Detail |
|--------|--------|
| Delete | `backend/interswitch.py` and all Interswitch env vars |
| Replace | New `backend/integrations/` package |
| Update | README, loan copy (“powered by Interswitch”), frontend labels |
| Keep | Feature extraction interface pattern — swap implementation |

### 5.2 Recommended data providers

#### Primary: **Mono** (Nigeria Open Banking)

**Why Mono over Interswitch for this product:**

- Account-level **bank transactions** (not only merchant settlement).
- Statement analysis, balances, income patterns — better for credit + cash flow.
- Identity / KYC widgets common in Nigerian fintech.
- Clear product-market fit for SME underwriting prototypes and production.

**Core Mono use cases for LendraAI:**

| Capability | Mono product surface | LendraAI use |
|------------|----------------------|--------------|
| Link bank accounts | Connect widget / Account linking | Onboarding SME |
| Transactions | Accounts → Transactions API | Feature store inputs |
| Balances | Real-time / historical balance | Liquidity runway |
| Identity | Account holder info | KYC / fraud checks |
| Statements | PDF/JSON statements | Audit + feature backfill |
| Direct debit (later) | Mandate APIs | Collections for lenders |

#### Secondary rails (phased)

| Provider | Role | Phase |
|----------|------|-------|
| **Paystack** | Payment volume, customer charges, settlement | Phase 2 — complement bank data with commerce |
| **Flutterwave** | Multi-country payments if expanding beyond NG | Phase 3 |
| **Credit bureaus** (CRC, FirstCentral, CreditRegistry) | Traditional bureau pull | Phase 2 — hybrid score |
| **MTN MoMo / OPay / PalmPay APIs** (where available) | Mobile money velocity | Phase 3 — alt data |
| **CBN/NIBSS** via licensed partners | NIP history (via Mono or similar) | As available |

> **Do not** rebuild Interswitch-specific merchant-code flows. Design around **`account_id` / `customer_id`** abstractions so providers can be swapped.

### 5.3 Integration architecture

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Frontend   │────▶│  LendraAI API    │────▶│  Mono Connect   │
│  Connect UI │     │  /integrations/* │     │  (OAuth/widget) │
└─────────────┘     └────────┬─────────┘     └────────┬────────┘
                             │                        │
                             ▼                        ▼
                    ┌─────────────────┐     ┌─────────────────┐
                    │  Feature Store  │◀────│  Ingest Worker  │
                    │  (Postgres)     │     │  (webhooks/jobs)│
                    └────────┬────────┘     └─────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         Credit models  Forecast models  Optimizer
```

### 5.4 New modules (replace `interswitch.py`)

```text
backend/integrations/
├── base.py                 # Provider interface
├── mono/
│   ├── client.py           # Auth, HTTP, retries
│   ├── connect.py          # Link account / exchange code
│   ├── transactions.py     # Fetch + paginate txs
│   ├── accounts.py         # Balances, identity
│   └── webhooks.py         # Account updated, reauth
├── paystack/               # Optional Phase 2
│   └── client.py
└── feature_extractors/
    ├── bank_features.py    # From raw txs → credit features
    ├── cashflow_series.py  # Daily/weekly/monthly series
    └── quality.py          # Data completeness, freshness
```

### 5.5 Environment variables (new)

```bash
# Remove
# INTERSWITCH_CLIENT_ID=
# INTERSWITCH_CLIENT_SECRET=

# Add
MONO_SECRET_KEY=
MONO_PUBLIC_KEY=
MONO_WEBHOOK_SECRET=
MONO_BASE_URL=https://api.withmono.com
PAYSTACK_SECRET_KEY=          # optional Phase 2
FEATURE_STORE_DATABASE_URL=
```

### 5.6 Feature extraction upgrade (critical)

Interswitch path mapped txs → 3–4 crude fields. Production path must build a **proper SME feature vector**.

**From bank transactions (Mono):**

| Feature family | Examples | Used by |
|----------------|----------|---------|
| Revenue | Monthly inflow mean/median/std, MoM growth, seasonality index | Credit, Forecast |
| Outflow | Fixed vs variable spend ratio, salary-like patterns | Credit, Liquidity |
| Liquidity | Avg balance, min balance, days below buffer, overdraft flags | Liquidity, Loan |
| Stability | Coefficient of variation, longest zero-inflow streak | Credit |
| Counterparty | Top-5 inflow concentration (HHI), supplier dependency | Credit, Fraud |
| Behavior | Bounce/NSF proxies, weekend vs weekday mix | Credit |
| Tenure | Account age, first-seen transaction date | Confidence |
| Channel | Transfer vs card vs POS mix (if labeled) | Segment models |

**From payment processors (Paystack later):**

- GMV, success rate, chargeback/refund rate, settlement lag, recurring customer ratio.

**Output contract:**

```json
{
  "business_id": "uuid",
  "as_of": "2026-08-01",
  "data_quality": {"months_covered": 14, "completeness": 0.92, "source": "mono"},
  "credit_features": { "...": 0.0 },
  "cashflow_series": {
    "freq": "M",
    "revenue": [/* 18+ months */],
    "expenses": [],
    "net": [],
    "closing_balance": []
  }
}
```

### 5.7 Migration checklist

- [ ] Implement Mono client + Connect widget endpoint
- [ ] Webhook ingestion + idempotent storage
- [ ] Feature extractors with unit tests on sample statements
- [ ] Swap `get_merchant_transactions` call sites in `main.py`
- [ ] Remove Interswitch credentials from Render/Vercel
- [ ] Update UI copy: “Connect your bank” instead of merchant code
- [ ] Legal: terms of service + Mono data consent flows
- [ ] Sandbox fixtures under `backend/fixtures/mono/` for offline dev

---

## 6. ML & Financial Engineering Upgrades

This is the core of the upgrade. Each subsection maps to a **real finance problem** and lists **methods + deliverables**.

---

### 6.1 Credit Risk 2.0 — From UCI demo to SME PD engine

#### Problem

Current model answers “will this Taiwan credit-card user default next month?” — not “will this Nigerian SME miss loan payments?”

#### Target outputs

| Output | Definition | Use |
|--------|------------|-----|
| **PD_12m** | Probability of default within 12 months | Underwriting |
| **PD(t)** | Survival / hazard term structure | Pricing by tenure |
| **Grade** | A–E or 300–850 mapped from calibrated PD | UX |
| **EAD** | Exposure at default proxy | Expected loss |
| **LGD** | Loss given default (segment priors → data-driven) | Pricing |
| **EL** | `PD × LGD × EAD` | Capital / pricing |
| **Explanations** | SHAP + actionable counterfactuals | Trust / compliance |

#### Models to implement

**Stage A — Application / behavioral scorecard (tabular)**

- **LightGBM / XGBoost / CatBoost** on Africa-native features (bank + payments).
- Training labels (priority order):
  1. Partner lender repayment outcomes (gold standard).
  2. Proxy labels: severe balance collapse, chronic NSF, loan-like outflow defaults (carefully defined).
  3. Transfer learning: Lending Club structure **re-mapped** to SME analogues (not raw UCI).
- Class imbalance: focal loss or calibrated class weights; evaluate on **PR-AUC**, **KS**, **Gini**, not only accuracy.
- **Isotonic / Platt calibration** so 10% PD ≈ 10% observed default in buckets.
- Reject inference later if you get application + performance data.

**Stage B — Survival / time-to-default**

- **Cox PH**, **Random Survival Forest**, or **DeepSurv / DeepHit**.
- Why: loan tenures differ (3–24 months); single 12m PD is not enough for pricing.
- Output: cumulative incidence of default at month `t`.

**Stage C — Segment & challenger models**

- Separate models by sector (retail/food/services/transport) if volume allows.
- Always keep a **simple logistic scorecard** challenger for stability and regulator-friendly narratives.

#### Feature engineering (credit)

- Rolling windows: 1/3/6/12-month revenue volatility, growth, drawdown.
- Autocorrelation of inflows (business regularity).
- Cash buffer days = liquid balances / average daily burn.
- Payment discipline proxies from debit patterns.
- Macro overlays: FX (USDNGN), inflation, oil price shocks as exogenous features for portfolio models.

#### Explainability & simulator upgrade

- TreeSHAP (fast, exact for GBDT) — replace KernelSHAP if still used.
- **Counterfactual optimization**: minimal feature changes to reach target grade (DiCE / MOC / custom MILP on discretized features).
- This upgrades `/api/simulate-score` from slider toys to **constrained counterfactuals**.

#### Deliverables

```text
ml_credit/
├── notebooks/
│   ├── 10_feature_store_eda.ipynb
│   ├── 11_pd_lightgbm.ipynb
│   ├── 12_calibration_stability.ipynb
│   ├── 13_survival_pd_term.ipynb
│   └── 14_counterfactual_simulator.ipynb
├── src/
│   ├── features.py
│   ├── train_pd.py
│   ├── train_survival.py
│   ├── calibrate.py
│   └── explain.py
├── models/           # versioned artifacts + model card
└── eval/             # backtest reports
```

**Retire:** UCI feature dependency in live path. Keep notebook only as historical artifact.

---

### 6.2 Cash-Flow Forecasting 2.0 — Real time series, not a trend line

#### Problem

SME owners and lenders need **future cash**, not a binary risk coin flip. Current code uses a linear trend for “forecast” and BiLSTM only for risk classification on synthetic data.

#### Target outputs

| Output | Description |
|--------|-------------|
| `yhat_p50` | Median revenue / net cash per horizon |
| `yhat_p10`, `yhat_p90` | Prediction intervals |
| `P(cash < buffer)_h` | Liquidity shortfall probability at horizon h |
| `runway_months` | Months until cash break under base & stress |
| `seasonal_components` | Trend / seasonal / residual decomposition |
| `drivers` | Feature importances or attention weights |

Horizons: **weekly (13w)** and **monthly (6–12m)**. Start monthly; add weekly when data density allows.

#### Modeling ladder (implement in order)

**Level 1 — Strong classical baselines (ship first)**

- **Prophet** or **STL + ETS** per business (or hierarchical by sector).
- **SARIMAX** with Nigerian seasonal dummies (Sallah, Christmas, school fees months — you already encoded these in synthetic gen).
- **Croston / TSB** if intermittent revenue (common for B2B SMEs).

Why first: interpretable, cheap, works on short series, good offline baselines.

**Level 2 — Global deep models**

Train **one global model** across many SMEs (synthetic → real), with static covariates (sector, city, age):

| Model | Role |
|-------|------|
| **N-BEATS / N-HiTS** | Strong point forecast baseline |
| **Temporal Fusion Transformer (TFT)** | Multi-horizon + interpretable attention + known future inputs (holidays) |
| **DeepAR / MQ-CNN / PatchTST** | Probabilistic / quantile forecasts |
| **TiDE / TSMixer** | Efficient MLP-style alternatives |

**Level 3 — Liquidity risk head**

- Keep a dedicated head: `P(stress event in next k months)`.
- Stress event label: balance below X days of burn, or net cash < 0 for ≥ n weeks.
- Can be TFT multi-task or separate classifier on forecast residuals + balances.

**Level 4 — Hierarchical / reconciled forecasts**

- Forecast daily → aggregate to month with **MinT / bottom-up reconciliation** so totals cohere.
- Important for tax and loan EMI planning.

#### Evaluation (non-negotiable)

| Metric | Use |
|--------|-----|
| sMAPE / MASE | Point accuracy |
| Quantile loss / Winkler | Interval quality |
| Coverage of 80%/90% PI | Calibration of uncertainty |
| Decision metric | “Did we correctly flag months where cash < EMI + opex?” |

Backtest with **rolling origin** (walk-forward), never random shuffle on time series.

#### Deliverables

```text
ml_forecasting/
├── notebooks/
│   ├── 10_baselines_prophet_sarimax.ipynb
│   ├── 11_global_nhits_tft.ipynb
│   ├── 12_probabilistic_eval.ipynb
│   └── 13_liquidity_runway.ipynb
├── src/
│   ├── dataset.py
│   ├── train_global.py
│   ├── infer.py
│   └── metrics.py
└── models/
```

**API change:** `/api/cash-flow-forecast` must return quantiles + series used, not only 6 integers + risk flag.

---

### 6.3 Loan Engine 2.0 — Risk-based pricing & affordability

#### Problem

Score buckets → fixed rates ignore PD, cash-flow capacity, and loss severity. That is not how real credit works.

#### Financial engineering stack

**1. Risk components**

```text
EL = PD(tenure) × LGD × EAD
Risk premium ≈ f(EL, cost of funds, opex, target ROE, competition)
```

**2. Affordability / capacity**

```text
DSCR = CFADS / Debt Service
Max EMI = max(0, α × forecast_p10_net_cash − living_costs_proxy)
Max principal from EMI annuity formula under rate r, tenure T
```

Use **p10 (pessimistic) cash flow**, not mean — conservative underwriting.

**3. Offer optimization (per SME)**

Decision variables: principal `P`, tenure `T`, rate `r` (or choose from grid).

Constraints:

- `PD(T) ≤ PD_max(grade)`
- `DSCR_p10 ≥ 1.2` (configurable)
- `P ≤ P_policy_cap(segment)`
- `EMI ≤ Max EMI`
- `EL / P ≤ loss_budget`

Objective options (product choice):

- Maximize `P` (growth lending), or
- Maximize expected NPV to lender, or
- Minimize rate subject to ROE floor (borrower-friendly marketplace mode).

Solve with **grid search + rules** first; upgrade to **cvxpy / PuLP** for continuous formulations.

**4. Term structure**

- Use survival PD so 6-month and 24-month offers are consistent.
- Prepayment optionality: simple PSA-like assumption later.

**5. Stress testing the offer**

- Apply revenue shocks (−20%, −40%), FX shock (if import-heavy sector), settlement delay +7 days.
- Show “break” scenarios in UI.

#### Deliverables

- `backend/services/loan_pricing.py`
- `backend/services/affordability.py`
- `ml_credit/src/expected_loss.py`
- New response schema: offer grid, chosen offer, EL, DSCR, stress results.

**Replace** hard-coded blocks in `loan_preapproval` (750→5M @ 3.5%, etc.).

---

### 6.4 Working Capital & Liquidity Optimization

#### Problem

SMEs take expensive loans while cash is stuck in inventory or late receivables — or hold too little buffer and default.

#### Modules

**A. Cash buffer optimizer (CVaR / chance constraints)**

- Inputs: forecast distribution of net cash, fixed outflows (rent, salaries, EMI).
- Output: **minimum cash buffer** such that `P(cash < 0) ≤ ε` over horizon.
- Method: historical simulation or parametric; **CVaR** minimization optional.

**B. Cash Conversion Cycle (CCC) cockpit**

```text
CCC = DIO + DSO − DPO
```

- Estimate DSO/DIO/DPO from transaction categorization (heuristics → ML classifier for tx categories).
- Recommendations: “Collect receivables 5 days faster → free ₦X working capital.”

**C. Debt vs equity-like tradeoffs (simple)**

- Compare cost of delaying supplier payments (lost discounts) vs short-term credit line.
- Linear program: minimize financing cost subject to stockout and service constraints (Phase 3).

#### Deliverables

- `/api/optimize/cash-buffer`
- `/api/optimize/working-capital`
- Frontend: **Optimizer** page (new).

---

### 6.5 Early Warning System (EWS) & Monitoring

#### Problem

Underwriting is point-in-time; SMEs deteriorate after disbursement.

#### Design

- Streaming/batch feature refresh (daily/weekly).
- **PSI / CSI** on feature distributions (population stability).
- Score drift alerts; PD vs observed default (when labels exist).
- Behavioral triggers: balance death spirals, revenue cliff, new high-cost borrowing patterns.

#### Methods

- Change-point detection (PELT, BOCPD) on revenue.
- Survival model partial hazards updating.
- Gradient boosting on “will default in next 30/90 days” for watchlist.

#### Deliverables

- `ml_monitoring/` package
- `/api/monitoring/alerts`
- Lender dashboard widgets (Phase 3 B2B).

---

### 6.6 Portfolio Credit Risk (B2B lender mode)

#### Problem

A book of SME loans can fail together in a macro downturn.

#### Methods

- **Vasicek single-factor** asymptotic portfolio loss distribution.
- Sector correlation matrix + Monte Carlo.
- **Expected Shortfall (ES 95/99)** of portfolio loss.
- Concentration limits: HHI by sector/geo.

#### Deliverables

- `/api/portfolio/risk`
- Stress scenarios: oil −30%, Naira devaluation, rate hike.

---

### 6.7 Fraud / Anomaly (lightweight but real)

#### Problem

Synthetic identities, mule accounts, manufactured turnover.

#### Methods

- Unsupervised: Isolation Forest / Autoencoder on tx graphs.
- Graph features: circular flows, rapid in-out, device/account linking (when available).
- Rules + ML hybrid for explainability.

Ship as **risk flags** that adjust confidence and PD overlays — not a separate product at first.

---

### 6.8 AI Advisor 2.0 — Grounded financial copilot

#### Problem

LLM alone hallucinates rates and tax rules.

#### Design

```text
User question
    → Intent router
    → Tool calls: credit, forecast, loan offers, optimizer, simulator
    → Structured facts pack
    → LLM narrates ONLY from facts + approved policy snippets
    → Optional citations (which model/output)
```

- Prefer **xAI / Groq / local** with tool-calling schema.
- Add **retrieval** over Nigerian SME tax/FIRS simplified guides (carefully versioned, not legal advice disclaimer).
- Response types: explanation, action plan, numerical scenario.

#### Deliverables

- `backend/services/advisor_agent.py`
- Tool registry matching internal APIs
- Evaluation set of 50 SME questions with gold facts

---

### 6.9 Method priority matrix

| Priority | Workstream | Methods | Finance problem |
|----------|------------|---------|-----------------|
| P0 | Mono integration + feature store | ETL, feature eng | Real data |
| P0 | PD model + calibration | LightGBM, isotonic, SHAP | Credit invisibility |
| P0 | True cash-flow forecast | N-HiTS/TFT + quantiles | Liquidity surprises |
| P0 | Affordability + risk pricing | EL, DSCR, annuity math | Wrong loan offers |
| P1 | Survival PD term structure | Cox / DeepHit | Tenure pricing |
| P1 | Cash buffer CVaR | Prob. optimization | Runway |
| P1 | Counterfactual simulator | DiCE / optimization | Actionable score repair |
| P1 | Advisor tool-calling | LLM + tools | Trustworthy advice |
| P2 | Working capital LP | CCC + LP | Capital efficiency |
| P2 | EWS + model monitoring | Drift, change-point | Post-disbursement risk |
| P2 | Portfolio ES | Vasicek / MC | Lender B2B |
| P3 | RL for dynamic credit lines | Constrained RL | Advanced products |
| P3 | Multi-country models | Transfer learning | Expansion |

---

## 7. System Architecture Target State

```text
                         ┌────────────────────────┐
                         │     React Dashboard    │
                         │  + Mono Connect Widget │
                         └───────────┬────────────┘
                                     │ HTTPS
                         ┌───────────▼────────────┐
                         │   API Gateway / FastAPI │
                         │   Auth (JWT) · RBAC     │
                         └───────────┬────────────┘
           ┌─────────────┬───────────┼───────────┬─────────────┐
           ▼             ▼           ▼           ▼             ▼
     Integrations   Feature API  Scoring API  Forecast API  Optimize API
     (Mono, …)      /features    /credit      /cashflow     /loan,/wc
           │             │           │           │             │
           ▼             ▼           ▼           ▼             ▼
     Ingest workers  Feature Store  Model Server  Model Server  Solvers
     (Redis queue)   (Postgres)     (PD,SHAP)     (TFT/NHiTS)   (cvxpy)
                           │
                           ▼
                     Object storage (model artifacts, statements)
                     Experiment tracking (MLflow / W&B)
```

### Suggested service split (evolve from monolith)

| Phase | Structure |
|-------|-----------|
| Now | Modular monolith: `backend/app/{api,services,integrations,models,core}` |
| Later | Extract `scoring-service`, `forecast-service` if load/latency demands |

### Data stores

| Store | Purpose |
|-------|---------|
| **Postgres** | Users, businesses, linked accounts, features snapshots, offers, audit |
| **Redis** | Jobs, rate limits, session, feature cache |
| **S3/R2** | Raw statements, model binaries, report PDFs |
| **MLflow** | Model registry, metrics, lineage |

---

## 8. Backend / Platform Upgrades

### 8.1 Refactor `main.py` monolith

Target layout:

```text
backend/
├── app/
│   ├── main.py
│   ├── core/           # config, security, logging
│   ├── api/routes/     # credit, forecast, loan, advisor, integrations
│   ├── services/       # business logic
│   ├── integrations/   # mono, paystack
│   ├── ml/             # model_loader, inference wrappers
│   ├── db/             # SQLAlchemy models, migrations
│   └── workers/        # ingest, retrain triggers
├── tests/
├── fixtures/
└── requirements.txt
```

### 8.2 Must-have production capabilities

| Capability | Why |
|------------|-----|
| AuthN/AuthZ (JWT + roles: sme, lender, admin) | Multi-tenant |
| Business entity model | Real IDs not `NG-SME-001` |
| Audit log of every score/offer | Credit decisions are regulated-adjacent |
| Idempotent webhooks | Mono events |
| Rate limiting | Cost & abuse |
| Structured logging + request IDs | Debug |
| Model version header in responses | Reproducibility |
| Async jobs for heavy SHAP / batch score | Latency |
| Secrets via env / vault | Security |
| CI: lint, unit tests, model smoke tests | Quality |

### 8.3 API versioning

- Keep v1 compatibility where possible.
- Introduce `/api/v2/...` for richer schemas (quantiles, EL, offers grid).
- Deprecate Interswitch query params (`merchant_code`).

### 8.4 New / upgraded endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v2/integrations/mono/link` | Start account link |
| `POST /api/v2/integrations/mono/webhook` | Ingest events |
| `POST /api/v2/features/refresh` | Recompute features |
| `POST /api/v2/credit-score` | Calibrated PD + SHAP + grade |
| `POST /api/v2/credit/counterfactual` | Target-score actions |
| `POST /api/v2/cash-flow-forecast` | Quantile multi-horizon forecast |
| `POST /api/v2/loan/offers` | Optimized offer set |
| `POST /api/v2/optimize/cash-buffer` | Buffer recommendation |
| `POST /api/v2/optimize/working-capital` | CCC actions |
| `POST /api/v2/advisor/chat` | Tool-augmented advisor |
| `GET  /api/v2/monitoring/health-model` | Drift / PSI summary |

---

## 9. Frontend Product Upgrades

### Keep

- Overview score gauge, Simulator, Cash Flow charts, Loan EMI UI, Advisor chat, PDF export.

### Change

| Page | Upgrade |
|------|---------|
| **Onboarding** | Mono Connect; replace merchant code |
| **Overview** | PD, confidence from data quality, trend sparklines from real series |
| **Cash Flow** | Fan chart (p10–p90), runway, scenario toggles |
| **Loan** | Offer cards with EL/DSCR; stress panel; why this rate |
| **Simulator** | Counterfactual “cheapest path to Grade B” |
| **Advisor** | Show tool-sourced facts chips |
| **New: Optimizer** | Cash buffer + CCC recommendations |
| **New: Monitoring** (lender) | Watchlist, drift |

### UX principle

Every number should answer: **What should I do on Monday morning?**

---

## 10. Data Strategy

### 10.1 Phased data reality

| Phase | Data | Notes |
|-------|------|-------|
| 0 | Synthetic Nigerian SME (existing) + public Lending Club | Bootstrap models & pipelines |
| 1 | Mono sandbox + staff bank accounts | Integration correctness |
| 2 | Pilot SMEs (20–100) with consent | Domain shift measurement |
| 3 | Lender repayment labels | True PD supervision |
| 4 | Bureau + multi-source fusion | Production underwriting |

### 10.2 Label strategy (honest about cold start)

Without lender defaults you **cannot** claim true PD. Plan:

1. Publish **v0 “financial health score”** (unsupervised / proxy) with clear labeling.
2. Partner with 1–2 MFIs for historical outcomes → **v1 supervised PD**.
3. Continuously learn from book performance.

### 10.3 Synthetic data upgrade

Extend `01_synthetic_data_generation.ipynb`:

- Longer histories (24–36 months).
- Correlated default process (so survival models learn).
- Bank-statement-like raw tx generation for extractor tests.
- Macro shock scenarios for stress tests.

### 10.4 Feature store principles

- Point-in-time correctness (no leakage).
- `as_of` timestamps on every score.
- Train/serve parity tests.

---

## 11. Phased Roadmap

### Phase 0 — Foundations (1–2 weeks)

**Goal:** Clean repo for production work.

- [ ] Create this doc’s folder structure scaffolding
- [ ] Modularize backend; config via pydantic settings
- [ ] Remove Interswitch code paths; stub provider interface
- [ ] Add Postgres + SQLAlchemy + Alembic
- [ ] Auth skeleton (SME user ↔ business)
- [ ] Test fixtures for sample bank txs
- [ ] CI pipeline (pytest, ruff)

**Exit criteria:** App runs without Interswitch; health + empty feature endpoints green.

---

### Phase 1 — Data rails + honest ML baseline (3–5 weeks)

**Goal:** Real accounts in; models that are methodologically sound even if trained on synthetic/proxy labels.

- [ ] Mono Connect end-to-end (link → txs → DB)
- [ ] Feature extractors + quality scores
- [ ] Retrain **LightGBM PD** on redesigned features (synthetic labels first)
- [ ] Calibration + SHAP + model card
- [ ] **Classical + N-HiTS/TFT** cash-flow forecasts with quantiles
- [ ] Replace linear-trend forecast in API
- [ ] Loan engine: DSCR + EL pricing on grid
- [ ] Frontend: Connect bank, fan-chart cash flow, new loan offers

**Exit criteria:** Demo uses **linked account data** (or rich fixtures), not UCI sample vector; forecast intervals visible.

---

### Phase 2 — Financial engineering depth (4–6 weeks)

**Goal:** Differentiated quant product.

- [ ] Survival PD term structure
- [ ] Counterfactual credit simulator
- [ ] Cash buffer CVaR optimizer
- [ ] CCC / working capital module
- [ ] Advisor tool-calling over v2 APIs
- [ ] Model monitoring (PSI, performance dashboards)
- [ ] Paystack optional enrichment
- [ ] PDF reports include EL, DSCR, forecast bands

**Exit criteria:** Can explain and price a loan like a junior credit analyst + quant.

---

### Phase 3 — Lender B2B + scale (6–10 weeks)

**Goal:** Sell to MFIs / digital lenders.

- [ ] Lender tenant, portfolio APIs, bulk score
- [ ] Portfolio ES / concentration
- [ ] EWS watchlist
- [ ] Human-in-the-loop review queue
- [ ] SLA, uptime, SOC2-oriented controls (as needed)
- [ ] Retraining pipeline with champion/challenger
- [ ] Pilot with live repayment feedback loop

**Exit criteria:** External lender runs a pilot book on LendraAI decisioning.

---

### Phase 4 — Advanced research track (ongoing)

- Multi-task TFT (forecast + PD)
- Graph fraud features
- Constrained RL for dynamic limits
- Cross-border (Flutterwave + local open banking)
- Causal ML for intervention effects (“if we coach DSO reduction, PD impact?”)

---

## 12. Success Metrics & Evaluation

### Product / business

| Metric | Target (directional) |
|--------|----------------------|
| Time-to-decision for SME pre-approval | < 5 minutes after bank link |
| % SMEs with ≥12 months usable data | Track; improve via multi-account link |
| Lender pilot conversion | ≥1 signed pilot by Phase 3 |
| Advisor helpfulness (thumbs / task success) | >70% positive |

### Credit model

| Metric | Bar |
|--------|-----|
| Gini / AUC | Competitive vs internal baseline; monitor stability |
| Calibration ECE | Low; reliability diagram reviewed |
| PSI (monthly) | < 0.2 or alert |
| Approval unfairness audits | Sector/geo slices documented |

### Forecasting

| Metric | Bar |
|--------|-----|
| MASE vs naive seasonal | < 1.0 on holdout |
| 80% PI coverage | ~75–85% empirical |
| Liquidity flag precision/recall | Tuned to lender cost matrix |

### Loan engine

| Metric | Bar |
|--------|-----|
| Share of offers failing DSCR in backtest | Near 0 by design |
| Realized EL vs predicted EL | Within tolerance after labels exist |

---

## 13. Risks, Compliance & Ethics

| Risk | Mitigation |
|------|------------|
| No true default labels early | Market as “financial health / pre-underwriting assist”; not final bank decision |
| Open banking consent abuse | Explicit consent, data minimization, retention limits |
| Model bias (sector, gender proxy, geo) | Slice metrics; avoid sensitive proxies; human review |
| LLM tax/legal hallucination | Tool grounding + disclaimers; no “legal advice” |
| Overfitting synthetic data | Domain-adversarial checks; pilot recalibration |
| Regulatory (CBN, NDPR) | NDPR compliance, data processing agreements with Mono, audit logs |
| Interswitch removal breaks demo | Feature-flag fixtures so marketing demo never depends on live vendor |

**NDPR / privacy:** store tokens encrypted, allow disconnect/delete, log access to financial data.

---

## 14. Repo Mapping (What Changes Where)

| Path | Action |
|------|--------|
| `backend/interswitch.py` | **Delete** after Mono parity |
| `backend/main.py` | Split into `app/` package; v2 routes |
| `backend/model_loader.py` | Versioned multi-model registry |
| `backend/requirements.txt` | Add: `lightgbm`, `neuralforecast` or `pytorch-forecasting`, `lifelines`, `cvxpy`, `sqlalchemy`, `alembic`, `redis`, `pydantic-settings`, `mlflow` (as needed); trim TF if moving to PyTorch/NHITS |
| `ml_credit/` | New training pipeline; deprecate UCI live path |
| `ml_forecasting/` | Real forecasters; keep synthetic gen improved |
| `frontend/src/lib/api.js` | v2 clients; remove Interswitch-era fields |
| `frontend/src/pages/*` | Connect, fan charts, offers, optimizer |
| `README.md` | Reposition off Buildathon-only; document Mono |
| `docs/UPGRADE_IMPLEMENTATION.md` | This file — living plan |

---

## 15. Appendix: API & Model Specs

### 15.1 Example v2 credit response

```json
{
  "business_id": "biz_123",
  "model_version": "pd_lgbm_v2.3.0",
  "as_of": "2026-08-01T00:00:00Z",
  "score": 642,
  "grade": "C",
  "pd_12m": 0.118,
  "pd_term": {"3": 0.04, "6": 0.07, "12": 0.118, "24": 0.19},
  "lgd": 0.45,
  "expected_loss_rate": 0.053,
  "risk_level": "medium",
  "confidence": "high",
  "data_quality": {
    "source": "mono",
    "months_covered": 16,
    "completeness": 0.94
  },
  "top_factors": [
    {"feature": "revenue_cv_6m", "shap": 0.08, "direction": "increases_pd"},
    {"feature": "min_balance_90d", "shap": -0.05, "direction": "decreases_pd"}
  ],
  "improvement_actions": [
    {
      "action": "Raise average balance buffer by ₦250,000 for 90 days",
      "expected_score_lift": 28,
      "method": "counterfactual"
    }
  ]
}
```

### 15.2 Example v2 forecast response

```json
{
  "business_id": "biz_123",
  "model_version": "tft_cash_v1.1.0",
  "horizon_months": 6,
  "freq": "M",
  "series": {
    "revenue": {
      "p10": [410000, 390000, 450000, 470000, 520000, 500000],
      "p50": [500000, 480000, 550000, 560000, 610000, 590000],
      "p90": [600000, 590000, 650000, 680000, 720000, 700000]
    },
    "net_cash": { "p10": [], "p50": [], "p90": [] }
  },
  "liquidity": {
    "runway_months_p50": 4.2,
    "runway_months_p10": 2.1,
    "shortfall_prob_next_90d": 0.23,
    "recommended_cash_buffer": 850000
  },
  "drivers": ["seasonality_dec", "settlement_lag", "refund_rate"]
}
```

### 15.3 Example v2 loan offers response

```json
{
  "business_id": "biz_123",
  "currency": "NGN",
  "offers": [
    {
      "principal": 1500000,
      "tenure_months": 12,
      "interest_rate_annual": 0.28,
      "emi": 145000,
      "pd_to_term": 0.09,
      "expected_loss": 60750,
      "dscr_p10": 1.35,
      "pricing_components": {
        "cost_of_funds": 0.18,
        "el_premium": 0.06,
        "opex_margin": 0.04
      },
      "stress": {
        "revenue_minus_20_dscr": 1.08,
        "passes_policy": true
      }
    }
  ],
  "declines": [],
  "policy_version": "lender_default_v1"
}
```

### 15.4 Suggested tech choices (opinionated)

| Area | Choice | Rationale |
|------|--------|-----------|
| Open banking | **Mono** | Best fit NG SME bank data |
| Tabular PD | **LightGBM** | Fast, strong, SHAP-friendly |
| Survival | **lifelines** then DeepHit if needed | Start simple |
| Forecasting | **statsmodels/Prophet** + **NeuralForecast (N-HiTS/TFT)** | Baselines + SOTA |
| Explainability | **SHAP TreeExplainer** | Production speed |
| Optimization | **cvxpy** / PuLP | Cash buffer, offer constraints |
| Tracking | **MLflow** | Model registry |
| Queue | **Redis + ARQ/Celery** | Ingest & batch score |
| LLM | Keep Groq or move to xAI with **tool calling** | Grounded advisor |

### 15.5 Explicit non-goals (near term)

- Becoming a licensed bank or microfinance institution.
- Fully autonomous loan disbursement without lender partner.
- Replacing formal credit bureaus entirely.
- Perfect multi-country support before NG depth.

---

## Closing: From Hackathon to Fintech

| Hackathon LendraAI | Production LendraAI |
|--------------------|---------------------|
| Interswitch merchant sandbox | Mono open banking + payment rails |
| UCI credit-card XGBoost | Calibrated SME PD + survival term structure |
| Linear “LSTM” revenue story | Probabilistic multi-horizon forecasting |
| Score-tier loan table | EL pricing + DSCR + optimized offers |
| Chat tips | Tool-grounded advisor + optimizers |
| Demo ID `NG-SME-001` | Multi-tenant businesses, audit, monitoring |

**First concrete engineering sprint:** Phase 0 scaffolding + Mono stub + kill Interswitch + replace cash-flow endpoint with a real baseline forecaster (even Prophet-level) so the product stops lying about LSTM forecasting.

---

*Document owner: LendraAI engineering*  
*Living document — update per phase exit criteria.*  
*Created: 2026-08-11*
