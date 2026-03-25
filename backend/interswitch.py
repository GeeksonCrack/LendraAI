# backend/interswitch.py
import httpx
import base64
import os
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID     = os.getenv("INTERSWITCH_CLIENT_ID")
CLIENT_SECRET = os.getenv("INTERSWITCH_CLIENT_SECRET")
ENVIRONMENT   = os.getenv("ENVIRONMENT", "sandbox")

BASE_URL = (
    "https://sandbox.interswitchng.com"
    if ENVIRONMENT == "sandbox"
    else "https://api.interswitchng.com"
)

# ── Get OAuth access token ────────────────────────────────────────
async def get_access_token() -> str:
    try:
        credentials = base64.b64encode(
            f"{CLIENT_ID}:{CLIENT_SECRET}".encode()
        ).decode()

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{BASE_URL}/passport/oauth/token",
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={"grant_type": "client_credentials"}
            )
            data = response.json()
            return data.get("access_token", "")
    except Exception as e:
        print(f"Interswitch auth failed: {e}")
        return ""

# ── Get merchant transaction history ─────────────────────────────
async def get_merchant_transactions(merchant_code: str) -> list:
    try:
        token = await get_access_token()
        if not token:
            return []

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{BASE_URL}/api/v1/merchant/transactions",
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "merchantcode": merchant_code,
                    "size": 100
                }
            )
            data = response.json()
            return data.get("transactions", [])
    except Exception as e:
        print(f"Transaction fetch failed: {e}")
        return []

# ── Get merchant identity/profile ────────────────────────────────
async def get_merchant_profile(merchant_code: str) -> dict:
    try:
        token = await get_access_token()
        if not token:
            return {}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{BASE_URL}/api/v1/merchant/profile",
                headers={"Authorization": f"Bearer {token}"},
                params={"merchantcode": merchant_code}
            )
            return response.json()
    except Exception as e:
        print(f"Profile fetch failed: {e}")
        return {}

# ── Transform raw transactions into model features ────────────────
def extract_features_from_transactions(
    transactions: list,
    feature_list: list,
    sample_input: dict
) -> dict:
    """
    Convert Interswitch transaction data into the 15 features
    the XGBoost credit model expects.
    Falls back to sample input if transactions are empty.
    """
    if not transactions:
        print("No transactions found — using sample input")
        return sample_input

    import pandas as pd
    import numpy as np

    df = pd.DataFrame(transactions)

    # map transaction data to model features
    # in production this mapping becomes more sophisticated
    features = sample_input.copy()

    if 'amount' in df.columns:
        features['avg_bill_amt'] = float(df['amount'].mean())
        features['avg_pay_amt']  = float(df['amount'].mean() * 0.8)
        features['LIMIT_BAL']    = float(df['amount'].sum())

    if 'status' in df.columns:
        failed = (df['status'] == 'failed').sum()
        total  = len(df)
        features['months_delayed'] = int(failed / max(total, 1) * 6)
        features['high_risk']      = 1 if features['months_delayed'] >= 2 else 0

    return features
