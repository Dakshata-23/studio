
export type TireType = 'Soft' | 'Medium' | 'Hard' | 'Intermediate' | 'Wet';
export type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy' | 'Heavy Rain';

export interface TireStatus {
  type: TireType;
  wear: number; // Percentage 0-100
  ageLaps?: number; // Optional: Laps on current set
}

export interface LapHistoryEntry {
  lap: number;
  time: number; // in seconds
  tireWear?: number;
  fuel?: number;
}

export interface Driver {
  id: string; // Will use driver_number from API
  name: string;
  team: string;
  shortName: string; // 3-letter abbreviation (name_acronym from API)
  position: number;
  currentTires: TireStatus;
  lastLapTime: string | null; // e.g., "1:30.567" or null if not set
  bestLapTime: string | null;
  fuel: number; // Percentage 0-100
  pitStops: number;
  color: string; // Hex color for UI representation (from team_colour API)
  driver_number: number; // From API
  lapHistory?: LapHistoryEntry[];
}

export interface RaceData {
  drivers: Driver[];
  totalLaps: number;
  currentLap: number;
  trackName: string;
  weather: WeatherCondition;
  safetyCar: 'None' | 'Deployed' | 'Virtual';
}

export interface Settings {
  showLapTimes: boolean;
  showFuelLevel: boolean;
  showTireWear: boolean;
  aiAssistanceLevel: 'basic' | 'advanced';
}

// For OpenF1 API response structure
export interface OpenF1Driver {
  session_key: number;
  meeting_key: number;
  broadcast_name: string;
  country_code: string | null;
  driver_number: number;
  first_name: string | null;
  full_name: string;
  headshot_url: string | null;
  last_name: string | null;
  name_acronym: string;
  team_colour: string | null;
  team_name: string;
  circuit_key?: number;
  circuit_short_name?: string;
  date?: string;
}

// Copied from ai/flows/suggest-pit-stops.ts for easier import in page.tsx
export interface SuggestPitStopsInput {
  driverName: string;
  currentLap: number;
  tireCondition: string;
  fuelLevel: number;
  racePosition: number;
  weatherConditions: string;
  competitorStrategies?: string;
}

export interface SuggestPitStopsOutput {
  suggestedPitStopLap: number;
  reasoning: string;
  alternativeStrategies: string;
}

