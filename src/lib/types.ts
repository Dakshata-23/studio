
export type TireType = 'Soft' | 'Medium' | 'Hard' | 'Intermediate' | 'Wet';
export type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy' | 'Heavy Rain';

export type TirePosition = 'Front Left' | 'Front Right' | 'Rear Left' | 'Rear Right';

export interface DriverInfo {
  name: string;
  gap?: string; // e.g., "+1.2s" or "-0.8s"
  action?: string; // e.g., "Lap", "Defend"
}

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
  position?: number;
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
  plannedPitStop?: {
    targetLap: number;
    newTireCompound: TireType;
  };
  allLapsData?: OpenF1Lap[];
  totalDriveTimeSeconds: number;
  isDriving: boolean;

}

export interface RaceData {
  drivers: Driver[];
  totalLaps: number;
  currentLap: number;
  trackName: string;
  weather: WeatherCondition;
  safetyCar: 'None' | 'Deployed' | 'Virtual';
  sessionKey: number | null;
  meetingKey: number | null;
  sessionName?: string;
  countryName?: string;
  raceTimeElapsedSeconds: number;
  totalRaceDurationSeconds: number;

}

export interface Settings {
  showLapTimes: boolean;
  showFuelLevel: boolean;
  showTireWear: boolean;
  aiAssistanceLevel: 'basic' | 'advanced';
  simulationSpeedFactor: number;
}

// For OpenF1 API response structures
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
}

export interface OpenF1Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  country_name: string | null;
  location: string;
  session_type: string; // e.g., "Race"
  start_date: string;
  end_date: string;
  circuit_key: number;
  circuit_short_name: string; // Often the track name
  // total_laps might not be directly here, often in meeting or known contextually
}

export interface OpenF1Meeting {
  meeting_key: number;
  circuit_short_name: string;
  meeting_name: string;
  location: string;
  // FIA document endpoint might have total laps for a specific event schedule
  // For now, we'll use a fallback or assume a typical race length.
}

export interface OpenF1Lap {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  lap_number: number;
  lap_duration: number | null; // in seconds
  stint_number: number;
  pit_duration: number | null;
  is_pit_out_lap: boolean | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  segments_sector_1: number[] | null;
  segments_sector_2: number[] | null;
  segments_sector_3: number[] | null;
  lap_start_time: string | null; // Date string
  date_start: string | null; // Date string
}

export interface OpenF1Position {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string; // Timestamp of the position data
  position: number;
}

export interface OpenF1Stint {
  session_key: number;
  meeting_key: number;
  stint_number: number;
  driver_number: number;
  lap_start: number;
  lap_end: number | null;
  compound: TireType | string; // API might return uppercase string e.g. "SOFT"
  tyre_age_at_start: number;
}

export interface OpenF1Weather {
  session_key: number;
  meeting_key: number;
  date: string;
  air_temperature: number;
  track_temperature: number;
  rainfall: number; // mm, 0 if no rain
  humidity: number; // %
  wind_speed: number; // m/s
  pressure: number; // hPa
  wind_direction: number; // degrees
}

export interface OpenF1RaceControl {
    session_key: number;
    meeting_key: number;
    date: string;
    category: string; // "SafetyCar", "RedFlag", "TrackSurfaceSlippery" etc.
    message: string;
    flag: string | null; // "YELLOW", "GREEN", "RED", "SC", "VSC", "CLEAR"
    scope: string | null; // "Track", "Sector"
    sector: number | null;
    lap_number: number | null;
}


// Copied from ai/flows/suggest-le-mans-strategy.ts for easier import in page.tsx
// Note: This is duplicated. Ideally, it should be imported directly from the flow.
export type DriverStatus = {
  name: string;
  currentTireType: TireType;
  currentTireAgeLaps: number;
  currentTireWear: number; // 0-100%
  fuelLevel: number; // 0-100%
  totalDriveTimeSeconds: number;
  isCurrentlyDriving: boolean;
  currentLap: number; // Driver's current lap, can be different from raceCurrentLap if just pitted
};

export type SuggestLeMansStrategyInput = {
  teamDriverStatuses: DriverStatus[];
  raceCurrentLap: number;
  raceTotalLaps: number; // e.g. ~350-390 for Le Mans
  raceTimeElapsedSeconds: number;
  totalRaceDurationSeconds: number; // e.g., 24 hours = 86400 seconds
  weatherConditions: WeatherCondition;
  trackName: string;
  safetyCarStatus: 'None' | 'Deployed' | 'Virtual';
};

export type SuggestLeMansStrategyOutput = {
  suggestedActions: string; // Overall summary of actions (e.g., "Pit Driver B in 2 laps for Mediums, Driver A continue stint.")
  strategicReasoning: string;
  nextOptimalPitLap?: number; // For the team overall or specific driver if implied
  recommendedTireType?: TireType;
  driverSpecificSuggestions?: Array<{
    driverName: string;
    action: string; // e.g. "Pit in 3 laps", "Extend stint", "Change to Soft tires"
    reasoning?: string;
  }>;
};

// This type is currently a duplicate of the one in analyze-competitor-strategy.ts.
// Consider a shared types file if more AI flows use similar structures.
export interface AnalyzeCompetitorStrategyInput {
  competitorName: string;
  historicalData: string;
  currentRaceData: string;
}

export interface AnalyzeCompetitorStrategyOutput {
  strategySummary: string;
  tireCompound: TireType;
  tireAgeLaps: number;
  tirePosition: TirePosition; // Assuming this can be determined.
  driverInFront?: DriverInfo;
  driverInBack?: DriverInfo;
}

// Old F1 Pit Stop types, kept for reference if needed, but Le Mans uses the above
export interface SuggestPitStopsInput {
  driverName: string;
  currentLap: number;
  tireCondition: string;
  fuelLevel: number;
  racePosition: number;
  weatherConditions: string;
  competitorStrategies: string;
}

export interface SuggestPitStopsOutput {
  suggestedPitStopLap: number;
  reasoning: string;
  alternativeStrategies: string;
}
