"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FieldError {
  field: string;
  message: string;
}

export default function EditContactPage({
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
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    companyId: "",
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/contacts/${id}`).then((r) => r.json()),
      fetch("/api/v1/companies?limit=100").then((r) => r.json()),
    ])
      .then(([contactJson, companiesJson]) => {
        const c = contactJson.data;
        if (c) {
          setForm({
            companyId: c.companyId || "",
            firstName: c.firstName || "",
            lastName: c.lastName || "",
            title: c.title || "",
            email: c.email || "",
            phone: c.phone || "",
            notes: c.notes || "",
          });
        } else {
          setError("Contact not found.");
        }
        setCompanies(companiesJson.data || []);
      })
      .catch(() => setError("Failed to load."))
      .finally(() => setLoading(false));
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
      const res = await fetch(`/api/v1/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: form.companyId,
          firstName: form.firstName,
          lastName: form.lastName,
          title: form.title || null,
          email: form.email || null,
          phone: form.phone || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        if (body.error?.details) setFieldErrors(body.error.details);
        setError(body.error?.message || "Failed to update contact.");
        return;
      }

      router.push(`/contacts/${id}`);
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
      <Link href={`/contacts/${id}`} className="text-sm text-blue-600 hover:underline">
        &larr; Back
      </Link>
      <h1 className="text-2xl font-bold mt-3 mb-6">Edit Contact</h1>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldError("firstName") && (
              <p className="text-sm text-red-600 mt-1">{fieldError("firstName")}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldError("lastName") && (
              <p className="text-sm text-red-600 mt-1">{fieldError("lastName")}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
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
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href={`/contacts/${id}`}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 inline-flex items-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
