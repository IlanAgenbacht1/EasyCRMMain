"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Company {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  industry?: string | null;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CompaniesListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState(searchParams.get("country") || "");
  const [industryFilter, setIndustryFilter] = useState(searchParams.get("industry") || "");

  const page = Number(searchParams.get("page") || "1");

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (search) params.set("q", search);
    if (countryFilter) params.set("country", countryFilter);
    if (industryFilter) params.set("industry", industryFilter);

    try {
      const res = await fetch(`/api/v1/companies?${params}`);
      if (!res.ok) {
        const body = await res.json();
        setError(body.error?.message || "Failed to load companies.");
        return;
      }
      const json = await res.json();
      setCompanies(json.data);
      setMeta(json.meta);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [page, search, countryFilter, industryFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  function updatePage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/companies?${params}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (countryFilter) params.set("country", countryFilter);
    if (industryFilter) params.set("industry", industryFilter);
    params.set("page", "1");
    router.push(`/companies?${params}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Companies</h1>

      <form onSubmit={handleSearch} className="mb-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
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
          <input
            type="text"
            placeholder="Country"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Industry"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
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
      ) : companies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No companies found.</p>
          <Link href="/companies/new" className="text-blue-600 hover:text-blue-700">
            Create your first company
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="block p-4 bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:shadow-sm min-h-[48px]"
              >
                <p className="font-semibold text-gray-900 truncate">{company.name}</p>
                {(company.city || company.country) && (
                  <p className="text-sm text-gray-500 truncate">
                    {[company.city, company.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {company.industry && (
                  <p className="text-sm text-gray-400 truncate">{company.industry}</p>
                )}
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

      {/* FAB */}
      <Link
        href="/companies/new"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 z-20"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
}
