"""
Retail Growth Intelligence — Streamlit dashboard.

Run:  streamlit run app.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

sys.path.insert(0, str(Path(__file__).parent))
from src.pipeline import load_or_clean
from src.rfm_segmentation import (
    SEGMENT_COLORS,
    SEGMENT_ORDER,
    compute_rfm,
    segment_summary,
)
from src.kpis import basket_size, country_revenue, monthly_revenue, repeat_rate, top_products
from src.repurchase_model import build_dataset, train_and_evaluate

st.set_page_config(
    page_title="Retail Growth Intelligence",
    page_icon="🛒️",
    layout="wide",
    initial_sidebar_state="expanded",
)


@st.cache_data(show_spinner="Loading Online Retail II dataset …")
def get_data():
    return load_or_clean()


@st.cache_data(show_spinner="Computing RFM segmentation …")
def get_rfm(_df):
    return compute_rfm(_df)


st.sidebar.title("⚙️ Settings")
top_k = st.sidebar.slider("Repurchase model — Precision@K", 100, 2000, 500, 100)

st.title("🛒️ Retail Growth Intelligence")
st.caption("Customer analytics on UCI Online Retail II · RFM segmentation · Revenue KPIs · 30-day repurchase propensity model")

with st.spinner("Loading data …"):
    try:
        df = get_data()
        data_loaded = True
    except Exception as e:
        data_loaded = False
        st.error(f"Could not load data: {e}")
        st.stop()

tabs = st.tabs([
    "📊 KPI Overview",
    "👥 RFM Segments",
    "📦 Products & Markets",
    "🔮 Repurchase Model",
    "📁 Power BI Export",
])

with tabs[0]:
    st.subheader("Revenue, Basket Size & Repeat Rate")
    total_rev = df["revenue"].sum()
    n_customers = df["customer_id"].nunique()
    n_orders = df["invoice"].nunique()
    avg_basket = df.groupby("invoice")["revenue"].sum().mean()
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Revenue", f"£{total_rev:,.0f}")
    c2.metric("Unique Customers", f"{n_customers:,}")
    c3.metric("Total Orders", f"{n_orders:,}")
    c4.metric("Avg Basket Value", f"£{avg_basket:.2f}")
    rev = monthly_revenue(df)
    fig = px.bar(rev, x="month", y="revenue", title="Monthly Revenue (£)", color_discrete_sequence=["#4361ee"])
    st.plotly_chart(fig, use_container_width=True)

with tabs[1]:
    st.subheader("RFM Customer Segmentation")
    rfm = get_rfm(df)
    summary = segment_summary(rfm)
    col1, col2 = st.columns(2)
    with col1:
        fig = px.pie(summary, names="segment", values="customers", title="Customer Count by Segment",
                     color="segment", color_discrete_map=SEGMENT_COLORS)
        st.plotly_chart(fig, use_container_width=True)
    with col2:
        fig2 = px.bar(summary.sort_values("revenue_share_pct", ascending=True),
                      x="revenue_share_pct", y="segment", orientation="h",
                      title="Revenue Share by Segment (%)", color="segment", color_discrete_map=SEGMENT_COLORS)
        st.plotly_chart(fig2, use_container_width=True)

with tabs[2]:
    st.subheader("Top Products & Geographic Revenue")
    products = top_products(df, 20)
    fig = px.bar(products.head(15), x="revenue", y="description", orientation="h",
                 title="Top 15 Products by Revenue", color_discrete_sequence=["#4361ee"])
    st.plotly_chart(fig, use_container_width=True)

with tabs[3]:
    st.subheader("30-Day Repurchase Propensity Model")
    with st.spinner("Training repurchase model …"):
        try:
            train_cutoff = pd.Timestamp("2011-06-01")
            test_cutoff = pd.Timestamp("2011-07-01")
            train_df, test_df = build_dataset(df, train_cutoff, test_cutoff)
            metrics = train_and_evaluate(train_df, test_df, top_k=top_k)
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("AUC-ROC", f"{metrics['auc_roc']:.3f}")
            c2.metric("Avg Precision", f"{metrics['avg_precision']:.3f}")
            c3.metric(f"Precision@{top_k}", f"{metrics['precision_at_k']*100:.1f}%")
            c4.metric(f"Lift@{top_k}", f"{metrics['lift_at_k']:.1f}×")
        except Exception as e:
            st.error(f"Model training failed: {e}")

with tabs[4]:
    st.subheader("Power BI Data Export")
    rfm_for_export = get_rfm(df)
    exports = {
        "rfm_customers.csv": rfm_for_export.drop(columns=["last_purchase"], errors="ignore"),
        "segment_summary.csv": segment_summary(rfm_for_export),
        "monthly_revenue.csv": monthly_revenue(df),
        "basket_size.csv": basket_size(df),
        "repeat_rate.csv": repeat_rate(df),
        "top_products.csv": top_products(df, 50),
    }
    for filename, data in exports.items():
        st.download_button(f"⬇️ {filename}", data=data.to_csv(index=False), file_name=filename, mime="text/csv")
