
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { LiveTelemetry } from '@/components/dashboard/LiveTelemetry';
import { InteractiveTrackMap } from '@/components/dashboard/InteractiveTrackMap';
import { PitStopAdvisor } from '@/components/ai/PitStopAdvisor';
import { CompetitorAnalyzer } from '@/components/ai/CompetitorAnalyzer';
import { DEFAULT_SETTINGS, MOCK_RACE_DATA, DRIVER_COLORS } from '@/lib/constants';
import type { RaceData, Settings, Driver, OpenF1Driver, TireType } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Users, MapPinIcon, ListChecks, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const INITIAL_RACE_DATA: RaceData = {
  drivers: [], // This will hold all drivers for context (e.g., competitor analysis)
  totalLaps: MOCK_RACE_DATA.totalLaps,
  currentLap: MOCK_RACE_DATA.currentLap,
  trackName: MOCK_RACE_DATA.trackName,
  weather: MOCK_RACE_DATA.weather,
  safetyCar: MOCK_RACE_DATA.safetyCar,
};

const TIRE_TYPES: TireType[] = ['Soft', 'Medium', 'Hard'];

export default function DashboardPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [raceData, setRaceData] = useState<RaceData>(INITIAL_RACE_DATA);
  const [mainDriver, setMainDriver] = useState<Driver | null>(null); // For the single focused driver
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [driverLoadError, setDriverLoadError] = useState<string | null>(null);

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
            wear: Math.floor(Math.random() * 30) + 5,
            ageLaps: Math.floor(Math.random() * 10) + 1,
          },
          lastLapTime: null,
          bestLapTime: null,
          fuel: Math.floor(Math.random() * 30) + 70,
          pitStops: Math.floor(Math.random() * 2),
        }));

        setRaceData(prev => ({ ...prev, drivers: transformedDrivers }));
        if (transformedDrivers.length > 0) {
          setMainDriver(transformedDrivers[0]); // Set the first driver as the main driver
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

        const updatedDrivers = prevData.drivers.map(driver => {
          const updatedDriver = {
            ...driver,
            lastLapTime: driver.lastLapTime ? `1:${(Math.random() * 10 + 20).toFixed(3).padStart(6, '0')}` : `1:${(Math.random() * 10 + 25).toFixed(3).padStart(6, '0')}`,
            currentTires: {
              ...driver.currentTires,
              wear: Math.min(100, driver.currentTires.wear + Math.floor(Math.random() * 2) + 1),
              ageLaps: (driver.currentTires.ageLaps || 0) + 1,
            },
            fuel: Math.max(0, driver.fuel - (Math.random() * 0.5 + 0.2)),
          };
          if (mainDriver && driver.id === mainDriver.id) {
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
        
        // Update mainDriver state if it was affected by the simulation
        if (newMainDriver) {
          setMainDriver(newMainDriver);
        }

        return { 
          ...prevData, 
          drivers: updatedDrivers,
          currentLap: Math.min(prevData.totalLaps, prevData.currentLap + (Math.random() < 0.3 ? 1:0)),
         };
      });
    }, 5000); 

    return () => clearInterval(interval);
  }, [isLoadingDrivers, raceData.drivers, mainDriver, raceData.totalLaps]);

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  if (isLoadingDrivers) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading F1 Driver Data...</p>
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="text-sm md:text-base"><ListChecks className="w-4 h-4 mr-2 hidden md:inline" />Telemetry</TabsTrigger>
            <TabsTrigger value="map" className="text-sm md:text-base"><MapPinIcon className="w-4 h-4 mr-2 hidden md:inline" />Track Map</TabsTrigger>
            <TabsTrigger value="pitstop" className="text-sm md:text-base"><Brain className="w-4 h-4 mr-2 hidden md:inline" />Pit Advisor</TabsTrigger>
            <TabsTrigger value="competitor" className="text-sm md:text-base"><Users className="w-4 h-4 mr-2 hidden md:inline" />Competitor AI</TabsTrigger>
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
              <LiveTelemetry driver={mainDriver} settings={settings} />
            ) : (
              !driverLoadError && <p className="text-center text-muted-foreground p-8">No main driver data to display.</p>
            )}
          </TabsContent>
          <TabsContent value="map">
            {raceData.drivers.length > 0 ? (
              <InteractiveTrackMap 
                allDrivers={raceData.drivers} 
                mainDriver={mainDriver}
                trackName={raceData.trackName} 
              />
            ) : (
               !driverLoadError && <p className="text-center text-muted-foreground p-8">Track map unavailable without driver data.</p>
            )}
          </TabsContent>
          <TabsContent value="pitstop">
            {mainDriver ? (
              <PitStopAdvisor selectedDriver={mainDriver} currentLap={raceData.currentLap} />
            ) : (
               !driverLoadError && <p className="text-center text-muted-foreground p-8">Pit advisor unavailable without main driver data.</p>
            )}
          </TabsContent>
          <TabsContent value="competitor">
            {raceData.drivers.length > 0 ? (
              <CompetitorAnalyzer allDrivers={raceData.drivers} mainDriver={mainDriver} />
            ) : (
              !driverLoadError && <p className="text-center text-muted-foreground p-8">Competitor analyzer unavailable without driver data.</p>
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
        F1 Strategist - Built with Next.js, Tailwind CSS, and Genkit AI. Data from OpenF1 API.
      </footer>
    </div>
  );
}
