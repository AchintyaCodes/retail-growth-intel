"""
30-day repurchase propensity model.

Features (all computed before cutoff):
  - Recency, Frequency, Monetary, AOV, n_products, tenure_days, recent_ratio

Evaluation: Precision@K, Recall@K, Lift@K, AUC-ROC, Average Precision
"""

from __future__ import annotations

from typing import Optional

import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, roc_auc_score

try:
    from xgboost import XGBClassifier
    _XGB = True
except ImportError:
    from sklearn.ensemble import GradientBoostingClassifier as XGBClassifier
    _XGB = False


def _build_features(df: pd.DataFrame, reference_date: pd.Timestamp, window_start=None) -> pd.DataFrame:
    sub = df[df["invoice_date"] < reference_date].copy()
    if window_start is not None:
        sub = sub[sub["invoice_date"] >= window_start]

    feat = sub.groupby("customer_id").agg(
        recency=("invoice_date", lambda x: (reference_date - x.max()).days),
        frequency=("invoice", "nunique"),
        monetary=("revenue", "sum"),
        n_products=("stock_code", "nunique"),
        first_purchase=("invoice_date", "min"),
        last_purchase=("invoice_date", "max"),
        avg_basket=("revenue", lambda x: x.groupby(sub.loc[x.index, "invoice"]).sum().mean()),
    ).reset_index()

    feat["tenure_days"] = (feat["last_purchase"] - feat["first_purchase"]).dt.days.clip(lower=0)
    feat["aov"] = feat["monetary"] / feat["frequency"].clip(lower=1)

    sub_90 = sub[sub["invoice_date"] >= reference_date - pd.Timedelta(days=90)]
    recent_freq = sub_90.groupby("customer_id")["invoice"].nunique().rename("recent_freq")
    feat = feat.merge(recent_freq, on="customer_id", how="left").fillna({"recent_freq": 0})
    feat["recent_ratio"] = feat["recent_freq"] / feat["frequency"].clip(lower=1)
    return feat.drop(columns=["first_purchase", "last_purchase", "recent_freq"])


def _build_labels(df: pd.DataFrame, reference_date: pd.Timestamp, horizon_days: int = 30) -> pd.Series:
    future = df[
        (df["invoice_date"] >= reference_date)
        & (df["invoice_date"] < reference_date + pd.Timedelta(days=horizon_days))
    ]
    return future.groupby("customer_id")["invoice"].nunique().gt(0).rename("repurchased")


def build_dataset(df, train_cutoff, test_cutoff, horizon_days=30, min_purchases=2):
    train_feat = _build_features(df, train_cutoff)
    train_label = _build_labels(df, train_cutoff, horizon_days)
    train = train_feat.merge(train_label, on="customer_id", how="left")
    train["repurchased"] = train["repurchased"].fillna(False).astype(int)
    train = train[train["frequency"] >= min_purchases]

    test_feat = _build_features(df, test_cutoff)
    test_label = _build_labels(df, test_cutoff, horizon_days)
    test = test_feat.merge(test_label, on="customer_id", how="left")
    test["repurchased"] = test["repurchased"].fillna(False).astype(int)
    test = test[test["frequency"] >= min_purchases]

    common_ids = set(train["customer_id"]) & set(test["customer_id"])
    train = train[train["customer_id"].isin(common_ids)]
    test = test[test["customer_id"].isin(common_ids)]
    return train, test


FEATURE_COLS = ["recency", "frequency", "monetary", "n_products", "tenure_days", "aov", "recent_ratio"]


def train_and_evaluate(train_df, test_df, top_k=500, seed=42):
    feat_cols = [c for c in FEATURE_COLS if c in train_df.columns]
    X_train = train_df[feat_cols].fillna(0)
    y_train = train_df["repurchased"]
    X_test = test_df[feat_cols].fillna(0)
    y_test = test_df["repurchased"]

    if _XGB:
        model = XGBClassifier(
            n_estimators=400, max_depth=4, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8,
            scale_pos_weight=(y_train == 0).sum() / max((y_train == 1).sum(), 1),
            eval_metric="logloss", random_state=seed, verbosity=0,
        )
    else:
        model = XGBClassifier(n_estimators=200, max_depth=4, random_state=seed)

    model.fit(X_train, y_train)
    proba = model.predict_proba(X_test)[:, 1]

    auc_roc = roc_auc_score(y_test, proba)
    avg_prec = average_precision_score(y_test, proba)

    test_pred = test_df[["customer_id", "repurchased"]].copy()
    test_pred["score"] = proba
    test_pred = test_pred.sort_values("score", ascending=False).reset_index(drop=True)

    actual_top_k = min(top_k, len(test_pred))
    precision_at_k = test_pred.iloc[:actual_top_k]["repurchased"].mean()
    recall_at_k = test_pred.iloc[:actual_top_k]["repurchased"].sum() / max(y_test.sum(), 1)
    baseline_rate = y_test.mean()
    lift_at_k = precision_at_k / baseline_rate if baseline_rate > 0 else float("nan")

    if hasattr(model, "feature_importances_"):
        fi = pd.DataFrame({"feature": feat_cols, "importance": model.feature_importances_}).sort_values("importance", ascending=False)
    else:
        fi = pd.DataFrame({"feature": feat_cols, "importance": np.zeros(len(feat_cols))})

    return {
        "model": model, "feature_cols": feat_cols, "predictions": test_pred,
        "auc_roc": round(float(auc_roc), 4), "avg_precision": round(float(avg_prec), 4),
        "precision_at_k": round(float(precision_at_k), 4), "recall_at_k": round(float(recall_at_k), 4),
        "lift_at_k": round(float(lift_at_k), 2), "baseline_rate": round(float(baseline_rate), 4),
        "top_k": actual_top_k, "feature_importance": fi,
    }
