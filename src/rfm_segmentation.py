"""
RFM (Recency, Frequency, Monetary) customer segmentation.

Segment rules:
  Champions        : R=4 F≥3 M≥3
  Loyal            : R≥3 F≥3
  Potential Loyal  : R≥3 F=2
  Promising        : R=4 F=1
  At Risk          : R=2 F≥2
  Hibernating      : R=1 F≥2 or R=2 F=1
  Lost             : R=1 F=1
"""

from __future__ import annotations

from typing import Optional

import numpy as np
import pandas as pd


def compute_rfm(
    df: pd.DataFrame,
    reference_date: Optional[pd.Timestamp] = None,
) -> pd.DataFrame:
    if reference_date is None:
        reference_date = df["invoice_date"].max() + pd.Timedelta(days=1)

    rfm = (
        df.groupby("customer_id")
        .agg(
            last_purchase=("invoice_date", "max"),
            frequency=("invoice", "nunique"),
            monetary=("revenue", "sum"),
        )
        .reset_index()
    )
    rfm["recency"] = (reference_date - rfm["last_purchase"]).dt.days
    rfm["r_score"] = pd.qcut(rfm["recency"], 4, labels=[4, 3, 2, 1]).astype(int)
    rfm["f_score"] = pd.qcut(rfm["frequency"].rank(method="first"), 4, labels=[1, 2, 3, 4]).astype(int)
    rfm["m_score"] = pd.qcut(rfm["monetary"].rank(method="first"), 4, labels=[1, 2, 3, 4]).astype(int)
    rfm["rfm_score"] = rfm["r_score"] * 100 + rfm["f_score"] * 10 + rfm["m_score"]
    rfm["rfm_sum"] = rfm[["r_score", "f_score", "m_score"]].sum(axis=1)
    rfm["segment"] = rfm.apply(_assign_segment, axis=1)
    return rfm


def _assign_segment(row: pd.Series) -> str:
    r, f, m = row["r_score"], row["f_score"], row["m_score"]
    if r == 4 and f >= 3 and m >= 3:
        return "Champions"
    if r >= 3 and f >= 3:
        return "Loyal"
    if r == 4 and f == 2:
        return "Potential Loyal"
    if r == 4 and f == 1:
        return "Promising"
    if r == 3 and f <= 2:
        return "Promising"
    if r == 2 and f >= 2:
        return "At Risk"
    if r == 2 and f == 1:
        return "Hibernating"
    if r == 1 and f >= 2:
        return "Hibernating"
    if r == 1 and f == 1:
        return "Lost"
    return "Other"


SEGMENT_ORDER = [
    "Champions", "Loyal", "Potential Loyal", "Promising",
    "At Risk", "Hibernating", "Lost", "Other",
]

SEGMENT_COLORS = {
    "Champions": "#2ecc71",
    "Loyal": "#27ae60",
    "Potential Loyal": "#3498db",
    "Promising": "#9b59b6",
    "At Risk": "#e67e22",
    "Hibernating": "#e74c3c",
    "Lost": "#95a5a6",
    "Other": "#bdc3c7",
}


def segment_summary(rfm: pd.DataFrame) -> pd.DataFrame:
    summary = (
        rfm.groupby("segment")
        .agg(
            customers=("customer_id", "count"),
            avg_recency_days=("recency", "mean"),
            avg_frequency=("frequency", "mean"),
            avg_monetary=("monetary", "mean"),
            total_revenue=("monetary", "sum"),
        )
        .round(1)
        .reset_index()
    )
    summary["revenue_share_pct"] = (
        summary["total_revenue"] / summary["total_revenue"].sum() * 100
    ).round(1)
    summary["segment"] = pd.Categorical(
        summary["segment"], categories=SEGMENT_ORDER, ordered=True
    )
    return summary.sort_values("segment").reset_index(drop=True)
