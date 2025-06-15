
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { LiveTelemetry } from '@/components/dashboard/LiveTelemetry';
import { PitStopPerformancePanel } from '@/components/dashboard/PitStopPerformancePanel';
import { PitStopAdvisor } from '@/components/ai/PitStopAdvisor';
import { CompetitorAnalyzer } from '@/components/ai/CompetitorAnalyzer';
import { DriverPositionsTable } from '@/components/dashboard/DriverPositionsTable'; // New import
import { DEFAULT_SETTINGS, MOCK_RACE_DATA, DRIVER_COLORS } from '@/lib/constants';
import type { RaceData, Settings, Driver, OpenF1Driver, TireType, SuggestPitStopsInput, SuggestPitStopsOutput, LapHistoryEntry } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Users, MapPinIcon, ListChecks, Loader2, AlertTriangle, Car } from 'lucide-react'; // Added Car icon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestPitStops } from '@/ai/flows/suggest-pit-stops';
import { useToast } from "@/hooks/use-toast";


const INITIAL_RACE_DATA: RaceData = {
  drivers: [],
  totalLaps: MOCK_RACE_DATA.totalLaps,
  currentLap: MOCK_RACE_DATA.currentLap,
  trackName: MOCK_RACE_DATA.trackName,
  weather: MOCK_RACE_DATA.weather,
  safetyCar: MOCK_RACE_DATA.safetyCar,
};

const MAX_LAP_HISTORY = 20;
const AI_CALL_TIMEOUT_MS = 10000; // 10 seconds

const TIRE_TYPES: TireType[] = ['Soft', 'Medium', 'Hard'];

const parseLapTimeToSeconds = (lapTime: string | null): number | null => {
  if (!lapTime) return null;
  const parts = lapTime.split(':');
  if (parts.length !== 2) return null;
  
  const minutes = parseInt(parts[0], 10);
  const secondsAndMillis = parseFloat(parts[1]);

  if (isNaN(minutes) || isNaN(secondsAndMillis)) return null;
  
  return minutes * 60 + secondsAndMillis;
};


