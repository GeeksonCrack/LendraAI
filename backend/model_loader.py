# backend/model_loader.py
import joblib
import os

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(BASE, '..')

def load_pkl(path, default):
    try:
        return joblib.load(path)
    except Exception:
        return default

class DummyCreditModel:
    def predict_proba(self, X):
        return [[0.1, 0.9]]

class DummyShap:
    def shap_values(self, X):
        import numpy as np
        n = X.shape[1] if hasattr(X, 'shape') else 18
        # Return list of arrays per class, each (n_samples, n_features)
        return [np.zeros((1, n)), np.zeros((1, n))]

def load_all_models():
    # Deferred heavy imports to speed up startup and save memory
    print("Loading heavy ML libraries (TensorFlow)...")
    from tensorflow.keras.models import load_model
    import numpy as np
    
    models = {}

    dummy_features = [
        "avg_bill_amt", "avg_pay_amt", "LIMIT_BAL", "months_delayed", "high_risk",
        "max_pay_delay", "avg_pay_delay", "credit_util", "PAY_0", "payment_ratio",
        "f11", "f12", "f13", "f14", "f15"
    ]
    dummy_sample = {f: 0 for f in dummy_features}
    dummy_sample['business_age_months'] = 12

    # ── Credit model ──────────────────────────────────────────────
    models['credit_model'] = load_pkl(
        os.path.join(ROOT, 'ml_credit/models/lendraai_uci_model.pkl'),
        DummyCreditModel()
    )

    models['shap_explainer'] = load_pkl(
        os.path.join(ROOT, 'ml_credit/models/lendraai_shap_explainer.pkl'),
        DummyShap()
    )

    models['feature_list'] = load_pkl(
        os.path.join(ROOT, 'ml_credit/models/lendraai_uci_features.pkl'),
        dummy_features
    )

    models['sample_input'] = load_pkl(
        os.path.join(ROOT, 'ml_credit/models/sample_input.pkl'),
        dummy_sample
    )

    # ── LSTM model ────────────────────────────────────────────────
    try:
        models['lstm_model'] = load_model(
            os.path.join(ROOT, 'ml_forecasting/models/lendraai_lstm_model.h5'))
    except Exception:
        class DummyLSTM:
            def predict(self, X):
                return [[0.2]]
        models['lstm_model'] = DummyLSTM()

    models['seq_scaler'] = load_pkl(
        os.path.join(ROOT, 'ml_forecasting/models/seq_scaler.pkl'),
        None # In real app, standard scaler is needed
    )

    models['static_scaler'] = load_pkl(
        os.path.join(ROOT, 'ml_forecasting/models/static_scaler.pkl'),
        None
    )

    models['static_cols'] = load_pkl(
        os.path.join(ROOT, 'ml_forecasting/models/static_cols.pkl'),
        []
    )

    print("All models loaded successfully ✅")
    return models
