# 🏢 Enterprise Workflows & GCP Data Pipeline Prompts

This guide contains prompts to call **`enterprise-m365-migration-plugin`** and **GCP Data Pipeline skills** (`bigquery-sql`, `bigquery-ai-ml`, `dataform-bigquery`, `gcp-spark`).

---

## 1. Enterprise Approval Workflows (`enterprise-approval-workflow-engine`)

### Common Prompts
```text
Please use the 'enterprise-approval-workflow-engine' skill to model a multi-tier approval state machine for distribution purchase orders.
```

### Specific Feature Prompts
* **Multi-Stage Purchase Order Sign-Off:**
  ```text
  Design a state machine using 'enterprise-approval-workflow-engine' (Draft -> Sales Review -> Warehouse Manager Sign-Off -> Dispatched -> Closed) with digital signature capture and immutable audit logs.
  ```

---

## 2. Power Platform & Dataverse Integration (`power-platform-dataverse-bridge`)

### Common Prompts
```text
Use the 'power-platform-dataverse-bridge' skill to design Dataverse tables and Power Automate flow triggers for order synchronization.
```

### Specific Feature Prompts
* **Dataverse Sync Flow:**
  ```text
  Create a sync service using 'power-platform-dataverse-bridge' that exports confirmed SaltDistribute orders to Microsoft Dataverse custom entities via REST Web API.
  ```

---

## 3. BigQuery Analytics & Machine Learning (`bigquery-sql` / `bigquery-ai-ml`)

### Common Prompts
```text
Use the 'bigquery-sql' skill to design and optimize analytical queries for salt demand forecasting and distributor performance.
```

### Specific Feature Prompts
* **Demand Forecasting Query:**
  ```text
  Using 'bigquery-ai-ml', write an ARIMA_PLUS time-series forecasting model query over historical salt shipments to predict inventory requirements for the upcoming quarter.
  ```
* **Query Performance & Cost Optimization:**
  ```text
  Analyze and optimize our high-volume order extraction queries using 'bigquery-sql' with partitioning by order_date and clustering by tenant_id.
  ```
