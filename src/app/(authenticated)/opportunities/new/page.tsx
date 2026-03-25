"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const FUNNEL_STAGES = ["Lead", "Qualified", "Discovery", "Proposal", "Demo", "Negotiation", "Closed"];
const STATUSES = ["Open", "Won", "Lost", "On Hold"];

interface FieldError {
  field: string;
  message: string;
}

export default function CreateOpportunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    companyId: searchParams.get("companyId") || "",
    type: "",
    funnelStage: "Lead",
    status: "Open",
    value: "",
    rep: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/v1/companies?limit=100")
      .then((r) => r.json())
      .then((json) => setCompanies(json.data || []))
      .catch(() => {});
  }, []);

  function fieldError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors([]);

    try {
      const res = await fetch("/api/v1/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: form.companyId,
          type: form.type || null,
          funnelStage: form.funnelStage,
          status: form.status,
          value: form.value ? Number(form.value) : null,
          rep: form.rep || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        if (body.error?.details) setFieldErrors(body.error.details);
        setError(body.error?.message || "Failed to create opportunity.");
        return;
      }

      const json = await res.json();
      router.push(`/opportunities/${json.data.id}`);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link href="/opportunities" className="text-sm text-blue-600 hover:underline">
        &larr; Opportunities
      </Link>
      <h1 className="text-2xl font-bold mt-3 mb-6">New Opportunity</h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={form.companyId}
            onChange={(e) => updateField("companyId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {fieldError("companyId") && (
            <p className="text-sm text-red-600 mt-1">{fieldError("companyId")}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <input
            type="text"
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
            placeholder="e.g. Enterprise License, Consulting"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Funnel Stage <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.funnelStage}
              onChange={(e) => updateField("funnelStage", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FUNNEL_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {fieldError("funnelStage") && (
              <p className="text-sm text-red-600 mt-1">{fieldError("funnelStage")}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {fieldError("status") && (
              <p className="text-sm text-red-600 mt-1">{fieldError("status")}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
          <input
            type="number"
            step="0.01"
            value={form.value}
            onChange={(e) => updateField("value", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rep</label>
          <input
            type="text"
            value={form.rep}
            onChange={(e) => updateField("rep", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Opportunity"}
          </button>
          <Link
            href="/opportunities"
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 inline-flex items-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
