"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  headcount?: number | null;
  annualRevenue?: string | number | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  notes?: string | null;
  _count?: { contacts: number; opportunities: number };
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title?: string | null;
}

interface Opportunity {
  id: string;
  type?: string | null;
  funnelStage: string;
  status: string;
  value?: string | number | null;
}

function formatCurrency(val: string | number | null | undefined): string {
  if (val == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(val));
}

function formatNumber(val: number | null | undefined): string {
  if (val == null) return "—";
  return new Intl.NumberFormat("en-US").format(val);
}

export default function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [compRes, contRes, oppRes] = await Promise.all([
          fetch(`/api/v1/companies/${id}`),
          fetch(`/api/v1/companies/${id}/contacts?limit=100`),
          fetch(`/api/v1/companies/${id}/opportunities?limit=100`),
        ]);

        if (!compRes.ok) {
          const body = await compRes.json();
          setError(body.error?.message || "Company not found.");
          return;
        }

        const compJson = await compRes.json();
        setCompany(compJson.data);

        if (contRes.ok) {
          const contJson = await contRes.json();
          setContacts(contJson.data);
        }
        if (oppRes.ok) {
          const oppJson = await oppRes.json();
          setOpportunities(oppJson.data);
        }
      } catch {
        setError("Failed to load company.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    const hasDependents =
      (company?._count?.contacts ?? 0) > 0 ||
      (company?._count?.opportunities ?? 0) > 0;

    try {
      const res = await fetch(`/api/v1/companies/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: hasDependents ? JSON.stringify({ cascade: true }) : undefined,
      });

      if (res.ok) {
        router.push("/companies");
      } else {
        const body = await res.json();
        setError(body.error?.message || "Failed to delete.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{error || "Company not found."}</p>
        <Link href="/companies" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to companies
        </Link>
      </div>
    );
  }

  const location = [company.city, company.region, company.country].filter(Boolean).join(", ");

  return (
    <div>
      <Link href="/companies" className="text-sm text-blue-600 hover:underline">
        &larr; Companies
      </Link>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {company.website}
            </a>
          )}
          {location && <p className="text-sm text-gray-500 mt-1">{location}</p>}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/companies/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-red-600 text-sm border border-red-300 rounded-md hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Overview */}
      <section className="mt-6 p-4 bg-white border border-gray-200 rounded-md">
        <h2 className="text-lg font-semibold mb-3">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Industry</span>
            <p className="font-medium">{company.industry || "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">Headcount</span>
            <p className="font-medium">{formatNumber(company.headcount)}</p>
          </div>
          <div>
            <span className="text-gray-500">Annual Revenue</span>
            <p className="font-medium">{formatCurrency(company.annualRevenue)}</p>
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Contacts ({company._count?.contacts ?? contacts.length})
          </h2>
          <Link
            href={`/contacts/new?companyId=${id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Contact
          </Link>
        </div>
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500">No contacts yet.</p>
        ) : (
          <div className="space-y-2">
            {contacts.map((c) => (
              <Link
                key={c.id}
                href={`/contacts/${c.id}`}
                className="block p-2 rounded hover:bg-gray-50 text-sm"
              >
                <span className="font-medium">
                  {c.firstName} {c.lastName}
                </span>
                {c.title && <span className="text-gray-500 ml-2">{c.title}</span>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Opportunities */}
      <section className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Opportunities ({company._count?.opportunities ?? opportunities.length})
          </h2>
          <Link
            href={`/opportunities/new?companyId=${id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Opportunity
          </Link>
        </div>
        {opportunities.length === 0 ? (
          <p className="text-sm text-gray-500">No opportunities yet.</p>
        ) : (
          <div className="space-y-2">
            {opportunities.map((o) => (
              <Link
                key={o.id}
                href={`/opportunities/${o.id}`}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 text-sm"
              >
                <span>
                  {o.type || "—"} &middot; {o.funnelStage} &middot; {o.status}
                </span>
                <span className="font-medium">{formatCurrency(o.value)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Notes */}
      {company.notes && (
        <section className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{company.notes}</p>
        </section>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Delete Company</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{company.name}</strong>?
              {((company._count?.contacts ?? 0) > 0 ||
                (company._count?.opportunities ?? 0) > 0) && (
                <>
                  {" "}This will also delete {company._count?.contacts ?? 0} contact(s) and{" "}
                  {company._count?.opportunities ?? 0} opportunity(ies).
                </>
              )}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
