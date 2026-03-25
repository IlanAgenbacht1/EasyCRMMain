"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FieldError {
  field: string;
  message: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  const [form, setForm] = useState({
    username: "",
    displayName: "",
    pin: "",
    confirmPin: "",
  });

  function fieldError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors([]);

    if (form.pin !== form.confirmPin) {
      setFieldErrors([{ field: "confirmPin", message: "PINs do not match." }]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          pin: form.pin,
          displayName: form.displayName || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        if (body.error?.details) setFieldErrors(body.error.details);
        setError(body.error?.message || "Failed to create user.");
        return;
      }

      router.push("/users");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link href="/users" className="text-sm text-blue-600 hover:underline">
        &larr; Users
      </Link>
      <h1 className="text-2xl font-bold mt-3 mb-6">Create User</h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fieldError("username") && (
            <p className="text-sm text-red-600 mt-1">{fieldError("username")}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => updateField("displayName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PIN <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            value={form.pin}
            onChange={(e) => updateField("pin", e.target.value)}
            placeholder="Minimum 6 digits"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fieldError("pin") && (
            <p className="text-sm text-red-600 mt-1">{fieldError("pin")}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm PIN <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            value={form.confirmPin}
            onChange={(e) => updateField("confirmPin", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {fieldError("confirmPin") && (
            <p className="text-sm text-red-600 mt-1">{fieldError("confirmPin")}</p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
          <Link
            href="/users"
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 inline-flex items-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
