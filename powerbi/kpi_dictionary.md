# KPI Dictionary — Retail Growth Intelligence

> Version 1.0 · Dataset: UCI Online Retail II (Dec 2009 – Dec 2011)

All metrics are computed from cleaned transaction data. "Clean" means:
cancellations removed, returns (negative quantity) removed, rows with missing
CustomerID removed, duplicate rows removed, zero-price rows removed.

---

## Revenue KPIs

| KPI | Definition | Unit | Calculation |
|-----|------------|------|-------------|
| **Total Revenue** | Sum of (Quantity × UnitPrice) for all clean orders in the period | £ | `SUM(quantity * unit_price)` |
| **Revenue MoM %** | Month-over-month revenue growth | % | `(Rev_t − Rev_{t−1}) / Rev_{t−1}` |
| **Revenue YTD** | Year-to-date cumulative revenue | £ | Cumulative sum Jan–current month |

---

## Basket KPIs

| KPI | Definition | Unit | Calculation |
|-----|------------|------|-------------|
| **Average Basket Value** | Mean spend per invoice (clean orders only) | £ | `SUM(revenue) / COUNT(DISTINCT invoice)` |
| **Avg Items per Order** | Mean total quantity per invoice | Units | `SUM(quantity) / COUNT(DISTINCT invoice)` |
| **Avg SKUs per Order** | Mean distinct stock codes per invoice | Count | `COUNT(DISTINCT stock_code per invoice)` / orders |

---

## Customer KPIs

| KPI | Definition | Unit | Calculation |
|-----|------------|------|-------------|
| **Active Customers (month)** | Distinct customers with at least one clean order in the month | Count | `COUNT(DISTINCT customer_id)` |
| **Repeat Purchase Rate** | % of active customers this month who also ordered in a prior month | % | `repeat_customers / total_active_customers × 100` |
| **Customer Lifetime Value (LTV)** | Average cumulative revenue per customer | £ | `SUM(revenue) / COUNT(DISTINCT customer_id)` |

---

## RFM Segment Definitions

| Segment | Recency score | Frequency score | Monetary score |
|---------|--------------|-----------------|----------------|
| Champions | 4 | ≥ 3 | ≥ 3 |
| Loyal | ≥ 3 | ≥ 3 | any |
| Potential Loyal | ≥ 3 | 2 | any |
| Promising | 3–4 | 1 | any |
| At Risk | 2 | ≥ 2 | any |
| Hibernating | 1–2 | 1 | any |
| Lost | 1 | 1 | any |

Scores are quartile-based (1 = lowest, 4 = highest).
