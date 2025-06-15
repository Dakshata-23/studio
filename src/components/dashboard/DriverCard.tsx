
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Driver, Settings, TireType } from '@/lib/types';
import { TIRE_COMPOUND_CLASSES, MAX_DRIVER_DRIVE_TIME_SECONDS } from '@/lib/constants';
import { Fuel, Clock, Info, Users, TrendingUp, UserCheck, Hourglass } from 'lucide-react';

const getTireWearColorClass = (wear: number): string => {
  if (wear > 75) return 'bg-destructive';
  if (wear > 50) return 'bg-yellow-500';
  return 'bg-green-500';
};

const formatSecondsToHMSCompact = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

const TireDisplay: React.FC<{ type: TireType, wear: number, ageLaps?: number, showWear: boolean }> = ({ type, wear, ageLaps, showWear }) => {
  const tireVisual = TIRE_COMPOUND_CLASSES[type];
  const displayWear = typeof wear === 'number' ? wear : 0;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block h-5 w-5 rounded-full border-2 ${tireVisual.bg} ${tireVisual.border || 'border-transparent'}`}
        title={type}
        aria-label={`Tire type: ${type}`}
      ></span>
      <span className={`font-medium ${tireVisual.text || (tireVisual.bg.includes('light') || tireVisual.bg.includes('yellow') ? 'text-black' : 'text-white')}`}>{type.charAt(0)}</span>
      {ageLaps !== undefined && <span className="text-xs text-muted-foreground">({ageLaps}L)</span>}
      {showWear && (
        <div className="w-16 ml-auto">
          <Progress
            value={100 - displayWear}
            className="h-2"
            aria-label={`Tire wear ${displayWear.toFixed(0)}%`}
            indicatorClassName={getTireWearColorClass(displayWear)}
          />
          <span className="text-xs text-muted-foreground text-right block">{displayWear.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};

interface DriverCardProps {
  driver: Driver;
  settings: Settings;
}

export function DriverCard({ driver, settings }: DriverCardProps) {
  const displayFuel = typeof driver.fuel === 'number' ? driver.fuel : 0;
  const driveTimePercentage = (driver.totalDriveTimeSeconds / MAX_DRIVER_DRIVE_TIME_SECONDS) * 100;

  return (
    <Card className={`bg-card text-card-foreground shadow-lg hover:shadow-primary/20 transition-shadow duration-300 ${driver.isDriving ? 'ring-2 ring-accent' : ''}`}>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-headline flex items-center">
             <span className="w-5 h-5 rounded-sm mr-2" style={{ backgroundColor: driver.color }}></span>
            {driver.shortName} {driver.isDriving && <UserCheck className="w-5 h-5 ml-2 text-accent" title="Currently Driving"/>}
          </CardTitle>
          <div className="text-xl font-bold text-primary">P{driver.position}</div>
        </div>
        <CardDescription className="text-xs">{driver.name}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-muted-foreground"><Info className="w-4 h-4" /> Tires:</span>
          <TireDisplay type={driver.currentTires.type} wear={driver.currentTires.wear} ageLaps={driver.currentTires.ageLaps} showWear={settings.showTireWear} />
        </div>

        {settings.showLapTimes && (
          <>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-4 h-4" /> Last Lap:</span>
              <span>{driver.lastLapTime || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground"><TrendingUp className="w-4 h-4" /> Best Lap:</span>
              <span>{driver.bestLapTime || 'N/A'}</span>
            </div>
          </>
        )}

        {settings.showFuelLevel && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-muted-foreground"><Fuel className="w-4 h-4" /> Fuel:</span>
            <div className="flex items-center gap-2 w-1/2">
              <Progress value={displayFuel} className="h-2 flex-grow" aria-label={`Fuel level ${displayFuel.toFixed(0)}%`} />
              <span>{displayFuel.toFixed(0)}%</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-muted-foreground"><Hourglass className="w-4 h-4" /> Drive Time:</span>
            <div className="flex items-center gap-2 w-1/2">
              <Progress value={driveTimePercentage} className="h-2 flex-grow" indicatorClassName={driveTimePercentage > 85 ? 'bg-destructive' : driveTimePercentage > 60 ? 'bg-yellow-500': 'bg-primary'} aria-label={`Drive time ${formatSecondsToHMSCompact(driver.totalDriveTimeSeconds)}`} />
              <span className="text-xs">{formatSecondsToHMSCompact(driver.totalDriveTimeSeconds)}</span>
            </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-muted-foreground"><Users className="w-4 h-4" /> Pit Stops:</span>
          <span>{driver.pitStops}</span>
        </div>
      </CardContent>
    </Card>
  );
}
