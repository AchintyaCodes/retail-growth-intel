# DAX Measures — Retail Growth Intelligence

Paste these into Power BI Desktop (Home → New Measure) after importing the CSV exports.

---

## Revenue measures

```dax
Total Revenue =
SUM(monthly_revenue[revenue])
```

```dax
Revenue MoM % =
VAR CurrentRevenue = [Total Revenue]
VAR PreviousRevenue =
    CALCULATE(
        [Total Revenue],
        DATEADD(monthly_revenue[month], -1, MONTH)
    )
RETURN
    IF(
        NOT ISBLANK(PreviousRevenue) && PreviousRevenue <> 0,
        DIVIDE(CurrentRevenue - PreviousRevenue, PreviousRevenue),
        BLANK()
    )
```

```dax
Revenue YTD =
TOTALYTD([Total Revenue], monthly_revenue[month])
```

---

## Basket measures

```dax
Avg Basket Value =
AVERAGE(basket_size[avg_basket_value])
```

```dax
Avg Items per Order =
AVERAGE(basket_size[avg_items])
```

---

## Customer measures

```dax
Total Customers =
DISTINCTCOUNT(rfm_customers[customer_id])
```

```dax
Avg Repeat Rate % =
AVERAGE(repeat_rate[repeat_rate])
```

```dax
Champions Revenue Share % =
CALCULATE(
    DIVIDE(
        SUM(segment_summary[total_revenue]),
        CALCULATE(SUM(segment_summary[total_revenue]), ALL(segment_summary[segment]))
    ),
    segment_summary[segment] = "Champions"
) * 100
```

```dax
At Risk + Hibernating Customers =
CALCULATE(
    SUM(segment_summary[customers]),
    segment_summary[segment] IN {"At Risk", "Hibernating"}
)
```
