// =============================================================================
// Standard Error Responses (Spec Section 7.3)
//
// Envelope: { error: { code, message, details? } }
// Error codes: VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, CONFLICT,
//              DEPENDENCY_EXISTS, RATE_LIMITED, INTERNAL_ERROR
// =============================================================================

import { NextResponse } from "next/server";

/** A single field-level validation error. */
interface FieldError {
  field: string;
  message: string;
  rule: string;
}

/** The standard error response envelope. */
interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: FieldError[];
  };
}

function errorResponse(status: number, code: string, message: string, details?: FieldError[]) {
  const body: ErrorBody = {
    error: { code, message, ...(details ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

// --- 400 Bad Request ---
export function badRequest(message: string, details?: FieldError[]) {
  return errorResponse(400, "VALIDATION_ERROR", message, details);
}

// --- 401 Unauthorized ---
export function unauthorized(message: string = "Authentication required.") {
  return errorResponse(401, "UNAUTHORIZED", message);
}

// --- 404 Not Found ---
export function notFound(message: string = "Resource not found.") {
  return errorResponse(404, "NOT_FOUND", message);
}

// --- 409 Conflict ---
export function conflict(message: string, code: string = "CONFLICT") {
  return errorResponse(409, code, message);
}

// --- 409 Dependency Exists (for cascade confirmation) ---
export function dependencyExists(message: string) {
  return errorResponse(409, "DEPENDENCY_EXISTS", message);
}

// --- 422 Unprocessable Entity ---
export function unprocessable(message: string, details?: FieldError[]) {
  return errorResponse(422, "VALIDATION_ERROR", message, details);
}

// --- 429 Too Many Requests ---
export function rateLimited(message: string = "Too many requests. Please try again later.") {
  return errorResponse(429, "RATE_LIMITED", message);
}

// --- 500 Internal Server Error ---
export function internalError(message: string = "An unexpected error occurred.") {
  return errorResponse(500, "INTERNAL_ERROR", message);
}
