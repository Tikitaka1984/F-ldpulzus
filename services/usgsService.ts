
import { Earthquake, TimeRange } from '../types';

const USGS_BASE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

export const fetchEarthquakes = async (range: TimeRange, minMag: number): Promise<Earthquake[]> => {
  let url = `${USGS_BASE_URL}/all_${range}.geojson`;
  
  // For 'year', USGS doesn't have a single simple feed, so we'd typically use the query API.
  // For this demo, we use 'month' as the primary recent source if 'year' is selected, 
  // or a slightly different static feed if available.
  if (range === TimeRange.Year) {
    url = `${USGS_BASE_URL}/4.5_month.geojson`; // Fallback for demo or significant events
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return data.features.map((f: any) => ({
      id: f.id,
      ...f.properties,
      coordinates: f.geometry.coordinates,
    })).filter((eq: Earthquake) => eq.mag >= minMag);
  } catch (error) {
    console.error('Error fetching earthquake data:', error);
    return [];
  }
};
