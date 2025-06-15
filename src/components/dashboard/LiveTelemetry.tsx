'use client';

import type { Driver, Settings } from '@/lib/types';
import { DriverCard } from './DriverCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface LiveTelemetryProps {
  drivers: Driver[];
  settings: Settings;
  focusedDriverId?: string | null;
}

export function LiveTelemetry({ drivers, settings, focusedDriverId }: LiveTelemetryProps) {
  const displayedDrivers = focusedDriverId 
    ? drivers.filter(driver => driver.id === focusedDriverId) 
    : drivers;

  if (displayedDrivers.length === 0 && focusedDriverId) {
     return <p className="text-center text-muted-foreground p-8">Driver data not available for {focusedDriverId}.</p>;
  }
  if (drivers.length === 0) {
    return <p className="text-center text-muted-foreground p-8">No driver data available.</p>;
  }


  return (
    <div className="py-6">
      <h2 className="text-3xl font-bold mb-6 text-primary font-headline px-4 md:px-0">Live Telemetry</h2>
      {focusedDriverId && displayedDrivers.length > 0 && (
         <p className="mb-4 text-lg text-accent px-4 md:px-0">Showing data for: {displayedDrivers[0].name}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 md:px-0">
        {displayedDrivers.sort((a, b) => a.position - b.position).map((driver) => (
          <DriverCard key={driver.id} driver={driver} settings={settings} />
        ))}
      </div>
    </div>
  );
}
