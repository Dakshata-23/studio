'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Settings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/constants';

interface SettingsPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
}

export function SettingsPanel({ isOpen, onOpenChange, settings, onSettingsChange }: SettingsPanelProps) {
  const [currentSettings, setCurrentSettings] = useState<Settings>(settings);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  const handleSwitchChange = (id: keyof Settings, checked: boolean) => {
    const newSetting = { [id]: checked };
    setCurrentSettings(prev => ({...prev, ...newSetting}));
    onSettingsChange(newSetting);
  };

  const handleSelectChange = (id: keyof Settings, value: string) => {
    const newSetting = { [id]: value };
    setCurrentSettings(prev => ({...prev, ...newSetting}));
    onSettingsChange(newSetting);
  };


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card text-card-foreground border-border">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-headline">Customization Settings</SheetTitle>
          <SheetDescription>
            Adjust dashboard display and AI assistance preferences.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          <h3 className="text-lg font-medium text-primary font-headline">Data Display</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showLapTimes" className="text-base">Show Lap Times</Label>
              <Switch
                id="showLapTimes"
                checked={currentSettings.showLapTimes}
                onCheckedChange={(checked) => handleSwitchChange('showLapTimes', checked)}
                aria-labelledby="showLapTimesLabel"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showFuelLevel" className="text-base">Show Fuel Level</Label>
              <Switch
                id="showFuelLevel"
                checked={currentSettings.showFuelLevel}
                onCheckedChange={(checked) => handleSwitchChange('showFuelLevel', checked)}
                aria-labelledby="showFuelLevelLabel"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showTireWear" className="text-base">Show Tire Wear</Label>
              <Switch
                id="showTireWear"
                checked={currentSettings.showTireWear}
                onCheckedChange={(checked) => handleSwitchChange('showTireWear', checked)}
                aria-labelledby="showTireWearLabel"
              />
            </div>
          </div>

          <h3 className="text-lg font-medium text-primary font-headline mt-6">AI Assistance</h3>
          <div className="space-y-2">
            <Label htmlFor="aiAssistanceLevel" className="text-base">Assistance Level</Label>
            <Select
              value={currentSettings.aiAssistanceLevel}
              onValueChange={(value) => handleSelectChange('aiAssistanceLevel', value)}
            >
              <SelectTrigger id="aiAssistanceLevel" className="w-full">
                <SelectValue placeholder="Select AI level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Suggestions</SelectItem>
                <SelectItem value="advanced">Advanced Analysis</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the level of detail for AI-powered insights.
            </p>
          </div>
        </div>

        <SheetFooter className="mt-8">
          <Button onClick={() => onOpenChange(false)} variant="outline">Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
