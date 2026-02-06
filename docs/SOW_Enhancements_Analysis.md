# SOW Enhancements — Research & Recommendations

## Summary

Based on standard SOW practice (DoD, NASA, state/federal procurement, consulting templates), the following additions make sense for your VMS SOW product. **Start/end date**, **cost center**, and **milestone acceptance criteria** are called out explicitly; the rest are high-value options.

---

## 1. Period of Performance: Start & End Date

**Why:** Every SOW should define the **period of performance** — the timeframe during which contract requirements are executed. Start and end dates are required in many procurement frameworks (e.g. FAR) and drive planning, invoicing windows, and compliance.

**Current state:** You already have `effectiveDate` and `endDate` on the SOW model but they may not be clearly exposed on the create form or labeled as “Period of performance.”

**Recommendation:**
- Expose **Start date** and **End date** on the New SOW form (and detail view) under a clear “Period of performance” label.
- Use these for reporting, “current vs planned end” compliance, and future invoicing windows.
- Optional: **Notice to proceed (NTP) date** if work starts only after a formal go-ahead.

---

## 2. Cost Center / Charge Code

**Why:** Cost centers and charge codes link the SOW to **project accounting**: budgeting, cost allocation, internal chargebacks, and financial reporting. They answer “which cost center or project code does this SOW charge to?”

**Recommendation:**
- Add **Cost center** (or **Charge code**) on the SOW — e.g. a string like `CC-IT-2024-001` or a reference to an internal code.
- Optional: separate **Budget code** or **WBS element** if you need to align to project breakdown structures.
- Enables: reporting by cost center, budget checks, and integration with ERP/finance later.

---

## 3. Milestone Acceptance Criteria

**Why:** Milestones should be more than “title + amount + date.” **Acceptance criteria** define *how* completion is verified and when the client can accept the deliverable (and when payment can be released). Best practice is pass/fail, measurable criteria defined up front.

**Recommendation:**
- Add **Acceptance criteria** to each milestone (e.g. a text field or rich text): “Deliverable accepted when: UAT sign-off received; no P1 bugs open; documentation delivered.”
- Optionally: **Acceptance method** (e.g. “Client sign-off”, “Test report”, “Demo”) and **Acceptance due (days after delivery)**.
- This supports: milestone-based invoicing (invoice only when criteria are met), fewer disputes, and clearer audit trail.

---

## 4. Other High-Value Additions (from research)

| Field / Section | Purpose | Priority |
|------------------|--------|----------|
| **Location** | Where work will be performed (onsite, remote, hybrid, address). Required in many SOWs. | High |
| **Out of scope** | Explicit list of what is *not* included. Reduces scope creep and disputes. | High |
| **Assumptions** | What both parties assume (e.g. “Client provides API access by X date”). Often listed with scope. | High |
| **Applicable standards** | References to industry/regulatory standards (e.g. ISO, SOC2). | Medium |
| **Client point of contact (POC)** | Who on the client side approves deliverables / accepts milestones. | High |
| **Change order process** | How scope/date/cost changes are requested, approved, and documented. | Medium |
| **Definitions & acronyms** | Short glossary to avoid ambiguity (optional, can be a single text block). | Low |
| **Workforce / staffing requirements** | Roles, FTE, or certifications required (especially for Managed Service / T&M). | Medium |

---

## 5. Suggested Implementation Order

1. **Period of performance** — Expose start/end clearly on create form and detail.
2. **Cost center** — Add `costCenter` (or `chargeCode`) to SOW; add to form and list/detail.
3. **Milestone acceptance criteria** — Add `acceptanceCriteria` (and optionally `acceptanceMethod`) to `SOWMilestone`; add to milestone rows on form and to milestone table on detail.
4. **Location** — Add `location` or `placeOfPerformance` (optional text) to SOW.
5. **Out of scope** — Add `outOfScope` (text/list) to SOW.
6. **Assumptions** — Add `assumptions` (text) to SOW.
7. **Client POC** — Add `clientPocName`, `clientPocEmail` (optional) to SOW.

---

## 6. Data Model Additions (concise)

```text
SOW
  - effectiveDate, endDate     (already exist; use as period of performance)
  - costCenter                 String?   e.g. "CC-IT-2024-001"
  - location                   String?   e.g. "Remote", "Onsite – NYC"
  - outOfScope                 String?   @db.Text
  - assumptions                String?   @db.Text
  - clientPocName              String?
  - clientPocEmail             String?

SOWMilestone
  - acceptanceCriteria         String?   @db.Text  (how completion is verified)
  - acceptanceMethod          String?   e.g. "Sign-off", "Test report" (optional)
```

---

## 7. References (conceptual)

- DoD Handbook for Preparation of Statement of Work (SOW)
- FAR 8.405-2, 37.602 (period of performance, deliverables, acceptance)
- State procurement SOW guidelines (e.g. Oregon, California SIMM)
- Consulting SOW templates (scope, deliverables, KPIs, governance, acceptance criteria)

Implementing **start/end date** (period of performance), **cost center**, and **milestone acceptance criteria** first will align the product with common SOW practice and support invoicing, accounting, and acceptance workflows.
