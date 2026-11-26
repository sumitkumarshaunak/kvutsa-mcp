export interface City {
  cityCode: number;
  cityNameHe: string;
  cityNameEn: string;
}

/** GET /api/cities/public?q= */
export interface CitySearchResponse {
  success: boolean;
  cities?: City[];
}
