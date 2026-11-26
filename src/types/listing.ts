/** A public listing (presale project). kvutsa-backend returns a large, evolving object. */
export interface Listing {
  slug: string;
  images?: unknown[];
  [key: string]: unknown;
}

export const LISTING_SORTS = ['-publishedAt', 'publishedAt'] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];

export interface ListingSearchParams {
  cityCode?: number;
  page: number;
  limit: number;
  sort: ListingSort;
}

/** GET /api/listings (public, live listings only) */
export interface ListingSearchResponse {
  success: boolean;
  listings?: Listing[];
  total?: number;
  page?: number;
  limit?: number;
}
