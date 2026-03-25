"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Opportunity {
  id: string;
  type?: string | null;
  funnelStage: string;
  status: string;
  value?: string | number | null;
  company?: { id: string; name: string } | null;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatCurrency(val: string | number | null | undefined): string {
  if (val == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(val));
}

const FUNNEL_STAGES = ["Lead", "Qualified", "Discovery", "Proposal", "Demo", "Negotiation", "Closed"];
const STATUSES = ["Open", "Won", "Lost", "On Hold"];

export default function OpportunitiesListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState(searchParams.get("funnel_stage") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [repFilter, setRepFilter] = useState(searchParams.get("rep") || "");

  const page = Number(searchParams.get("page") || "1");

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (search) params.set("q", search);
    if (stageFilter) params.set("funnel_stage", stageFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (repFilter) params.set("rep", repFilter);

    try {
      const res = await fetch(`/api/v1/opportunities?${params}`);
      if (!res.ok) {
        const body = await res.json();
        setError(body.error?.message || "Failed to load opportunities.");
        return;
      }
      const json = await res.json();
      setOpportunities(json.data);
      setMeta(json.meta);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [page, search, stageFilter, statusFilter, repFilter]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  function updatePage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/opportunities?${params}`);
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (stageFilter) params.set("funnel_stage", stageFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (repFilter) params.set("rep", repFilter);
    params.set("page", "1");
    router.push(`/opportunities?${params}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Opportunities</h1>

      <form onSubmit={handleSearch} className="mb-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Search
          </button>
        </div>
      </form>

      <button
        type="button"
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="text-sm text-blue-600 hover:text-blue-700 mb-3"
      >
        {filtersOpen ? "Hide Filters" : "Filters"}
      </button>

      {filtersOpen && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Stages</option>
            {FUNNEL_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Rep"
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSearch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No opportunities found.</p>
          <Link href="/opportunities/new" className="text-blue-600 hover:text-blue-700">
            Create your first opportunity
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {opportunities.map((opp) => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:shadow-sm min-h-[48px]"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {opp.company?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {opp.type || "—"} &middot; {opp.funnelStage} &middot; {opp.status}
                  </p>
                </div>
                <span className="font-medium text-gray-900 whitespace-nowrap ml-4">
                  {formatCurrency(opp.value)}
                </span>
              </Link>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => updatePage(meta.page - 1)}
                disabled={meta.page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => updatePage(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <Link
        href="/opportunities/new"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 z-20"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
}
