# VMS SOW

AI-enabled VMS Statement of Work app with role-based workflow.

## Roles

- **Hiring Manager (HM)** — Creates and submits SOWs.
- **OPS Team** — Reviews and approves after HM submit.
- **Supplier** — Reviews and accepts or rejects the SOW.
- **Approver** — Financial approval based on **signature authority limit** (SOW value must be ≤ approver’s limit).

## Workflow

1. **HM** creates SOW (DRAFT) and **submits** → status **SUBMITTED**.
2. **OPS** reviews and **approves** → status **OPS_APPROVED**.
3. **Supplier** **accepts** or **rejects**.
   - Accept → status **PENDING_FINANCIAL_APPROVAL**.
   - Reject → status **SUPPLIER_REJECTED**.
4. **Approver** (with signature limit ≥ SOW value) **approves** or **rejects**.
   - Approve → status **ACTIVE**.
   - Reject → status **FINANCIALLY_REJECTED**.

## Setup

### 1. Start PostgreSQL (Docker Desktop)

```bash
docker compose up -d
```

Database: `vms_sow` on `localhost:5434` (user/password: `postgres`/`postgres`). If 5434 is in use, change the port in `docker-compose.yml` and `.env`.

### 2. Install and DB

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

### 3. Run app

```bash
npm run dev
```

Open the URL shown in the terminal (e.g. [http://localhost:3000](http://localhost:3000)). Sign in with a seeded user (password for all: **password123**):

### 4. Enable AI-assisted SOW drafting (optional)

1. Copy `.env.example` to `.env` if you haven’t already.
2. Add your OpenAI API key to `.env`:
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Restart the dev server (`npm run dev`).

Then, as **Hiring Manager** (hm@vms.local), go to **New SOW** and use the **“Draft with AI”** section: describe the SOW in a few sentences and click **Generate draft** to pre-fill the form.

| Role     | Email                |
|----------|----------------------|
| HM       | hm@vms.local         |
| OPS      | ops@vms.local        |
| Approver $50k  | approver50@vms.local  |
| Approver $200k | approver200@vms.local |
| Supplier | supplier@vms.local   |

## Seed data

- One sample SOW in DRAFT (HM can submit).
- Two approvers with signature limits: $50,000 and $200,000. The sample SOW has $75,000 → only the $200k approver can financially approve it after supplier accepts.
