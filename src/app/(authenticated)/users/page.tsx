"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  username: string;
  displayName?: string | null;
  isActive: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toggleUser, setToggleUser] = useState<User | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  async function fetchUsers() {
    try {
      const res = await fetch("/api/v1/users?limit=100");
      if (!res.ok) {
        setError("Failed to load users.");
        return;
      }
      const json = await res.json();
      setUsers(json.data);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function confirmToggleActive() {
    if (!toggleUser) return;
    setToggleLoading(true);
    try {
      const res = await fetch(`/api/v1/users/${toggleUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !toggleUser.isActive }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === toggleUser.id ? { ...u, isActive: !toggleUser.isActive } : u
          )
        );
      }
    } catch {
      setError("Failed to update user.");
    } finally {
      setToggleLoading(false);
      setToggleUser(null);
    }
  }

  async function handleResetPin() {
    if (!resetUserId) return;
    setResetLoading(true);
    setResetError("");

    try {
      const res = await fetch(`/api/v1/users/${resetUserId}/reset-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: resetPin }),
      });

      if (!res.ok) {
        const body = await res.json();
        setResetError(body.error?.details?.[0]?.message || body.error?.message || "Failed to reset PIN.");
        return;
      }

      setResetUserId(null);
      setResetPin("");
    } catch {
      setResetError("Network error.");
    } finally {
      setResetLoading(false);
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link
          href="/users/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          Create User
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {users.length === 0 ? (
        <p className="text-center py-12 text-gray-500">No users found.</p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-md"
            >
              <div className="min-w-0 flex-1 mr-2">
                <p className="font-semibold text-gray-900 truncate">{user.username}</p>
                {user.displayName && (
                  <p className="text-sm text-gray-500 truncate">{user.displayName}</p>
                )}
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                    user.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.isActive ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setToggleUser(user)}
                  className={`px-3 py-1.5 text-xs rounded-md border ${
                    user.isActive
                      ? "text-red-600 border-red-300 hover:bg-red-50"
                      : "text-green-600 border-green-300 hover:bg-green-50"
                  }`}
                >
                  {user.isActive ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => {
                    setResetUserId(user.id);
                    setResetPin("");
                    setResetError("");
                  }}
                  className="px-3 py-1.5 text-xs text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  Reset PIN
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toggle Active Confirmation */}
      {toggleUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">
              {toggleUser.isActive ? "Disable" : "Enable"} User
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to {toggleUser.isActive ? "disable" : "enable"}{" "}
              <strong>{toggleUser.username}</strong>?
              {toggleUser.isActive &&
                " They will no longer be able to log in."}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setToggleUser(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleActive}
                disabled={toggleLoading}
                className={`px-4 py-2 text-sm text-white rounded-md disabled:opacity-50 ${
                  toggleUser.isActive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {toggleLoading
                  ? "Updating..."
                  : toggleUser.isActive
                  ? "Disable"
                  : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {resetUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Reset PIN</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={resetPin}
                onChange={(e) => setResetPin(e.target.value)}
                placeholder="Minimum 6 digits"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {resetError && (
                <p className="text-sm text-red-600 mt-1">{resetError}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setResetUserId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPin}
                disabled={resetLoading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {resetLoading ? "Resetting..." : "Reset PIN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
