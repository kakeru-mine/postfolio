// Shared helpers for the many-to-many Collection <-> SavedItem relation.
// A saved item exposes its collections as a flat array of {id, name, color};
// Prisma returns them nested as `collections: [{ collection: {...} }]`, so we
// flatten once here and reuse the shape everywhere.

export type ItemCollection = {
  id: string;
  name: string;
  color: string;
};

// The Prisma `select`/`include` shape we use wherever a saved item's
// collections are needed for display.
export const itemCollectionsSelect = {
  collections: {
    select: {
      collection: { select: { id: true, name: true, color: true } },
    },
  },
} as const;

type RawMembership = { collection: ItemCollection };

// Turn Prisma's nested memberships into a flat, name-sorted collection array.
export function flattenItemCollections(
  memberships: RawMembership[] | undefined | null,
): ItemCollection[] {
  if (!memberships) return [];
  return memberships
    .map((membership) => membership.collection)
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}
