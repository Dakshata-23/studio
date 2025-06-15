
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { LiveTelemetry } from '@/components/dashboard/LiveTelemetry';
import { InteractiveTrackMap } from '@/components/dashboard/InteractiveTrackMap';
import { LeMansStrategistDisplay } from '@/components/ai/LeMansStrategistDisplay';
import { CompetitorAnalyzer } from '@/components/ai/CompetitorAnalyzer';
import {
  DEFAULT_SETTINGS,
  DRIVER_COLORS,
  LEMANS_FALLBACK_RACE_DATA,
  LEMANS_TIRE_WEAR_RATES,
  LEMANS_FUEL_CONSUMPTION_PER_LAP,
  LEMANS_RACE_DURATION_SECONDS,
  LEMANS_DEFAULT_TOTAL_LAPS,
  NUM_DRIVERS_PER_TEAM,
  MAX_DRIVER_DRIVE_TIME_SECONDS,
  SIMULATION_BASE_LAP_TIME_SECONDS,
  MAX_LAP_HISTORY_LEMANS,
  // AI_CALL_INTERVAL_LAPS, // AI calls are disabled for mock data
  // AI_CALL_TIMEOUT_MS, // AI calls are disabled
  SIMULATION_INTERVAL_MS,
  MOCK_DRIVER_STINT_LAPS, // For mock driver swaps
} from '@/lib/constants';
import type { RaceData, Settings, Driver, LapHistoryEntry, SuggestLeMansStrategyInput, SuggestLeMansStrategyOutput, TireType } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Users, MapPinIcon, ListChecks, Loader2, AlertTriangle, Flag, Settings2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { suggestLeMansStrategy } from '@/ai/flows/suggest-le-mans-strategy'; // AI calls are disabled for mock data
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { DriverPositionsTable } from '@/components/dashboard/DriverPositionsTable';


const INITIAL_TEAM_DRIVERS: Driver[] = Array.from({ length: NUM_DRIVERS_PER_TEAM }, (_, i) => ({
  id: `driver-${i + 1}`,
  name: `Driver ${String.fromCharCode(65 + i)} (Your Team)`,
  shortName: `D${String.fromCharCode(65 + i)}`,
  team: 'Your Team',
  color: DRIVER_COLORS[i % DRIVER_COLORS.length],
  driver_number: i + 1,
  position: i + 1, // Initial mock position
  currentTires: {
    type: 'Medium',
    wear: 0,
    ageLaps: 0,
  },
  lastLapTime: null,
  bestLapTime: null,
  fuel: 100,
  pitStops: 0,
  lapHistory: [],
  totalDriveTimeSeconds: 0,
  isDriving: i === 0, // First driver starts
  plannedPitStop: undefined,
  allLapsData: [],
}));

const INITIAL_RACE_DATA: RaceData = {
  ...LEMANS_FALLBACK_RACE_DATA,
  drivers: [], // Will be populated by teamDrivers for focused display
  raceTimeElapsedSeconds: 0,
  totalRaceDurationSeconds: LEMANS_RACE_DURATION_SECONDS,
  totalLaps: LEMANS_DEFAULT_TOTAL_LAPS,
  currentLap: 0,
};


