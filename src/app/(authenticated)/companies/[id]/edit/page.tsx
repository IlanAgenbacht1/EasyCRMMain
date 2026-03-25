"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FieldError {
  field: string;
  message: string;
}

export default function EditCompanyPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  const [form, setForm] = useState({
    name: "",
    website: "",
    industry: "",
    headcount: "",
    annualRevenue: "",
    city: "",
    region: "",
    country: "",
    notes: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/companies/${id}`);
        if (!res.ok) {
          setError("Company not found.");
          return;
        }
        const json = await res.json();
        const c = json.data;
        setForm({
          name: c.name || "",
          website: c.website || "",
          industry: c.industry || "",
          headcount: c.headcount != null ? String(c.headcount) : "",
          annualRevenue: c.annualRevenue != null ? String(c.annualRevenue) : "",
          city: c.city || "",
          region: c.region || "",
          country: c.country || "",
          notes: c.notes || "",
        });
      } catch {
        setError("Failed to load company.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function fieldError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors([]);

    try {
      const res = await fetch(`/api/v1/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          website: form.website || null,
          industry: form.industry || null,
          headcount: form.headcount ? Number(form.headcount) : null,
          annualRevenue: form.annualRevenue ? Number(form.annualRevenue) : null,
          city: form.city || null,
          region: form.region || null,
          country: form.country || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        if (body.error?.details) setFieldErrors(body.error.details);
        setError(body.error?.message || "Failed to update company.");
        return;
      }

      router.push(`/companies/${id}`);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <Link href={`/companies/${id}`} className="text-sm text-blue-600 hover:underline">
        &larr; Back
      </Link>
      <h1 className="text-2xl font-bold mt-3 mb-6">Edit Company</h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fieldError("name") && (
            <p className="text-sm text-red-600 mt-1">{fieldError("name")}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="text"
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <input
            type="text"
            value={form.industry}
            onChange={(e) => updateField("industry", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headcount</label>
            <input
              type="number"
              value={form.headcount}
              onChange={(e) => updateField("headcount", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Revenue</label>
            <input
              type="number"
              step="0.01"
              value={form.annualRevenue}
              onChange={(e) => updateField("annualRevenue", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => updateField("region", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href={`/companies/${id}`}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 inline-flex items-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
