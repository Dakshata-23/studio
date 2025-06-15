'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import type { Driver } from '@/lib/types';
import { Users, Filter } from 'lucide-react';

interface FocusSelectorProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onDriverSelect: (driverId: string | null) => void;
}

export function FocusSelector({ drivers, selectedDriverId, onDriverSelect }: FocusSelectorProps) {
  // Create a list of unique teams
  const teams = Array.from(new Set(drivers.map(driver => driver.team))).sort();

  return (
    <div className="p-4 bg-card rounded-lg shadow_">
      <h3 className="text-lg font-medium mb-3 flex items-center gap-2 text-primary font-headline">
        <Filter className="w-5 h-5" /> Focus Selection
      </h3>
      <Select
        value={selectedDriverId || 'all'}
        onValueChange={(value) => onDriverSelect(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-full text-base">
          <SelectValue placeholder="Select driver or team..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Overview</SelectLabel>
            <SelectItem value="all">All Drivers</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Drivers</SelectLabel>
            {drivers.sort((a,b) => a.position - b.position).map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                P{driver.position} - {driver.name} ({driver.shortName})
              </SelectItem>
            ))}
          </SelectGroup>
          {/* Team selection can be added later if needed
          <SelectGroup>
            <SelectLabel>Teams</SelectLabel>
            {teams.map((team) => (
              <SelectItem key={team} value={`team-${team}`}>
                {team}
              </SelectItem>
            ))}
            </SelectGroup>
          */}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-2">
        {selectedDriverId ? `Focusing on ${drivers.find(d => d.id === selectedDriverId)?.name || 'selected driver'}` : 'Showing all drivers.'}
      </p>
    </div>
  );
}
