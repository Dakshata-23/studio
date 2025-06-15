'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Driver, Settings, TireType } from '@/lib/types';
import { TIRE_COMPOUND_CLASSES } from '@/lib/constants';
import { Fuel, Zap, Clock, Info, Users, TrendingUp } from 'lucide-react';

interface DriverCardProps {
  driver: Driver;
  settings: Settings;
}

const TireDisplay: React.FC<{ type: TireType, wear: number, ageLaps?: number, showWear: boolean }> = ({ type, wear, ageLaps, showWear }) => {
  const tireVisual = TIRE_COMPOUND_CLASSES[type];
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
          <Progress value={100 - wear} className="h-2" aria-label={`Tire wear ${wear}%`} />
          <span className="text-xs text-muted-foreground text-right block">{wear}%</span>
        </div>
      )}
    </div>
  );
};


export function DriverCard({ driver, settings }: DriverCardProps) {
  return (
    <Card className="bg-card text-card-foreground shadow-lg hover:shadow-primary/20 transition-shadow duration-300_">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-headline flex items-center">
             <span className="w-6 h-6 rounded-sm mr-2" style={{ backgroundColor: driver.color }}></span>
            {driver.shortName}
          </CardTitle>
          <div className="text-2xl font-bold text-primary">{driver.position}</div>
        </div>
        <CardDescription className="text-sm">{driver.name} - {driver.team}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground"><Info className="w-4 h-4" /> Tires:</span>
          <TireDisplay type={driver.currentTires.type} wear={driver.currentTires.wear} ageLaps={driver.currentTires.ageLaps} showWear={settings.showTireWear} />
        </div>
        
        {settings.showLapTimes && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-4 h-4" /> Last Lap:</span>
              <span>{driver.lastLapTime || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground"><TrendingUp className="w-4 h-4" /> Best Lap:</span>
              <span>{driver.bestLapTime || 'N/A'}</span>
            </div>
          </>
        )}

        {settings.showFuelLevel && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground"><Fuel className="w-4 h-4" /> Fuel:</span>
            <div className="flex items-center gap-2 w-1/2">
              <Progress value={driver.fuel} className="h-2 flex-grow" aria-label={`Fuel level ${driver.fuel}%`} />
              <span>{driver.fuel}%</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground"><Users className="w-4 h-4" /> Pit Stops:</span>
          <span>{driver.pitStops}</span>
        </div>
      </CardContent>
    </Card>
  );
}