export default function DashboardPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [raceData, setRaceData] = useState<RaceData>(INITIAL_RACE_DATA);
  const [mainDriver, setMainDriver] = useState<Driver | null>(null);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [driverLoadError, setDriverLoadError] = useState<string | null>(null);

  const [pitStopSuggestion, setPitStopSuggestion] = useState<SuggestPitStopsOutput | null>(null);
  const [isPitStopLoading, setIsPitStopLoading] = useState(false);
  const [lastPitStopCallParams, setLastPitStopCallParams] = useState<SuggestPitStopsInput | null>(null);
  const [showPitStopWarning, setShowPitStopWarning] = useState(false); // New state for warning
  const { toast } = useToast();

  const [lastSuccessfulAiCallData, setLastSuccessfulAiCallData] = useState<{
    lap: number;
    tireWear: number;
    fuel: number;
  } | null>(null);
  const [aiCallCoolDown, setAiCallCoolDown] = useState(false);


  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoadingDrivers(true);
      setDriverLoadError(null);
      try {
        const response = await fetch('https://api.openf1.org/v1/drivers?session_key=latest');
        if (!response.ok) {
          throw new Error(`Failed to fetch drivers: ${response.statusText}`);
        }
        const apiDrivers: OpenF1Driver[] = await response.json();

        if (!apiDrivers || apiDrivers.length === 0) {
          throw new Error('No drivers found for the latest session.');
        }
        
        const transformedDrivers: Driver[] = apiDrivers.map((apiDriver, index) => ({
          id: apiDriver.driver_number.toString(),
          name: apiDriver.full_name || `${apiDriver.first_name || ''} ${apiDriver.last_name || ''}`.trim() || `Driver ${apiDriver.driver_number}`,
          shortName: apiDriver.name_acronym,
          team: apiDriver.team_name,
          color: apiDriver.team_colour ? `#${apiDriver.team_colour}` : DRIVER_COLORS[index % DRIVER_COLORS.length],
          driver_number: apiDriver.driver_number,
          position: index + 1,
          currentTires: {
            type: TIRE_TYPES[index % TIRE_TYPES.length],
            wear: 0, // Start with 0% wear
            ageLaps: 0, // Start with 0 laps on current set
          },
          lastLapTime: null,
          bestLapTime: null,
          fuel: 100, // Fuel should always start at 100%
          pitStops: Math.floor(Math.random() * 2),
          lapHistory: [],
        }));

        setRaceData(prev => ({ ...prev, drivers: transformedDrivers }));
        if (transformedDrivers.length > 0) {
          setMainDriver(transformedDrivers[0]);
        }
      } catch (error) {
        console.error("Error fetching OpenF1 drivers:", error);
        setDriverLoadError((error as Error).message || 'An unknown error occurred while fetching drivers.');
      } finally {
        setIsLoadingDrivers(false);
      }
    };

    fetchDrivers();
  }, []);


  useEffect(() => {
    if (isLoadingDrivers || raceData.drivers.length === 0) return;

    const interval = setInterval(() => {
      setRaceData(prevData => {
        if (prevData.drivers.length === 0) return prevData;

        let newMainDriver: Driver | null = null;
        const currentLapForHistory = prevData.currentLap;
        let pitStopExecutedDriverName: string | undefined;
        let pitStopExecutedNewTireCompound: TireType | undefined;

        const updatedDrivers = prevData.drivers.map(driver => {
          const newLapTimeStr = driver.lastLapTime ? `1:${(Math.random() * 10 + 20).toFixed(3).padStart(6, '0')}` : `1:${(Math.random() * 10 + 25).toFixed(3).padStart(6, '0')}`;
          
          const updatedDriver = {
            ...driver,
            lastLapTime: newLapTimeStr,
            currentTires: {
              ...driver.currentTires,
              wear: Math.min(100, driver.currentTires.wear + Math.floor(Math.random() * 2) + 1),
              ageLaps: (driver.currentTires.ageLaps || 0) + 1,
            },
            fuel: Math.max(0, driver.fuel - (Math.random() * 0.5 + 0.2)),
            lapHistory: [...(driver.lapHistory || [])],
          };

          if (mainDriver && driver.id === mainDriver.id && currentLapForHistory > 0) {
            const newLapTimeSec = parseLapTimeToSeconds(newLapTimeStr);
            if (newLapTimeSec !== null) {
              const newHistoryEntry: LapHistoryEntry = { 
                lap: currentLapForHistory, 
                time: newLapTimeSec,
                tireWear: updatedDriver.currentTires.wear,
                fuel: updatedDriver.fuel,
              };
              updatedDriver.lapHistory = [...updatedDriver.lapHistory, newHistoryEntry].slice(-MAX_LAP_HISTORY);
            }
            newMainDriver = updatedDriver;
          }
          return updatedDriver;
        });

        if (Math.random() < 0.1 && updatedDrivers.length >=2) {
            const p1Index = updatedDrivers.findIndex(d => d.position === 1);
            const p2Index = updatedDrivers.findIndex(d => d.position === 2);
            if (p1Index !== -1 && p2Index !== -1) {
                const tempPos = updatedDrivers[p1Index].position;
                updatedDrivers[p1Index].position = updatedDrivers[p2Index].position;
                updatedDrivers[p2Index].position = tempPos;
            }
        }
        
        if (newMainDriver) {
          setMainDriver(newMainDriver);
        } else if (mainDriver && !newMainDriver) {
           const foundMainDriver = updatedDrivers.find(d => d.id === mainDriver.id);
           if (foundMainDriver) setMainDriver(foundMainDriver);
        }

        // Check for planned pit stops and execute if current lap matches

        const finalDrivers = updatedDrivers.map(driver => {
          if (driver.plannedPitStop && prevData.currentLap + 1 >= driver.plannedPitStop.targetLap) {
            pitStopExecutedDriverName = driver.name;
            pitStopExecutedNewTireCompound = driver.plannedPitStop.newTireCompound;
            return {
              ...driver,
              currentTires: {
                type: driver.plannedPitStop.newTireCompound,
                wear: 0, // Fresh tires
                ageLaps: 0,
              },
              pitStops: driver.pitStops + 1,
              plannedPitStop: undefined, // Clear the planned pit stop
            };
          }
          return driver;
        });

        const newRaceData = {
          ...prevData,
          drivers: finalDrivers,
          currentLap: Math.min(prevData.totalLaps, prevData.currentLap + 1), // Always increment lap for consistent testing
         };

        if (pitStopExecutedDriverName && pitStopExecutedNewTireCompound) {
          toast({
            title: "Pit Stop Executed!",
            description: `${pitStopExecutedDriverName} is pitting for ${pitStopExecutedNewTireCompound} tires.`,
          });
        }
        return newRaceData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoadingDrivers, raceData.drivers, mainDriver, raceData.totalLaps]);

  // Effect to update pit stop warning based on mainDriver's tire wear
  useEffect(() => {
    if (mainDriver && mainDriver.currentTires.wear > 80) {
      setShowPitStopWarning(true);
    } else {
      setShowPitStopWarning(false);
    }
  }, [mainDriver?.currentTires.wear]); // Only re-run when mainDriver's tire wear changes

  // Effect to update pit stop warning based on mainDriver's tire wear
  useEffect(() => {
    if (mainDriver && mainDriver.currentTires.wear > 80) {
      setShowPitStopWarning(true);
    } else {
      setShowPitStopWarning(false);
    }
  }, [mainDriver?.currentTires.wear]); // Only re-run when mainDriver's tire wear changes

  const fetchPitStopAdvice = useCallback(async (driverForAdvice: Driver, currentLapForAdvice: number) => {
    if (!driverForAdvice || currentLapForAdvice <= 0 || aiCallCoolDown) return;

    const currentTireWear = driverForAdvice.currentTires.wear;
    const currentFuelLevel = parseFloat(driverForAdvice.fuel.toFixed(1));

    if (lastSuccessfulAiCallData && pitStopSuggestion) {
      const { lap: prevLap, tireWear: prevTireWear, fuel: prevFuel } = lastSuccessfulAiCallData;
      const sameLap = prevLap === currentLapForAdvice;
      const tireWearDiff = Math.abs(currentTireWear - prevTireWear);
      const fuelDiff = Math.abs(currentFuelLevel - prevFuel);
      
      if (sameLap && tireWearDiff < 10 && fuelDiff < 10) {
        return;
      }
    }
    
    setIsPitStopLoading(true);
    const params: SuggestPitStopsInput = {
      driverName: driverForAdvice.name,
      currentLap: currentLapForAdvice,
      tireCondition: `${driverForAdvice.currentTires.type} - ${driverForAdvice.currentTires.wear.toFixed(0)}% wear, ${driverForAdvice.currentTires.ageLaps} Laps old`,
      fuelLevel: currentFuelLevel,
      racePosition: driverForAdvice.position,
      weatherConditions: raceData.weather,
      competitorStrategies: 'Key rivals on varied strategies; one just pitted.', 
    };
    setLastPitStopCallParams(params); 

    try {
      const timeoutPromise = new Promise<SuggestPitStopsOutput>((_, reject) => 
        setTimeout(() => reject(new Error('AI Pit Advisor timed out after 10 seconds.')), AI_CALL_TIMEOUT_MS)
      );

      const result = await Promise.race([
        suggestPitStops(params),
        timeoutPromise
      ]);
      
      setPitStopSuggestion(result);
      setLastSuccessfulAiCallData({ lap: currentLapForAdvice, tireWear: currentTireWear, fuel: currentFuelLevel });
    } catch (error) {
      console.error("Error fetching pit stop suggestion:", error);
      toast({
        variant: "destructive",
        title: "AI Pit Advisor Error",
        description: (error as Error).message || "Failed to get pit stop suggestion.",
      });
      setPitStopSuggestion(null); 
      
      setAiCallCoolDown(true);
      setTimeout(() => {
        setAiCallCoolDown(false);
      }, 15000); 
    } finally {
      setIsPitStopLoading(false);
    }
  }, [
    lastSuccessfulAiCallData, 
    pitStopSuggestion, 
    raceData.weather, 
    toast,
    aiCallCoolDown,
  ]);

  useEffect(() => {
    if (mainDriver && raceData.currentLap > 0 && !isLoadingDrivers && !isPitStopLoading && !aiCallCoolDown) {
      fetchPitStopAdvice(mainDriver, raceData.currentLap);
    }
  }, [mainDriver, raceData.currentLap, isLoadingDrivers, isPitStopLoading, fetchPitStopAdvice, aiCallCoolDown]);


  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handlePlanPitStop = useCallback((compound: TireType, laps: number) => {
    if (!mainDriver) return;

    // Calculate the target lap for the pit stop
    const targetPitStopLap = raceData.currentLap + laps;


    setRaceData(prevData => {
      const updatedDrivers = prevData.drivers.map(driver => {
        if (driver.id === mainDriver.id) {
          return {
            ...driver,
            plannedPitStop: {
              targetLap: targetPitStopLap,
              newTireCompound: compound,
            },
          };
        }
        return driver;
      });
      return { ...prevData, drivers: updatedDrivers };
    });

    // Update mainDriver state separately after setRaceData
    setMainDriver(prevMainDriver => {
      if (prevMainDriver && prevMainDriver.id === mainDriver.id) {
        return {
          ...prevMainDriver,
          plannedPitStop: {
            targetLap: targetPitStopLap,
            newTireCompound: compound,
          },
        };
      }
      return prevMainDriver;
    });

    toast({
      title: "Pit Stop Planned!",
      description: `${mainDriver.name} will pit for ${compound} tires at lap ${targetPitStopLap}.`,
    });

  }, [mainDriver, setRaceData, toast, setMainDriver]);

  const handleCancelPitStop = useCallback(() => {
    if (!mainDriver) return;

    setRaceData(prevData => {
      const updatedDrivers = prevData.drivers.map(driver => {
        if (driver.id === mainDriver.id) {
          return {
            ...driver,
            plannedPitStop: undefined, // Clear the planned pit stop
          };
        }
        return driver;
      });
      return { ...prevData, drivers: updatedDrivers };
    });
    // Update mainDriver state separately after setRaceData
    setMainDriver(prevMainDriver => {
      if (prevMainDriver && prevMainDriver.id === mainDriver.id) {
        return { ...prevMainDriver, plannedPitStop: undefined };
      }
      return prevMainDriver;
    });

    toast({
      title: "Pit Stop Canceled!",
      description: `The planned pit stop for ${mainDriver.name} has been canceled.`,
    });
  }, [mainDriver, setRaceData, toast, setMainDriver]);

  if (isLoadingDrivers) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading Le Mans Driver Data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onToggleSettings={() => setIsSettingsOpen(true)} />
      <main className="flex-1 container mx-auto px-4 py-2 md:px-8 md:py-4">
        {driverLoadError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Driver Data</AlertTitle>
            <AlertDescription>{driverLoadError}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6"> {/* Changed grid-cols-4 to grid-cols-5 */}
            <TabsTrigger value="overview" className="text-sm md:text-base"><ListChecks className="w-4 h-4 mr-2 hidden md:inline" />Telemetry & AI</TabsTrigger>
            <TabsTrigger value="pitStopPerformance" className="text-sm md:text-base relative">
              {showPitStopWarning && (
                <AlertTriangle className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
              )}
              Pit Stop Performance
            </TabsTrigger>
            <TabsTrigger value="pitstop" className="text-sm md:text-base"><Brain className="w-4 h-4 mr-2 hidden md:inline" />AI Pit Insights</TabsTrigger>
            <TabsTrigger value="competitor" className="text-sm md:text-base"><Users className="w-4 h-4 mr-2 hidden md:inline" />Competitor AI</TabsTrigger>
            <TabsTrigger value="driverPositions" className="text-sm md:text-base"><Car className="w-4 h-4 mr-2 hidden md:inline" />Driver Positions</TabsTrigger> {/* New Tab Trigger */}
          </TabsList>
          
          {mainDriver && (
             <div className="p-4 bg-card rounded-lg shadow_ mb-6">
              <h3 className="text-lg font-medium text-primary font-headline">
                Main Focus: P{mainDriver.position} - {mainDriver.name} ({mainDriver.team})
              </h3>
            </div>
          )}

          <TabsContent value="overview">
            {mainDriver ? (
              <LiveTelemetry 
                driver={mainDriver} 
                settings={settings} 
                pitStopSuggestion={pitStopSuggestion}
                isPitStopLoading={isPitStopLoading}
                lapHistory={mainDriver.lapHistory || []}
              />
            ) : (
              !driverLoadError && <p className="text-center text-muted-foreground p-8">No main driver data to display.</p>
            )}
          </TabsContent>
          <TabsContent value="pitStopPerformance">
            {mainDriver ? (
              <PitStopPerformancePanel
                mainDriver={mainDriver}
                currentLap={raceData.currentLap}
                onPlanPitStop={handlePlanPitStop}
                onCancelPitStop={handleCancelPitStop}
              />
            ) : (
              !driverLoadError && <p className="text-center text-muted-foreground p-8">Pit Stop Performance unavailable without main driver data.</p>
            )}
          </TabsContent>
          <TabsContent value="pitstop">
            {mainDriver ? (
              <PitStopAdvisor 
                selectedDriver={mainDriver} 
                currentLap={raceData.currentLap}
                pitStopSuggestion={pitStopSuggestion}
                isPitStopLoading={isPitStopLoading}
                lastPitStopCallParams={lastPitStopCallParams}
               />
            ) : (
               !driverLoadError && <p className="text-center text-muted-foreground p-8">Pit advisor details unavailable without main driver data.</p>
            )}
          </TabsContent>
          <TabsContent value="competitor">
            {raceData.drivers.length > 0 ? (
              <CompetitorAnalyzer allDrivers={raceData.drivers} mainDriver={mainDriver} />
            ) : (
              !driverLoadError && <p className="text-center text-muted-foreground p-8">Competitor analyzer unavailable without driver data.</p>
            )}
          </TabsContent>
          {/* New TabsContent for Driver Positions */}
          <TabsContent value="driverPositions">
            {raceData.drivers.length > 0 ? (
              <DriverPositionsTable drivers={raceData.drivers} />
            ) : (
              !driverLoadError && <p className="text-center text-muted-foreground p-8">Driver positions unavailable without driver data.</p>
            )}
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
        Race Strategist - Built with Next.js, Tailwind CSS, and Genkit AI. Data from OpenF1 API.
      </footer>
    </div>
  );
}
