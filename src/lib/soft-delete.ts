// =============================================================================
// Soft-Delete Helpers (Spec Sections 5.1 & 5.6)
//
// - All normal queries filter where deleted_at IS NULL.
// - Deletes set deleted_at + deleted_by instead of removing records.
// - Deleting a Company cascades to its Contacts and Opportunities.
// =============================================================================

import { prisma } from "./prisma";

/**
 * The standard WHERE clause to exclude soft-deleted records.
 * Append this to every Prisma `where` argument.
 */
export const notDeleted = { deletedAt: null } as const;

/**
 * Build the data payload for a soft-delete operation.
 */
export function softDeleteData(userId: string) {
  return {
    deletedAt: new Date(),
    deletedBy: userId,
  };
}

/**
 * Soft-delete a Company and cascade to its Contacts and Opportunities.
 * Runs in a single transaction per Section 5.6.
 */
export async function softDeleteCompanyCascade(companyId: string, userId: string) {
  const data = softDeleteData(userId);

  return prisma.$transaction([
    prisma.contact.updateMany({
      where: { companyId, deletedAt: null },
      data,
    }),
    prisma.opportunity.updateMany({
      where: { companyId, deletedAt: null },
      data,
    }),
    prisma.company.update({
      where: { id: companyId },
      data,
    }),
  ]);
}

/**
 * Restore a soft-deleted Company (without restoring children, per Section 5.6).
 */
export async function restoreCompany(companyId: string) {
  return prisma.company.update({
    where: { id: companyId },
    data: { deletedAt: null, deletedBy: null },
  });
}
