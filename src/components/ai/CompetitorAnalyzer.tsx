
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Info } from 'lucide-react';
import type { Driver } from '@/lib/types'; // Keep type for consistency, though props are simplified

interface CompetitorAnalyzerProps {
  allDrivers: Driver[]; // Will be empty in single-team sim
  mainDriver: Driver | null; // Will be null
}

export function CompetitorAnalyzer({ allDrivers, mainDriver }: CompetitorAnalyzerProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
          <Users className="w-6 h-6" /> Competitor Strategy Analyzer
        </CardTitle>
        <CardDescription>Analysis of competitor strategies.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center h-64">
        <Info className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">
          Competitor analysis is less emphasized in this single-team Le Mans simulation.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          The primary focus is on optimizing strategy for "Your Team Endurance".
        </p>
      </CardContent>
    </Card>
  );
}
