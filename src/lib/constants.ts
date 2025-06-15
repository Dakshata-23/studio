import type { RaceData, Driver, Settings } from './types';

const DRIVER_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#A52A2A', '#008000', '#FFC0CB', '#D2691E',
  '#F0E68C', '#ADD8E6', '#E0FFFF', '#FAFAD2', '#90EE90', '#D3D3D3',
  '#FFB6C1', '#87CEEB'
];


export const MOCK_DRIVERS: Driver[] = [
  { id: '1', name: 'Max Verstappen', shortName: 'VER', team: 'Red Bull Racing', position: 1, currentTires: { type: 'Medium', wear: 25, ageLaps: 10 }, lastLapTime: '1:28.345', bestLapTime: '1:27.990', fuel: 70, pitStops: 1, color: DRIVER_COLORS[0] },
  { id: '2', name: 'Lewis Hamilton', shortName: 'HAM', team: 'Mercedes', position: 2, currentTires: { type: 'Hard', wear: 15, ageLaps: 12 }, lastLapTime: '1:28.500', bestLapTime: '1:28.110', fuel: 75, pitStops: 1, color: DRIVER_COLORS[1] },
  { id: '3', name: 'Charles Leclerc', shortName: 'LEC', team: 'Ferrari', position: 3, currentTires: { type: 'Medium', wear: 30, ageLaps: 11 }, lastLapTime: '1:28.678', bestLapTime: '1:28.230', fuel: 68, pitStops: 1, color: DRIVER_COLORS[2] },
  { id: '4', name: 'Lando Norris', shortName: 'NOR', team: 'McLaren', position: 4, currentTires: { type: 'Soft', wear: 50, ageLaps: 8 }, lastLapTime: '1:29.012', bestLapTime: '1:28.550', fuel: 60, pitStops: 2, color: DRIVER_COLORS[3] },
  { id: '5', name: 'Sergio Pérez', shortName: 'PER', team: 'Red Bull Racing', position: 5, currentTires: { type: 'Hard', wear: 20, ageLaps: 14 }, lastLapTime: '1:28.880', bestLapTime: '1:28.400', fuel: 72, pitStops: 1, color: DRIVER_COLORS[4] },
  { id: '6', name: 'George Russell', shortName: 'RUS', team: 'Mercedes', position: 6, currentTires: { type: 'Medium', wear: 28, ageLaps: 9 }, lastLapTime: '1:29.150', bestLapTime: '1:28.600', fuel: 65, pitStops: 1, color: DRIVER_COLORS[5] },
  { id: '7', name: 'Carlos Sainz', shortName: 'SAI', team: 'Ferrari', position: 7, currentTires: { type: 'Hard', wear: 18, ageLaps: 13 }, lastLapTime: '1:29.300', bestLapTime: '1:28.750', fuel: 70, pitStops: 1, color: DRIVER_COLORS[6] },
  { id: '8', name: 'Fernando Alonso', shortName: 'ALO', team: 'Aston Martin', position: 8, currentTires: { type: 'Medium', wear: 35, ageLaps: 12 }, lastLapTime: '1:29.500', bestLapTime: '1:28.900', fuel: 62, pitStops: 1, color: DRIVER_COLORS[7] },
];

export const MOCK_RACE_DATA: RaceData = {
  drivers: MOCK_DRIVERS,
  totalLaps: 57,
  currentLap: 25,
  trackName: 'Circuit de Monaco',
  weather: 'Sunny',
  safetyCar: 'None',
};

export const DEFAULT_SETTINGS: Settings = {
  showLapTimes: true,
  showFuelLevel: true,
  showTireWear: true,
  aiAssistanceLevel: 'advanced',
};

export const TIRE_COMPOUND_COLORS: Record<TireType, string> = {
  Soft: 'bg-red-500',
  Medium: 'bg-yellow-400',
  Hard: 'bg-gray-200 text-black',
  Intermediate: 'bg-green-500',
  Wet: 'bg-blue-500',
};

export const TIRE_COMPOUND_CLASSES: Record<TireType, { bg: string, text?: string, border?: string }> = {
  Soft: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
  Medium: { bg: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-500' },
  Hard: { bg: 'bg-slate-100', text: 'text-black', border: 'border-slate-300' },
  Intermediate: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
  Wet: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
};

export const WEATHER_ICONS: Record<WeatherCondition, React.ElementType> = {
  Sunny: 'Sun',
  Cloudy: 'Cloudy',
  Rainy: 'CloudRain',
  'Heavy Rain': 'CloudLightning', // Using CloudLightning as a proxy for heavy rain/storm
};
