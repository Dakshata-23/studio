'use client';

import type { Driver } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';

interface DriverPositionsTableProps {
  drivers: Driver[];
}

export function DriverPositionsTable({ drivers }: DriverPositionsTableProps) {
  // Sort drivers by position
  const sortedDrivers = [...drivers].sort((a, b) => a.position - b.position);

  return (
    <Card className="shadow-lg_">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
          <Car className="w-6 h-6" /> Live Driver Positions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Pos</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Last Lap</TableHead>
              <TableHead>Tire</TableHead>
              <TableHead className="text-right">Gap</TableHead> {/* Changed from Fuel to Gap */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDrivers.map((driver, index) => {
              const previousDriver = sortedDrivers[index - 1];
              let gap = '';

              if (previousDriver && driver.lastLapTime && previousDriver.lastLapTime) {
                const parseLapTimeToSeconds = (lapTime: string | null): number | null => {
                  if (!lapTime) return null;
                  const parts = lapTime.split(':');
                  if (parts.length !== 2) return null;
                  
                  const minutes = parseInt(parts[0], 10);
                  const secondsAndMillis = parseFloat(parts[1]);

                  if (isNaN(minutes) || isNaN(secondsAndMillis)) return null;
                  
                  return minutes * 60 + secondsAndMillis;
                };

                const driverLapTime = parseLapTimeToSeconds(driver.lastLapTime);
                const prevDriverLapTime = parseLapTimeToSeconds(previousDriver.lastLapTime);

                if (driverLapTime !== null && prevDriverLapTime !== null) {
                  const diff = Math.abs(driverLapTime - prevDriverLapTime); // Always positive difference
                  gap = `+${diff.toFixed(3)}s`; // Always show with a '+'
                }
              } else if (index === 0) {
                gap = 'Leader';
              }

              return (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.position}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: driver.color }}></span>
                      {driver.name}
                    </div>
                  </TableCell>
                  <TableCell>{driver.team}</TableCell>
                  <TableCell>{driver.lastLapTime || 'N/A'}</TableCell>
                  <TableCell>{driver.currentTires.type}</TableCell> {/* Removed tire wear */}
                  <TableCell className="text-right">{gap}</TableCell> {/* Displaying gap */}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}