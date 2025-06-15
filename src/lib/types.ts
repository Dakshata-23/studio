
export type TireType = 'Soft' | 'Medium' | 'Hard' | 'Intermediate' | 'Wet';
export type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy' | 'Heavy Rain';

export interface TireStatus {
  type: TireType;
  wear: number; // Percentage 0-100
  ageLaps: number; 
  stintStartLap?: number; // Lap number when this tire stint started
}

export interface LapHistoryEntry {
  lap: number;
  time: number; // in seconds
  tireWear?: number;
  fuel?: number;
  position?: number; // Overall race position, less emphasis in single team sim
}

export interface Driver {
  id: string; 
  name: string;
  team: string; // e.g., "Your Team"
  shortName: string; 
  position: number; // Driver's current position in race (simulated)
  currentTires: TireStatus;
  lastLapTime: string | null; 
  bestLapTime: string | null;
  fuel: number; // Percentage 0-100
  pitStops: number;
  color: string; 
  driver_number: number; // Could be 1, 2, 3 for the team
  lapHistory: LapHistoryEntry[];
  allLapsData: OpenF1Lap[]; // Re-using OpenF1Lap for structure, but data is simulated
  totalDriveTimeSeconds: number; // Cumulative drive time for this driver in the race
  isDriving: boolean; // True if this driver is currently in the car
}

export interface RaceData {
  drivers: Driver[]; // Holds the 3 drivers of "Your Team"
  totalLaps: number;
  currentLap: number;
  trackName: string;
  weather: WeatherCondition;
  safetyCar: 'None' | 'Deployed' | 'Virtual'; // Safety car can still be a simulated event
  raceTimeElapsedSeconds: number;
  totalRaceDurationSeconds: number;
}

export interface Settings {
  showLapTimes: boolean;
  showFuelLevel: boolean;
  showTireWear: boolean;
  aiAssistanceLevel: 'basic' | 'advanced'; // Could be 'standard' | 'detailed' for Le Mans
}

// Keeping OpenF1Lap structure for simulated lap data for convenience
export interface OpenF1Lap {
  session_key?: number; // Optional as not from API
  meeting_key?: number; // Optional
  driver_number: number;
  lap_number: number;
  lap_duration: number | null; 
  stint_number?: number; // Optional
  pit_duration?: number | null; // Optional
  is_pit_out_lap?: boolean | null; // Optional
  // Sectors less critical for high-level simulation but can be kept
  duration_sector_1?: number | null;
  duration_sector_2?: number | null;
  duration_sector_3?: number | null;
  lap_start_time?: string | null; 
  date_start?: string | null; 
}


// Types for the new LeMansStrategy AI Flow
interface TeamDriverStatusInput {
  name: string;
  currentTireType: TireType;
  currentTireAgeLaps: number;
  currentTireWear: number; // %
  fuelLevel: number; // %
  totalDriveTimeSeconds: number;
  isCurrentlyDriving: boolean;
  currentLap: number; // Lap driver is on / last completed
}

export interface SuggestLeMansStrategyInput {
  teamDriverStatuses: TeamDriverStatusInput[];
  raceCurrentLap: number;
  raceTotalLaps: number;
  raceTimeElapsedSeconds: number;
  totalRaceDurationSeconds: number;
  weatherConditions: WeatherCondition;
  trackName: string;
  // Add safetyCar status if AI should consider it
  safetyCarStatus: RaceData['safetyCar']; 
}

export interface SuggestLeMansStrategyOutput {
  suggestedActions: string; // e.g., "Pit Driver A on lap X for Mediums. Driver B to take over."
  strategicReasoning: string; // Explanation
  // Optional: could suggest target lap for next pit, or next driver change
  nextOptimalPitLap?: number;
  recommendedNextDriverName?: string;
}

// Keep for Competitor Analyzer (though simplified)
export interface AnalyzeCompetitorStrategyInput {
  competitorName: string;
  historicalData: string;
  currentRaceData: string;
}
export interface AnalyzeCompetitorStrategyOutput {
  strategySummary: string;
}
