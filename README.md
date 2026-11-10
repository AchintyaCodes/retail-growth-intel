# Retail Growth Intelligence

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-2.0-150458?style=flat&logo=pandas&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-2.0-189AB4?style=flat)
![Streamlit](https://img.shields.io/badge/Streamlit-1.35-FF4B4B?style=flat&logo=streamlit&logoColor=white)
![Power BI](https://img.shields.io/badge/Power%20BI-DAX%20assets-F2C811?style=flat&logo=powerbi&logoColor=black)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3-F7931E?style=flat&logo=scikit-learn&logoColor=white)

> **Portfolio project** — end-to-end retail analytics on [UCI Online Retail II](https://archive.ics.uci.edu/dataset/502/online+retail+ii).
> All results characterise this **public dataset** only. Not attributable to any real business.

---

## What this is

A production-style retail analytics pipeline covering the full stack from raw transaction data to a customer-facing dashboard and a machine-learning propensity model: ETL cleaning → RFM segmentation → monthly KPI reporting → 30-day repurchase prediction. Includes Power BI DAX measures and a KPI dictionary for BI reporting.

---

## Live results

| Metric | Value |
|---|---|
| Raw transactions | 1,067,371 |
| After cleaning | **793,609** (74.4% retained) |
| Unique customers | ~5,900 |
| Total revenue (2 years) | £9.7M |
| Champions + Loyal revenue share | ~65% |
| At Risk + Hibernating customers | ~900 |
| Repurchase model AUC-ROC | **0.77** |
| **Precision@500** | **58.6%** |
| **Lift@500** | **2.75×** baseline |
| Baseline repeat rate | 21.3% |

---

## Architecture

```mermaid
graph TD
    A[UCI Online Retail II<br/>Excel, 1.07M rows] --> B[pipeline.py<br/>ETL & Cleaning]

    B --> B1[Remove cancellations]
    B --> B2[Remove returns]
    B --> B3[Drop missing CustomerID]
    B --> B4[Drop zero-price rows]
    B --> B5[Deduplicate]
    B1 & B2 & B3 & B4 & B5 --> C[793K clean rows<br/>Parquet cache]

    C --> D[kpis.py]
    D --> D1[Monthly Revenue]
    D --> D2[Basket Size]
    D --> D3[Repeat Rate]
    D --> D4[Top Products]
    D --> D5[Country Revenue]

    C --> E[rfm_segmentation.py]
    E --> E4[7 Named Segments<br/>Champions to Lost]

    C --> F[repurchase_model.py]
    F --> F5[XGBoost Classifier]
    F5 --> F6[AUC-ROC 0.77 · Precision@500 58.6% · Lift@500 2.75x]

    D1 & D2 & D3 & D4 & D5 & E4 & F6 --> G[Streamlit Dashboard<br/>5 tabs]
    D1 & D2 & D3 & E4 --> H[CSV Export for Power BI]
    H --> I[powerbi/dax_measures.md]
    H --> J[powerbi/kpi_dictionary.md]
```

---

## ETL pipeline

```mermaid
flowchart TD
    A[Raw Excel 1,067,371 rows] --> B[Normalise column names]
    B --> C[Parse InvoiceDate]
    C --> D{Invoice starts with C?}
    D -->|Yes| D1[Drop cancellation]
    D -->|No| E{Quantity <= 0?}
    E -->|Yes| E1[Drop return/error]
    E -->|No| F{UnitPrice <= 0?}
    F -->|Yes| F1[Drop pricing error]
    F -->|No| G{CustomerID missing?}
    G -->|Yes| G1[Drop unattributable row]
    G -->|No| H{Duplicate row?}
    H -->|Yes| H1[Drop duplicate]
    H -->|No| I[Compute revenue = Quantity x UnitPrice]
    I --> J[793,609 clean rows saved as Parquet]
```

---

## RFM segmentation rules

```mermaid
flowchart TD
    A[Customer transaction history] --> B[Compute R, F, M]
    B --> C[Quartile score each: 1=worst, 4=best]
    C --> D{R=4 and F>=3 and M>=3?}
    D -->|Yes| S1[Champions]
    D -->|No| E{R>=3 and F>=3?}
    E -->|Yes| S2[Loyal]
    E -->|No| F{R=4 and F=2?}
    F -->|Yes| S3[Potential Loyal]
    F -->|No| G{R>=3 and F=1?}
    G -->|Yes| S4[Promising]
    G -->|No| H{R=2 and F>=2?}
    H -->|Yes| S5[At Risk]
    H -->|No| I{R=1 and F>=2 or R=2 F=1?}
    I -->|Yes| S6[Hibernating]
    I -->|No| S7[Lost]
```

---

## Project structure

```
retail-growth-intel/
├── app.py                  # Streamlit dashboard (5 tabs)
├── src/
│   ├── pipeline.py          # Download UCI Excel + ETL cleaning
│   ├── rfm_segmentation.py  # RFM scoring + 7 segment rules
│   ├── kpis.py              # Revenue, basket, repeat rate, returns
│   └── repurchase_model.py  # Feature engineering + XGBoost + P@K
├── powerbi/
│   ├── dax_measures.md      # Paste-ready DAX measures
│   └── kpi_dictionary.md    # Metric definitions + segment rules
└── data/                    # Downloaded on first run (gitignored)
```

---

## Run locally

```bash
git clone https://github.com/AchintyaCodes/retail-growth-intel
cd retail-growth-intel
pip install -r requirements.txt
streamlit run app.py
# Downloads UCI dataset (~45 MB) and cleans it on first run (~30 s)
# Parquet cache used on subsequent runs (~1 s)
```

---

## Tech stack

| Layer | Library / Tool | Purpose |
|---|---|---|
| Data ingestion | `requests`, `openpyxl` | Download + read UCI Excel |
| ETL | `pandas` | Cleaning, dedup, feature engineering |
| Segmentation | `pandas` (quartile cuts) | RFM scoring + rule-based segments |
| ML model | `xgboost`, `scikit-learn` | 30-day repurchase propensity |
| Cache | `pyarrow` Parquet | Skip 20-second Excel parse on re-runs |
| Dashboard | `streamlit`, `plotly` | 5-tab interactive app |
| BI assets | Markdown DAX | Power BI Desktop import |

---

## Resume bullet

> Built a Python ETL pipeline cleaning **793K** retail transactions and a Power BI dashboard on revenue, basket size, repeat rate and segment trends. A 30-day repurchase XGBoost model reached **58.6% precision on the top 500 customers** — **2.75× the baseline repeat rate**.

---

*Built by [Achintya Gupta](https://github.com/AchintyaCodes) · Data Science & Engineering, MIT Manipal*
