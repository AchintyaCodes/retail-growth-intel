"""
Business KPIs computed from cleaned transaction data.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def monthly_revenue(df: pd.DataFrame) -> pd.DataFrame:
    return (
        df.groupby(df["invoice_date"].dt.to_period("M"))
        .agg(revenue=("revenue", "sum"), orders=("invoice", "nunique"))
        .reset_index()
        .rename(columns={"invoice_date": "month"})
        .assign(month=lambda x: x["month"].astype(str))
    )


def basket_size(df: pd.DataFrame) -> pd.DataFrame:
    basket = df.groupby("invoice").agg(
        n_items=("quantity", "sum"),
        n_skus=("stock_code", "nunique"),
        basket_value=("revenue", "sum"),
        month=("invoice_date", lambda x: x.dt.to_period("M").iloc[0]),
    ).reset_index()
    return (
        basket.groupby("month")
        .agg(
            avg_items=("n_items", "mean"),
            avg_skus=("n_skus", "mean"),
            avg_basket_value=("basket_value", "mean"),
            n_orders=("invoice", "count"),
        )
        .round(2)
        .reset_index()
        .assign(month=lambda x: x["month"].astype(str))
    )


def repeat_rate(df: pd.DataFrame) -> pd.DataFrame:
    cust_first = (
        df.groupby("customer_id")["invoice_date"]
        .min()
        .dt.to_period("M")
        .rename("first_month")
        .reset_index()
    )
    df2 = df.copy()
    df2["month"] = df2["invoice_date"].dt.to_period("M")
    monthly_active = df2.groupby(["month", "customer_id"]).size().reset_index(name="n")
    monthly_active = monthly_active.merge(cust_first, on="customer_id")
    monthly_active["is_repeat"] = monthly_active["month"] > monthly_active["first_month"]
    result = (
        monthly_active.groupby("month")
        .agg(total_active=("customer_id", "count"), repeats=("is_repeat", "sum"))
        .reset_index()
    )
    result["repeat_rate"] = (result["repeats"] / result["total_active"] * 100).round(1)
    return result.assign(month=lambda x: x["month"].astype(str))


def top_products(df: pd.DataFrame, n: int = 20) -> pd.DataFrame:
    return (
        df.groupby(["stock_code", "description"])
        .agg(revenue=("revenue", "sum"), units=("quantity", "sum"), orders=("invoice", "nunique"))
        .sort_values("revenue", ascending=False)
        .head(n)
        .reset_index()
    )


def country_revenue(df: pd.DataFrame) -> pd.DataFrame:
    return (
        df.groupby("country")
        .agg(revenue=("revenue", "sum"), customers=("customer_id", "nunique"), orders=("invoice", "nunique"))
        .sort_values("revenue", ascending=False)
        .reset_index()
    )
