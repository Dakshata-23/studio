import React, { useState, useEffect } from 'react';
import { Driver, TireType } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PitStopPerformancePanelProps {
  mainDriver: Driver;
  currentLap: number;
  onPlanPitStop: (compound: TireType, laps: number) => void;
  onCancelPitStop: () => void; // New prop for canceling pit stop
}

export const PitStopPerformancePanel: React.FC<PitStopPerformancePanelProps> = ({ mainDriver, currentLap, onPlanPitStop, onCancelPitStop }) => {
  const TIRE_TYPES: TireType[] = ['Soft', 'Medium', 'Hard', 'Intermediate', 'Wet'];
  const [selectedCompound, setSelectedCompound] = useState<TireType>(mainDriver.currentTires.type);
  const [lapsToPit, setLapsToPit] = useState<number>(10); // Default to 10 laps

  const plannedPitStop = mainDriver.plannedPitStop;

  useEffect(() => {
    // Reset selected compound if mainDriver changes or current tires change
    setSelectedCompound(mainDriver.currentTires.type);
  }, [mainDriver.currentTires.type]);

  const handlePlanPitStop = () => {
    onPlanPitStop(selectedCompound, lapsToPit);
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Pit Stop Performance for {mainDriver.name}</h2>
      
      <div className="mb-4">
        <Label htmlFor="tireWear" className="text-lg">Current Tire Wear: {mainDriver.currentTires.wear}% ({mainDriver.currentTires.type})</Label>
        <Progress value={mainDriver.currentTires.wear} className="w-full" />
        <p className="text-sm text-muted-foreground">Age: {mainDriver.currentTires.ageLaps} laps</p>
      </div>

      {plannedPitStop ? (
        <div className="mt-6 p-4 border border-dashed border-primary-foreground rounded-md bg-primary-foreground/10">
          <h3 className="text-lg font-semibold mb-2 text-primary">Next Pit Stop Planned!</h3>
          <p className="text-base">
            <strong>Target Lap:</strong> {plannedPitStop.targetLap}
          </p>
          <p className="text-base">
            <strong>New Tires:</strong> {plannedPitStop.newTireCompound}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            (Current Lap: {currentLap})
          </p>
          <Button
            onClick={onCancelPitStop}
            variant="outline"
            className="mt-4 w-full"
            disabled={currentLap + 1 >= plannedPitStop.targetLap} // Disable if too close to pit stop
          >
            {currentLap + 1 >= plannedPitStop.targetLap ? "Cannot Cancel (Pit Approaching)" : "Cancel Pit Stop"}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="tireCompound" className="mb-2 block">Select New Tire Compound</Label>
              <Select value={selectedCompound} onValueChange={(value: TireType) => setSelectedCompound(value)}>
                <SelectTrigger id="tireCompound">
                  <SelectValue placeholder="Select a compound" />
                </SelectTrigger>
                <SelectContent>
                  {TIRE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lapsToPit" className="mb-2 block">Laps Until Pit Stop</Label>
              <Input
                id="lapsToPit"
                type="number"
                value={lapsToPit}
                onChange={(e) => setLapsToPit(parseInt(e.target.value) || 0)}
                min={1}
                max={(mainDriver.currentTires.ageLaps ?? 0) + 20} // Arbitrary max for now
              />
            </div>
          </div>

          <Button onClick={handlePlanPitStop} className="w-full">Plan Pit Stop</Button>
        </>
      )}

    </div>
  );
};
