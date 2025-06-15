
'use client';

import type { Driver, Settings } from '@/lib/types';
import { DriverCard } from './DriverCard';

interface LiveTelemetryProps {
  driver: Driver | null; // Changed to a single driver or null
  settings: Settings;
}

export function LiveTelemetry({ driver, settings }: LiveTelemetryProps) {
  if (!driver) {
    return <p className="text-center text-muted-foreground p-8">No driver data available to display.</p>;
  }

  return (
    <div className="py-6">
      <h2 className="text-3xl font-bold mb-6 text-primary font-headline px-4 md:px-0">Live Telemetry</h2>
      <p className="mb-4 text-lg text-accent px-4 md:px-0">Showing data for: {driver.name}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 md:px-0">
        {/* Display only the single mainDriver */}
        <DriverCard driver={driver} settings={settings} />
      </div>
    </div>
  );
}
