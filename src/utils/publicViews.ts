import { z } from 'zod';
import type { Listing } from '../types/index.js';

/**
 * What a visitor may see of a listing: internal ids removed, a few images, and a link to the
 * Kvutsa website. The output schema is loose, so a field the backend adds later passes through.
 */
export const ListingOutputSchema = z.looseObject({
  slug: z.string(),
  url: z.string().meta({ description: 'The project page on the Kvutsa website' }),
});

const HIDDEN_LISTING_FIELDS = ['_id', 'createdBy', 'accountAliasId', 'projectId', 'demandGroupId'] as const;
const MAX_LISTING_IMAGES = 3;

export function publicListing(listing: Listing, siteUrl: string): Listing & { url: string } {
  const view: Listing & { url: string } = { ...listing, url: `${siteUrl}/projects/${encodeURIComponent(listing.slug)}` };
  for (const field of HIDDEN_LISTING_FIELDS) delete view[field];
  if (Array.isArray(view.images)) view.images = view.images.slice(0, MAX_LISTING_IMAGES);
  return view;
}
