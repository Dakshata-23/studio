
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Driver, TireType } from '@/lib/types';
import { TIRE_COMPOUND_CLASSES } from '@/lib/constants';
import { MapPin, UserCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState, useEffect } from 'react';

interface InteractiveTrackMapProps {
  allDrivers: Driver[]; // All drivers for showing positions (focused team)
  mainDriver: Driver | null; // The single currently driving driver for highlighting
  trackName: string;
}

// Simplified mock positions for demonstration.
const MOCK_POSITIONS = [
  { x: 10, y: 20 }, { x: 15, y: 25 }, { x: 20, y: 30 }, { x: 25, y: 35 },
  { x: 30, y: 20 }, { x: 35, y: 25 }, { x: 40, y: 30 }, { x: 45, y: 35 },
  { x: 50, y: 20 }, { x: 55, y: 25 }, { x: 60, y: 30 }, { x: 65, y: 35 },
  { x: 70, y: 20 }, { x: 75, y: 25 }, { x: 80, y: 30 }, { x: 85, y: 35 },
  { x: 90, y: 20 }, { x: 5, y: 50 }, { x: 12, y: 55 }, { x: 18, y: 60 },
];

interface ClientDriver extends Driver {
  mapPosition: { x: number; y: number };
}

export function InteractiveTrackMap({ allDrivers, mainDriver, trackName }: InteractiveTrackMapProps) {
  const [clientDrivers, setClientDrivers] = useState<ClientDriver[]>([]);

  useEffect(() => {
    // Simple logic to assign somewhat distinct mock positions
    // In a real scenario, this would come from telemetry data
    setClientDrivers(allDrivers.map((driver, index) => {
      const basePosIndex = driver.driver_number || index; // Use driver_number for some consistency
      const xOffset = (index % 3) * 2; // Small offset for drivers of the same team
      const yOffset = (index % 2) * 2;
      const mockPos = MOCK_POSITIONS[basePosIndex % MOCK_POSITIONS.length] || {x: 50, y: 50};
      return {
        ...driver,
        mapPosition: { 
            x: Math.min(95, Math.max(5, mockPos.x + xOffset)), 
            y: Math.min(95, Math.max(5, mockPos.y + yOffset))
        }
      }
    }));
  }, [allDrivers]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
          <MapPin className="w-6 h-6" /> Interactive Track Map (Simulated Positions)
        </CardTitle>
        <p className="text-sm text-muted-foreground">{trackName}</p>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-[16/9] bg-muted rounded-md overflow-hidden border">
          <Image
            src="https://placehold.co/800x450.png"
            alt="Race Track Layout (Placeholder)"
            layout="fill"
            objectFit="cover"
            data-ai-hint="race track circuit"
            className="opacity-30"
          />
          {clientDrivers.map((driver) => {
            const tireVisual = TIRE_COMPOUND_CLASSES[driver.currentTires.type];
            const isCurrentDrivingDriver = mainDriver ? driver.id === mainDriver.id : false;
            const pos = driver.mapPosition;

            return (
              <Popover key={driver.id}>
                <PopoverTrigger asChild>
                  <button
                    aria-label={`Driver ${driver.shortName} position`}
                    className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 transform hover:scale-110 focus:outline-none`}
                    style={{ 
                      left: `${pos.x}%`, 
                      top: `${pos.y}%`, 
                      backgroundColor: driver.color,
                      border: isCurrentDrivingDriver ? '3px solid hsl(var(--accent))' : `2px solid ${driver.color}`,
                      boxShadow: isCurrentDrivingDriver ? '0 0 10px hsl(var(--accent))' : 'none',
                      zIndex: isCurrentDrivingDriver ? 10 : driver.isDriving ? 5 : 1, // Ensure driving driver is prominent if not main highlighted one
                     }}
                  >
                    <span className="text-white mix-blend-difference">{driver.shortName.substring(0,2)}</span>
                     {driver.isDriving && <UserCheck className="absolute -top-1 -right-1 w-3 h-3 text-white bg-accent rounded-full p-0.5" />}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" side="top" align="center">
                  <div className="font-bold text-base">{driver.name} - P{driver.position} {driver.isDriving ? '(Driving)' : ''}</div>
                  <div className="text-sm text-muted-foreground">{driver.team}</div>
                  <hr className="my-2"/>
                  <div className="text-xs space-y-1">
                    <p>Tires: <span className={`px-1.5 py-0.5 rounded text-xs ${tireVisual.bg} ${tireVisual.text || (tireVisual.bg.includes('light') || tireVisual.bg.includes('yellow') ? 'text-black' : 'text-white')}`}>{driver.currentTires.type}</span> ({driver.currentTires.wear.toFixed(0)}% wear, {driver.currentTires.ageLaps} Laps)</p>
                    <p>Last Lap: {driver.lastLapTime || 'N/A'}</p>
                    <p>Pit Stops: {driver.pitStops}</p>
                    <p>Drive Time: {Math.floor(driver.totalDriveTimeSeconds / 3600)}h {Math.floor((driver.totalDriveTimeSeconds % 3600) / 60)}m</p>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
        {mainDriver && <p className="text-xs text-muted-foreground mt-2 text-center">Highlighting {mainDriver.name}. Driver positions are illustrative for this simulation.</p>}
        {!mainDriver && <p className="text-xs text-muted-foreground mt-2 text-center">Driver positions are illustrative for this simulation.</p>}
      </CardContent>
    </Card>
  );
}
