"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import type { SowDraftResponse } from "@/app/api/ai/sow-draft/route";

type Vendor = { id: string; name: string };

export type MilestoneInput = {
  title: string;
  amount: string;
  dueDate: string;
  recurring: boolean;
  acceptanceCriteria: string;
  acceptanceMethod: string;
};

type TemplateType = "MANAGED_PROJECT" | "MANAGED_SERVICE" | "T_M";

const emptyForm: {
  title: string;
  description: string;
  templateType: TemplateType;
  language: string;
  effectiveDate: string;
  endDate: string;
  costCenter: string;
  location: string;
  outOfScope: string;
  assumptions: string;
  clientPocName: string;
  clientPocEmail: string;
  paymentTerms: string;
} = {
  title: "",
  description: "",
  templateType: "MANAGED_PROJECT",
  language: "",
  effectiveDate: "",
  endDate: "",
  costCenter: "",
  location: "",
  outOfScope: "",
  assumptions: "",
  clientPocName: "",
  clientPocEmail: "",
  paymentTerms: "",
};

export function CreateSOWForm({
  vendors,
  userId,
}: {
  vendors: Vendor[];
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [aiBrief, setAiBrief] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "financials">("overview");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", amount: "", dueDate: "", recurring: false, acceptanceCriteria: "", acceptanceMethod: "" },
  ]);

  function addMilestone() {
    setMilestones((m) => [...m, { title: "", amount: "", dueDate: "", recurring: false, acceptanceCriteria: "", acceptanceMethod: "" }]);
  }
  function removeMilestone(i: number) {
    setMilestones((m) => m.filter((_, idx) => idx !== i));
  }
  function updateMilestone(i: number, field: keyof MilestoneInput, value: string | boolean) {
    setMilestones((m) => {
      const next = [...m];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((data) => setAiConfigured(Boolean(data?.configured)))
      .catch(() => setAiConfigured(false));
  }, []);

  const totalFromMilestones = milestones.reduce((sum, m) => {
    const n = Number(m.amount);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  async function handleGenerateDraft() {
    if (!aiBrief.trim()) {
      setAiError("Describe the SOW in a few sentences.");
      return;
    }
    setAiError("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/sow-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: aiBrief.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate draft");
      }
      const draft: SowDraftResponse = await res.json();
      setForm({
        title: draft.title || "",
        description: draft.description || "",
        templateType: draft.templateType,
        language: draft.language || "",
        effectiveDate: draft.effectiveDate || "",
        endDate: draft.endDate || "",
        costCenter: draft.costCenter || "",
        location: draft.location || "",
        outOfScope: draft.outOfScope || "",
        assumptions: draft.assumptions || "",
        clientPocName: draft.clientPocName || "",
        clientPocEmail: draft.clientPocEmail || "",
        paymentTerms: draft.paymentTerms || "",
      });
      setMilestones(
        draft.milestones.length > 0
          ? draft.milestones.map((m) => ({
              title: m.title,
              amount: String(m.amount),
              dueDate: m.dueDate || "",
              recurring: Boolean(m.recurring),
              acceptanceCriteria: m.acceptanceCriteria || "",
              acceptanceMethod: m.acceptanceMethod || "",
            }))
          : [{ title: "", amount: "", dueDate: "", recurring: false, acceptanceCriteria: "", acceptanceMethod: "" }]
      );
      if (draft.milestones.length > 0) setActiveTab("financials");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI draft failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formEl = e.currentTarget;
    const formData = new FormData(formEl);
    const title = form.title.trim();
    const description = form.description.trim();
    const templateType = form.templateType;
    const language = form.language || null;
    const paymentTerms = form.paymentTerms.trim() || null;
    const vendorId = formData.get("vendorId") ? String(formData.get("vendorId")) : null;

    const effectiveDate = form.effectiveDate || null;
    const endDate = form.endDate || null;
    const costCenter = form.costCenter.trim() || null;
    const location = form.location.trim() || null;
    const outOfScope = form.outOfScope.trim() || null;
    const assumptions = form.assumptions.trim() || null;
    const clientPocName = form.clientPocName.trim() || null;
    const clientPocEmail = form.clientPocEmail.trim() || null;

    const milestonePayload = milestones
      .map((m) => ({
        title: m.title.trim(),
        amount: Number(m.amount),
        dueDate: m.dueDate.trim() || null,
        recurring: Boolean(m.recurring),
        acceptanceCriteria: m.acceptanceCriteria.trim() || null,
        acceptanceMethod: m.acceptanceMethod.trim() || null,
      }))
      .filter((m) => m.title && Number.isFinite(m.amount) && m.amount > 0);

    if (milestonePayload.length === 0) {
      setError("Add at least one milestone with a title and amount.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/sows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          templateType,
          language: language || null,
          effectiveDate: effectiveDate || null,
          endDate: endDate || null,
          costCenter: costCenter || null,
          location: location || null,
          outOfScope: outOfScope || null,
          assumptions: assumptions || null,
          clientPocName: clientPocName || null,
          clientPocEmail: clientPocEmail || null,
          milestones: milestonePayload.length ? milestonePayload : undefined,
          paymentTerms: paymentTerms || null,
          vendorId,
          submittedById: userId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create SOW");
      }
      const { id } = await res.json();
      router.push(`/dashboard/sows/${id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {error && <p className="text-sm text-red-600 px-6 pt-4">{error}</p>}

      <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as "overview" | "financials")} className="w-full">
        <Tabs.List className="flex border-b border-gray-200 bg-gray-50 px-6 gap-1">
          <Tabs.Trigger
            value="overview"
            className="px-4 py-3 text-sm font-medium data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-t -mb-px"
          >
            Overview & scope
          </Tabs.Trigger>
          <Tabs.Trigger
            value="financials"
            className="px-4 py-3 text-sm font-medium data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-t -mb-px"
          >
            Financials
            {totalFromMilestones > 0 && (
              <span className="ml-1.5 text-gray-500 font-normal">
                ({new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalFromMilestones)})
              </span>
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" className="p-6 space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Draft with AI</h3>
        {aiConfigured === false && (
          <p className="text-xs text-amber-700 mb-2">
            Add <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> to <code className="bg-amber-100 px-1 rounded">.env</code> and restart the server to enable AI drafting.
          </p>
        )}
        <p className="text-xs text-blue-700 mb-2">
          Describe the SOW in a few sentences (e.g. project type, objectives, duration, budget). AI will suggest title, description, milestones, and other fields.
        </p>
        <textarea
          value={aiBrief}
          onChange={(e) => setAiBrief(e.target.value)}
          placeholder="e.g. Managed project: migrate Oracle DB to Google Cloud over 6 months, 3 phases, total budget ~$120k. Client provides access by start date."
          className="w-full rounded border border-blue-200 px-3 py-2 text-sm bg-white"
          rows={3}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={aiLoading}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aiLoading ? "Generating…" : "Generate draft"}
          </button>
          {aiError && <span className="text-sm text-red-600">{aiError}</span>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          name="title"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="e.g. IT Implementation Phase 1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Template type</label>
        <select
          name="templateType"
          value={form.templateType}
          onChange={(e) => setForm((f) => ({ ...f, templateType: e.target.value as "MANAGED_PROJECT" | "MANAGED_SERVICE" | "T_M" }))}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="MANAGED_PROJECT">Managed Project</option>
          <option value="MANAGED_SERVICE">Managed Service</option>
          <option value="T_M">T&M</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
        <select
          name="language"
          value={form.language}
          onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">— Select —</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Period of performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              name="effectiveDate"
              type="date"
              value={form.effectiveDate}
              onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cost center / Charge code</label>
        <input
          name="costCenter"
          type="text"
          value={form.costCenter}
          onChange={(e) => setForm((f) => ({ ...f, costCenter: e.target.value }))}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="e.g. CC-IT-2024-001"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          name="location"
          type="text"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="e.g. Remote, Onsite – NYC"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Out of scope</label>
        <textarea
          name="outOfScope"
          rows={2}
          value={form.outOfScope}
          onChange={(e) => setForm((f) => ({ ...f, outOfScope: e.target.value }))}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="What is explicitly excluded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assumptions</label>
        <textarea
          name="assumptions"
          rows={2}
          value={form.assumptions}
          onChange={(e) => setForm((f) => ({ ...f, assumptions: e.target.value }))}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="e.g. Client provides API access by start date"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client POC (name)</label>
          <input
            name="clientPocName"
            type="text"
            value={form.clientPocName}
            onChange={(e) => setForm((f) => ({ ...f, clientPocName: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="Point of contact for acceptance"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client POC (email)</label>
          <input
            name="clientPocEmail"
            type="email"
            value={form.clientPocEmail}
            onChange={(e) => setForm((f) => ({ ...f, clientPocEmail: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
        </Tabs.Content>

        <Tabs.Content value="financials" className="p-6 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-800 mb-3">Milestones & amounts</h3>
        <p className="text-xs text-gray-500 mb-3">
          Define each milestone and amount for invoicing. Total is the sum of milestone amounts.
        </p>
        <div className="space-y-3">
          {milestones.map((m, i) => (
            <div key={i} className="rounded border border-gray-200 p-3 bg-gray-50 space-y-2">
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-gray-500 mb-0.5">Milestone</label>
                  <input
                    type="text"
                    value={m.title}
                    onChange={(e) => updateMilestone(i, "title", e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    placeholder="e.g. Phase 1 delivery"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-gray-500 mb-0.5">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={m.amount}
                    onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="w-36">
                  <label className="block text-xs text-gray-500 mb-0.5">Due date</label>
                  <input
                    type="date"
                    value={m.dueDate}
                    onChange={(e) => updateMilestone(i, "dueDate", e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-500 mb-0.5">Acceptance method</label>
                  <select
                    value={m.acceptanceMethod}
                    onChange={(e) => updateMilestone(i, "acceptanceMethod", e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">—</option>
                    <option value="Sign-off">Sign-off</option>
                    <option value="Test report">Test report</option>
                    <option value="Demo">Demo</option>
                    <option value="Documentation">Documentation</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id={`recurring-${i}`}
                    checked={m.recurring}
                    onChange={(e) => updateMilestone(i, "recurring", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={`recurring-${i}`} className="text-xs text-gray-600 whitespace-nowrap">
                    Recurring
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeMilestone(i)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Acceptance criteria</label>
                <textarea
                  value={m.acceptanceCriteria}
                  onChange={(e) => updateMilestone(i, "acceptanceCriteria", e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  rows={2}
                  placeholder="How completion is verified (e.g. UAT sign-off; no P1 bugs)"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addMilestone}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add milestone
          </button>
        </div>
        {totalFromMilestones > 0 && (
          <p className="mt-2 text-sm font-medium text-gray-800">
            Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalFromMilestones)} USD
          </p>
        )}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment terms</label>
          <input
            name="paymentTerms"
            type="text"
            value={form.paymentTerms}
            onChange={(e) => setForm((f) => ({ ...f, paymentTerms: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. Net 30, Milestone-based"
          />
        </div>
      </div>
        </Tabs.Content>
      </Tabs.Root>

      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
        <select name="vendorId" className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="">— Select —</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        </div>
        <div className="flex gap-2 items-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create SOW
          </button>
          <a
            href="/dashboard"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </a>
        </div>
      </div>
    </form>
  );
}
