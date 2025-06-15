
import type { RaceData, Settings, WeatherCondition, TireType } from './types';
import { Sun, Cloudy, CloudRain, CloudLightning } from 'lucide-react';

export const DRIVER_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#A52A2A', '#008000', '#FFC0CB', '#D2691E',
  '#F0E68C', '#ADD8E6', '#E0FFFF', '#FAFAD2', '#90EE90', '#D3D3D3',
  '#FFB6C1', '#87CEEB'
];

export const DEFAULT_SETTINGS: Settings = {
  showLapTimes: true,
  showFuelLevel: true,
  showTireWear: true,
  aiAssistanceLevel: 'advanced',
  simulationSpeedFactor: 1, // Speed multiplier for simulation
};

export const TIRE_COMPOUND_CLASSES: Record<TireType, { bg: string, text?: string, border?: string }> = {
  Soft: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
  Medium: { bg: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-500' },
  Hard: { bg: 'bg-slate-100', text: 'text-black', border: 'border-slate-300' },
  Intermediate: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
  Wet: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
};

export const WEATHER_ICONS: Record<WeatherCondition, React.ElementType> = {
  Sunny: Sun,
  Cloudy: Cloudy,
  Rainy: CloudRain,
  'Heavy Rain': CloudLightning,
};

// Le Mans Specific Constants
export const LEMANS_FALLBACK_RACE_DATA: Omit<RaceData, 'drivers' | 'sessionKey' | 'meetingKey' | 'raceTimeElapsedSeconds' | 'totalRaceDurationSeconds'> = {
  totalLaps: 360, // Typical Le Mans, can be dynamic
  currentLap: 0,
  trackName: 'Circuit de la Sarthe (Simulated)',
  weather: 'Sunny',
  safetyCar: 'None',
};

export const LEMANS_TIRE_WEAR_RATES: Record<TireType, number> = {
  Soft: 0.6,    // % wear per lap (adjusted for Le Mans longer laps)
  Medium: 0.4,
  Hard: 0.25,
  Intermediate: 0.8,
  Wet: 1.0,
};

export const LEMANS_FUEL_CONSUMPTION_PER_LAP = 7.0; // Estimated % fuel per lap for Le Mans

export const LEMANS_RACE_DURATION_SECONDS = 24 * 60 * 60; // 24 hours in seconds
export const LEMANS_DEFAULT_TOTAL_LAPS = 360; // Approximate total laps for Le Mans

export const NUM_DRIVERS_PER_TEAM = 3;
export const MAX_DRIVER_DRIVE_TIME_SECONDS = 4 * 60 * 60; // Max continuous drive time (FIA rule is 4 hours in a 6 hour window)
                                                         // Total max for one driver in 24h is 14 hours. This constant is for a single stint.

export const SIMULATION_BASE_LAP_TIME_SECONDS = (13.626 * 60) / 4; // Roughly 3 minutes 24 seconds (based on Toyota #8 2023 pole, adjusted for simulation)
                                                                 // Average lap is more like 3:30-3:40. Using a simplified base for simulation.

export const MAX_LAP_HISTORY_LEMANS = 15; // Show last 15 laps for a driver in charts

export const SIMULATION_INTERVAL_MS = 3000; // How often the simulation updates (e.g., 3 seconds for faster sim)

export const MOCK_DRIVER_STINT_LAPS = 10; // For mock driver swaps, e.g., swap after 10-12 laps

// These are commented out as AI calls are disabled in mock mode
// export const AI_CALL_INTERVAL_LAPS = 25; // Call AI every 25 laps
// export const AI_CALL_TIMEOUT_MS = 30000; // Timeout for AI call

// Fallback/Generic constants (might be overridden by Le Mans specific ones if context demands)
export const OPENF1_API_BASE_URL = 'https://api.openf1.org/v1';
// export const DEFAULT_TOTAL_LAPS = 57; // This is more for F1, Le Mans uses LEMANS_DEFAULT_TOTAL_LAPS