export default function DashboardPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [raceData, setRaceData] = useState<RaceData>(INITIAL_RACE_DATA);
  const [teamDrivers, setTeamDrivers] = useState<Driver[]>(INITIAL_TEAM_DRIVERS);
  const [isLoadingData, setIsLoadingData] = useState(false); // Kept for future API integration, true for mock init
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  const [strategySuggestion, setStrategySuggestion] = useState<SuggestLeMansStrategyOutput | null>(null);
  const [isStrategyLoading, setIsStrategyLoading] = useState(false);
  const [lastStrategyCallParams, setLastStrategyCallParams] = useState<SuggestLeMansStrategyInput | null>(null);

  const { toast } = useToast();

  // Effect for Mock Data Simulation
  useEffect(() => {
    setIsLoadingData(true); // Simulate initial load
    // Initialize race data with team drivers
    setRaceData(prev => ({ ...prev, drivers: teamDrivers.filter(d => d.isDriving) })); // Only show active for "main focus" for now
    const timer = setTimeout(() => setIsLoadingData(false), 500); // Short delay to show loading state

    const simulationInterval = setInterval(() => {
      setRaceData(prevRaceData => {
        if (prevRaceData.currentLap >= prevRaceData.totalLaps) {
          clearInterval(simulationInterval);
          toast({ title: "Race Finished!", description: "The 24-hour simulation has concluded." });
          return prevRaceData;
        }

        const newCurrentLap = prevRaceData.currentLap + 1;
        const lapTimeForInterval = SIMULATION_BASE_LAP_TIME_SECONDS + (Math.random() * 5 - 2.5); // Add some variability
        const newRaceTimeElapsedSeconds = prevRaceData.raceTimeElapsedSeconds + lapTimeForInterval;

        let newTeamDrivers = [...teamDrivers];
        let activeDriverSwapped = false;

        // Update current driving driver
        const currentDriverIndex = newTeamDrivers.findIndex(d => d.isDriving);
        if (currentDriverIndex !== -1) {
          const driver = { ...newTeamDrivers[currentDriverIndex] };
          driver.totalDriveTimeSeconds += lapTimeForInterval;
          driver.currentTires.wear = Math.min(100, driver.currentTires.wear + (LEMANS_TIRE_WEAR_RATES[driver.currentTires.type] || 2.0) * settings.simulationSpeedFactor);
          driver.currentTires.ageLaps = (driver.currentTires.ageLaps || 0) + 1;
          driver.fuel = Math.max(0, driver.fuel - LEMANS_FUEL_CONSUMPTION_PER_LAP * settings.simulationSpeedFactor);
          
          const newLapEntry: LapHistoryEntry = {
            lap: newCurrentLap,
            time: parseFloat(lapTimeForInterval.toFixed(2)),
            tireWear: parseFloat(driver.currentTires.wear.toFixed(1)),
            fuel: parseFloat(driver.fuel.toFixed(1)),
            position: driver.position, // Assuming position doesn't change in this simple mock
          };
          driver.lapHistory = [...(driver.lapHistory || []), newLapEntry].slice(-MAX_LAP_HISTORY_LEMANS).sort((a,b) => a.lap - b.lap);
          driver.lastLapTime = `${Math.floor(lapTimeForInterval / 60)}:${(lapTimeForInterval % 60).toFixed(3).padStart(6, '0')}`;

          newTeamDrivers[currentDriverIndex] = driver;

          // Mock Driver Swap Logic (simple version)
          if (newCurrentLap > 0 && driver.currentTires.ageLaps >= MOCK_DRIVER_STINT_LAPS) {
            // Time for a pit stop and driver swap
            driver.isDriving = false;
            driver.pitStops += 1;
             // Reset tires for outgoing driver (conceptually, they are stored until next use)
            driver.currentTires = { type: 'Medium', wear: 0, ageLaps: 0 };
            driver.fuel = 100; // Refuel

            let nextDriverIndex = (currentDriverIndex + 1) % NUM_DRIVERS_PER_TEAM;
            // Simple check to avoid maxed out driver, very basic, AI would be better
            for (let i = 0; i < NUM_DRIVERS_PER_TEAM; i++) {
                if (newTeamDrivers[nextDriverIndex].totalDriveTimeSeconds < MAX_DRIVER_DRIVE_TIME_SECONDS * 0.9) { // ensure not already maxed
                    break;
                }
                nextDriverIndex = (nextDriverIndex + 1) % NUM_DRIVERS_PER_TEAM;
            }
            
            newTeamDrivers[nextDriverIndex].isDriving = true;
            // For simplicity, new driver gets fresh Mediums. AI would specify this.
            newTeamDrivers[nextDriverIndex].currentTires = { type: 'Medium', wear: 0, ageLaps: 0 };
            newTeamDrivers[nextDriverIndex].fuel = 100; // Refuel

            activeDriverSwapped = true;
            toast({
              title: "Driver Swap & Pit Stop!",
              description: `${driver.name} pits. ${newTeamDrivers[nextDriverIndex].name} takes over on fresh Medium tires.`,
            });
          }
        }
        
        if (activeDriverSwapped) {
          setTeamDrivers(newTeamDrivers);
        }

        return {
          ...prevRaceData,
          currentLap: newCurrentLap,
          raceTimeElapsedSeconds: newRaceTimeElapsedSeconds,
          drivers: newTeamDrivers.filter(d => d.isDriving), // Update focused driver
          // weather and safetyCar can be made to change randomly or on conditions if desired
        };
      });
    }, SIMULATION_INTERVAL_MS / settings.simulationSpeedFactor);

    return () => {
      clearTimeout(timer);
      clearInterval(simulationInterval);
    };
  }, [settings.simulationSpeedFactor, toast]); // Removed teamDrivers from deps to avoid re-triggering on its own update

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleDriverSelect = (driverId: string) => {
    // In Le Mans team context, we always focus on the team.
    // This function might be repurposed later if individual driver focus within the team is needed.
    const selected = teamDrivers.find(d => d.id === driverId);
    if (selected) {
      // For now, if a driver is selected, we can ensure raceData.drivers reflects this one if not driving.
      // But typically, LiveTelemetry will show all team drivers or the active one.
      // setRaceData(prev => ({...prev, drivers: [selected]}));
      console.log("Driver selected (for potential future detail view):", selected.name);
    }
  };
  
  // Placeholder for plan/cancel pit stop if manual controls are added back for mock
  const handlePlanPitStop = useCallback((driverId: string, compound: TireType, targetLap: number) => {
     toast({ title: "Manual Pit Stop Planned (Mock)", description: `Driver ${driverId} for ${compound} at lap ${targetLap}. Note: Mock simulation uses automated swaps.` });
  }, [toast]);

  const handleCancelPitStop = useCallback((driverId: string) => {
     toast({ title: "Manual Pit Stop Canceled (Mock)", description: `Pit stop for ${driverId} canceled.` });
  }, [toast]);


  if (isLoadingData && raceData.currentLap === 0) { // Show loading only on initial setup
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Initializing Le Mans Simulation...</p>
      </div>
    );
  }

  if (dataLoadError) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="mt-4 text-lg text-destructive">Error loading data: {dataLoadError}</p>
        <p className="text-sm text-muted-foreground">Please refresh or check console.</p>
      </div>
    );
  }
  
  const displayTrackName = raceData.trackName;
  const currentDrivingDriver = teamDrivers.find(d => d.isDriving) || teamDrivers[0];


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onToggleSettings={() => setIsSettingsOpen(true)} />
      <main className="flex-1 container mx-auto px-4 py-2 md:px-8 md:py-4">

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="text-sm md:text-base"><ListChecks className="w-4 h-4 mr-2 hidden md:inline" />Team Telemetry</TabsTrigger>
            <TabsTrigger value="strategist" className="text-sm md:text-base"><Brain className="w-4 h-4 mr-2 hidden md:inline" />AI Strategist</TabsTrigger>
            <TabsTrigger value="trackmap" className="text-sm md:text-base"><MapPinIcon className="w-4 h-4 mr-2 hidden md:inline" />Track Map</TabsTrigger>
            <TabsTrigger value="notes" className="text-sm md:text-base"><Users className="w-4 h-4 mr-2 hidden md:inline" />Notes</TabsTrigger>
          </TabsList>
          
          <div className="p-4 bg-card rounded-lg shadow-lg mb-6">
            <h3 className="text-lg font-medium text-primary font-headline">
              Your Team Status - Currently Driving: {currentDrivingDriver.name}
            </h3>
            <div className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
              <span>Track: {displayTrackName}</span>
              <span>Lap: {raceData.currentLap} / {raceData.totalLaps}</span>
              <span>Race Time: {new Date(raceData.raceTimeElapsedSeconds * 1000).toISOString().substr(11, 8)} / {new Date(raceData.totalRaceDurationSeconds * 1000).toISOString().substr(11, 8)}</span>
              <span>Weather: {raceData.weather}</span>
              <span>Safety Car: {raceData.safetyCar}</span>
            </div>
          </div>

          <TabsContent value="overview">
            <LiveTelemetry 
              teamDrivers={teamDrivers}
              raceData={raceData}
              settings={settings}
              strategyOutput={strategySuggestion} // strategyOutput is for the AI's overall team suggestion
              isStrategyLoading={isStrategyLoading}
              onPlanPitStop={handlePlanPitStop}
              onCancelPitStop={handleCancelPitStop}
            />
          </TabsContent>
          <TabsContent value="strategist">
             <LeMansStrategistDisplay
                teamDrivers={teamDrivers}
                raceData={raceData}
                strategySuggestion={strategySuggestion}
                isProcessing={isStrategyLoading}
                lastStrategyCallParams={lastStrategyCallParams}
              />
          </TabsContent>
          <TabsContent value="trackmap">
            <InteractiveTrackMap
              allDrivers={teamDrivers} // Show all team drivers on map
              mainDriver={currentDrivingDriver} // Highlight current driver
              trackName={raceData.trackName}
            />
          </TabsContent>
          <TabsContent value="notes">
            <CompetitorAnalyzer allDrivers={[]} mainDriver={null} />
          </TabsContent>
        </Tabs>
      </main>
      <SettingsPanel
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        Le Mans Strategist (Mock Data Mode) - Built with Next.js, Tailwind CSS.
      </footer>
    </div>
  );
}
