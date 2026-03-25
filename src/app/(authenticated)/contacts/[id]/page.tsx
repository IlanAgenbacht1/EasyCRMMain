"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  company?: { id: string; name: string } | null;
}

export default function ContactDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/contacts/${id}`);
        if (!res.ok) {
          const body = await res.json();
          setError(body.error?.message || "Contact not found.");
          return;
        }
        const json = await res.json();
        setContact(json.data);
      } catch {
        setError("Failed to load contact.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/contacts");
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

  if (error || !contact) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{error || "Contact not found."}</p>
        <Link href="/contacts" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to contacts
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/contacts" className="text-sm text-blue-600 hover:underline">
        &larr; Contacts
      </Link>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {contact.firstName} {contact.lastName}
          </h1>
          {contact.title && <p className="text-gray-500">{contact.title}</p>}
          {contact.company && (
            <Link
              href={`/companies/${contact.company.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {contact.company.name}
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/contacts/${id}/edit`}
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

      <section className="mt-6 p-4 bg-white border border-gray-200 rounded-md space-y-3">
        {contact.email && (
          <div>
            <span className="text-sm text-gray-500">Email</span>
            <p>
              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                {contact.email}
              </a>
            </p>
          </div>
        )}
        {contact.phone && (
          <div>
            <span className="text-sm text-gray-500">Phone</span>
            <p>
              <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                {contact.phone}
              </a>
            </p>
          </div>
        )}
      </section>

      {contact.notes && (
        <section className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
        </section>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Delete Contact</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <strong>{contact.firstName} {contact.lastName}</strong>?
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
