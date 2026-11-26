import { z } from 'zod';
import { READ_ONLY, createMcpError, createMcpErrorResponse, createMcpSuccessResponse } from '../../../services/mcpResponse.js';
import type { KvutsaBackendClient } from '../../../services/kvutsaBackendClient.js';
import { LISTING_SORTS, type City, type McpTool } from '../../../types/index.js';
import { loadToolDescription } from '../../../utils/loadToolDescription.js';
import { ListingOutputSchema, publicListing } from '../../../utils/publicViews.js';

const inputSchema = z.object({
  city: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .meta({ description: 'City name in Hebrew or English, e.g. "Tel Aviv" or "תל אביב". Omit to list every city.' }),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(20).default(10).meta({ description: 'Listings per page (default 10, max 20)' }),
  sort: z.enum(LISTING_SORTS).default('-publishedAt').meta({ description: '-publishedAt = newest first' }),
});

const outputSchema = z.object({
  city: z.object({ cityCode: z.number(), cityNameHe: z.string(), cityNameEn: z.string() }).nullable(),
  listings: z.array(ListingOutputSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

const MAX_CITY_OPTIONS = 10;

const normalize = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[-־'"׳״]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

type CityMatch = { city: City } | { error: string };

/** City name → one city: an exact name match wins; otherwise the only match; otherwise ask. */
async function resolveCity(backend: KvutsaBackendClient, name: string): Promise<CityMatch> {
  const cities = (await backend.searchCities(name)).cities ?? [];
  const wanted = normalize(name);
  const exact = cities.filter((c) => normalize(c.cityNameHe) === wanted || normalize(c.cityNameEn) === wanted);
  if (exact.length === 1) return { city: exact[0]! };
  if (cities.length === 1) return { city: cities[0]! };
  if (cities.length === 0) return { error: `No city found matching "${name}". Check the spelling or try the Hebrew name.` };
  const options = cities
    .slice(0, MAX_CITY_OPTIONS)
    .map((c) => `${c.cityNameHe} (${c.cityNameEn})`)
    .join(', ');
  return { error: `Several cities match "${name}": ${options}. Ask the user which one, then call again with its exact name.` };
}

export const searchListingsTool: McpTool<typeof inputSchema> = {
  name: 'search_listings',
  config: {
    title: 'Search public presale projects',
    description: loadToolDescription('searchListings'),
    inputSchema,
    outputSchema,
    annotations: READ_ONLY,
  },
  async execute({ city, page, limit, sort }, { backend, siteUrl }) {
    try {
      let resolved: City | null = null;
      if (city) {
        const match = await resolveCity(backend, city);
        if ('error' in match) return createMcpErrorResponse(match.error);
        resolved = match.city;
      }

      const result = await backend.searchListings({ cityCode: resolved?.cityCode, page, limit, sort });
      return createMcpSuccessResponse({
        city: resolved,
        listings: (result.listings ?? []).map((l) => publicListing(l, siteUrl)),
        total: result.total ?? 0,
        page: result.page ?? page,
        limit: result.limit ?? limit,
      });
    } catch (err) {
      return createMcpError(err, { toolName: 'search_listings', notFoundMessage: 'No listings found.' });
    }
  },
};
