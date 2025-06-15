
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Label } from 'recharts';
import type { LapHistoryEntry } from '@/lib/types';
import { TrendingUp, Droplets, Gauge } from 'lucide-react';

interface PerformanceChartsProps {
  lapHistory: LapHistoryEntry[];
  tireWear: number;
  fuel: number;
}

const lapTimeChartConfig = {
  lapTime: {
    label: 'Lap Time (s)',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const tireWearChartConfig = {
  wear: {
    label: 'Tire Wear %',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const fuelLevelChartConfig = {
  fuel: {
    label: 'Fuel Level %',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function PerformanceCharts({ lapHistory, tireWear, fuel }: PerformanceChartsProps) {
  const formattedLapHistory = lapHistory.map(entry => ({
    lap: `Lap ${entry.lap}`,
    lapTime: parseFloat(entry.time.toFixed(2)), // Keep 2 decimal places for time
  }));

  const tireWearData = [{ name: 'Tire Wear', wear: tireWear }];
  const fuelData = [{ name: 'Fuel Level', fuel: parseFloat(fuel.toFixed(1)) }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 px-4 md:px-0">
      <Card className="lg:col-span-3 shadow-lg_">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Lap Time Trend (Last {lapHistory.length} Laps)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lapHistory.length > 1 ? (
            <ChartContainer config={lapTimeChartConfig} className="h-[250px] w-full">
              <LineChart
                accessibilityLayer
                data={formattedLapHistory}
                margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="lap"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                >
                   <Label value="Time (s)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                  dataKey="lapTime"
                  type="monotone"
                  stroke="var(--color-lapTime)"
                  strokeWidth={2}
                  dot={{
                    fill: 'var(--color-lapTime)',
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-center py-10">
              Not enough lap data to display trend. At least 2 laps needed.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg_">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center gap-2">
            <Gauge className="w-5 h-5" /> Tire Wear
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={tireWearChartConfig} className="h-[100px] w-full">
            <BarChart accessibilityLayer data={tireWearData} layout="vertical" margin={{left: 20, right: 20}}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} hide/>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="wear" fill="var(--color-wear)" radius={5} barSize={30} />
            </BarChart>
          </ChartContainer>
           <p className="text-center text-2xl font-bold mt-2">{tireWear.toFixed(0)}%</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg_">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center gap-2">
            <Droplets className="w-5 h-5" /> Fuel Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={fuelLevelChartConfig} className="h-[100px] w-full">
            <BarChart accessibilityLayer data={fuelData} layout="vertical" margin={{left: 20, right: 20}}>
               <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} hide/>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="fuel" fill="var(--color-fuel)" radius={5} barSize={30} />
            </BarChart>
          </ChartContainer>
          <p className="text-center text-2xl font-bold mt-2">{fuel.toFixed(1)}%</p>
        </CardContent>
      </Card>
    </div>
  );
}
