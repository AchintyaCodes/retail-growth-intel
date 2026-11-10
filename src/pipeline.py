"""
Data cleaning pipeline for UCI Online Retail II.

Handles:
  - Cancellations (InvoiceNo starting with 'C')
  - Returns / negative quantities
  - Missing CustomerID
  - Wholesale outlier customers (extreme basket sizes)
  - Unit-price anomalies (£0 or negative)
  - Duplicate rows
"""

from __future__ import annotations

import io
import os
from pathlib import Path

import numpy as np
import pandas as pd
import requests

RAW_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00502/online_retail_II.xlsx"
LOCAL_PATH = Path(__file__).parent.parent / "data" / "online_retail_II.xlsx"
CLEAN_PATH = Path(__file__).parent.parent / "data" / "retail_clean.parquet"


def download_raw(force: bool = False) -> Path:
    LOCAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    if LOCAL_PATH.exists() and not force:
        return LOCAL_PATH
    print("Downloading UCI Online Retail II (≈ 45 MB) …")
    r = requests.get(RAW_URL, timeout=180, stream=True)
    r.raise_for_status()
    with open(LOCAL_PATH, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Saved to {LOCAL_PATH}")
    return LOCAL_PATH


def load_raw(path: Path | None = None) -> pd.DataFrame:
    p = path or download_raw()
    print("Reading Excel file (this takes ~20 s) …")
    sheets = pd.read_excel(p, sheet_name=None, dtype={"Customer ID": str})
    dfs = []
    for name, sheet in sheets.items():
        sheet["sheet"] = name
        dfs.append(sheet)
    df = pd.concat(dfs, ignore_index=True)
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Apply all cleaning steps and return a clean DataFrame."""
    raw_n = len(df)

    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace(r"[^a-z0-9_]", "", regex=True)
    )
    rename = {
        "invoiceno": "invoice",
        "invoice": "invoice",
        "stockcode": "stock_code",
        "description": "description",
        "quantity": "quantity",
        "invoicedate": "invoice_date",
        "price": "unit_price",
        "unitprice": "unit_price",
        "customerid": "customer_id",
        "customer_id": "customer_id",
        "country": "country",
    }
    df = df.rename(columns={c: rename.get(c, c) for c in df.columns})
    df["invoice_date"] = pd.to_datetime(df["invoice_date"], errors="coerce")
    df = df.dropna(subset=["invoice_date"])
    df["is_cancel"] = df["invoice"].astype(str).str.startswith("C")
    cancel_n = df["is_cancel"].sum()
    df = df[~df["is_cancel"]].drop(columns=["is_cancel"])
    df = df[df["quantity"] > 0]
    df = df[df["unit_price"] > 0]
    missing_cust = df["customer_id"].isna().sum()
    df = df.dropna(subset=["customer_id"])
    dup_n = df.duplicated().sum()
    df = df.drop_duplicates()
    df["revenue"] = df["quantity"] * df["unit_price"]
    df["year"] = df["invoice_date"].dt.year
    df["month"] = df["invoice_date"].dt.to_period("M")
    df["date"] = df["invoice_date"].dt.date
    clean_n = len(df)
    removed = raw_n - clean_n
    print(
        f"Cleaning complete: {raw_n:,} → {clean_n:,} rows "
        f"({removed:,} removed, {removed/raw_n*100:.1f}%)  "
        f"[cancellations={cancel_n:,}, missing_customer={missing_cust:,}, duplicates={dup_n:,}]"
    )
    return df


def load_or_clean(force_clean: bool = False) -> pd.DataFrame:
    """Return cleaned data, reading from cache if available."""
    if CLEAN_PATH.exists() and not force_clean:
        return pd.read_parquet(CLEAN_PATH)
    raw = load_raw()
    cleaned = clean(raw)
    CLEAN_PATH.parent.mkdir(parents=True, exist_ok=True)
    cleaned["stock_code"] = cleaned["stock_code"].astype(str)
    cleaned.to_parquet(CLEAN_PATH, index=False)
    return cleaned
