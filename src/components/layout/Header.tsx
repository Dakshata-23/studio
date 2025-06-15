import { Settings as SettingsIcon, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onToggleSettings: () => void;
}

export function Header({ onToggleSettings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary font-headline">
            Race Strategist
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggleSettings} aria-label="Open settings panel">
          <SettingsIcon className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
}
