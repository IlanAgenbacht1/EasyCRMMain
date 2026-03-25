"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OpportunityDetail {
  id: string;
  type?: string | null;
  funnelStage: string;
  status: string;
  value?: string | number | null;
  rep?: string | null;
  notes?: string | null;
  companyId: string;
  company?: {
    id: string;
    name: string;
    website?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  companyContacts?: {
    id: string;
    firstName: string;
    lastName: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
  }[];
}

function formatCurrency(val: string | number | null | undefined): string {
  if (val == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(val));
}

export default function OpportunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();

  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/opportunities/${id}`);
        if (!res.ok) {
          const body = await res.json();
          setError(body.error?.message || "Opportunity not found.");
          return;
        }
        const json = await res.json();
        setOpportunity(json.data);
      } catch {
        setError("Failed to load opportunity.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/opportunities/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/opportunities");
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

  if (error || !opportunity) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{error || "Opportunity not found."}</p>
        <Link href="/opportunities" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to opportunities
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/opportunities" className="text-sm text-blue-600 hover:underline">
        &larr; Opportunities
      </Link>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{opportunity.type || "Opportunity"}</h1>
          {opportunity.company && (
            <Link
              href={`/companies/${opportunity.company.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {opportunity.company.name}
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/opportunities/${id}/edit`}
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

      {/* Main details */}
      <section className="mt-6 p-4 bg-white border border-gray-200 rounded-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Type</span>
            <p className="font-medium">{opportunity.type || "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">Funnel Stage</span>
            <p className="font-medium">{opportunity.funnelStage}</p>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <p className="font-medium">{opportunity.status}</p>
          </div>
          <div>
            <span className="text-gray-500">Value</span>
            <p className="font-medium">{formatCurrency(opportunity.value)}</p>
          </div>
          <div>
            <span className="text-gray-500">Rep</span>
            <p className="font-medium">{opportunity.rep || "—"}</p>
          </div>
        </div>
      </section>

      {/* Notes */}
      {opportunity.notes && (
        <section className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{opportunity.notes}</p>
        </section>
      )}

      {/* Contacts Panel */}
      <section className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Contacts at {opportunity.company?.name || "Company"}
          </h2>
          <Link
            href={`/contacts/new?companyId=${opportunity.companyId}`}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Contact
          </Link>
        </div>

        {!opportunity.companyContacts || opportunity.companyContacts.length === 0 ? (
          <p className="text-sm text-gray-500">No contacts at this company.</p>
        ) : (
          <div className="space-y-3">
            {opportunity.companyContacts.map((contact) => (
              <div key={contact.id} className="text-sm">
                <Link
                  href={`/contacts/${contact.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  {contact.firstName} {contact.lastName}
                </Link>
                {contact.title && (
                  <span className="text-gray-500 ml-2">{contact.title}</span>
                )}
                <div className="flex gap-4 mt-0.5">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {contact.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {opportunity.company && (
          <Link
            href={`/companies/${opportunity.company.id}`}
            className="inline-block mt-3 text-sm text-blue-600 hover:underline"
          >
            View all contacts
          </Link>
        )}
      </section>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Delete Opportunity</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this opportunity?
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
