"use client";

import type { TemporalDataItem } from '@/types/chat';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { CardDescription } from '../ui/card';
import { useMemo } from 'react';

interface TemporalMessageVolumeChartProps {
  data: TemporalDataItem[];
  users: string[];
}

const userColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  // Add more if needed, or use a color generation function
  'hsl(var(--primary))', 
  'hsl(var(--accent))',
];

export function TemporalMessageVolumeChart({ data, users }: TemporalMessageVolumeChartProps) {
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    users.forEach((user, index) => {
      config[user] = {
        label: user,
        color: userColors[index % userColors.length],
      };
    });
    return config;
  }, [users]);

  if (!data || data.length === 0) {
    return <CardDescription>No temporal message volume data available for the selected range.</CardDescription>;
  }
  
  // Format X-axis ticks for readability if too many dates
  const xAxisTickFormatter = (tick: string) => {
    if (data.length > 30) { // Heuristic: if more than 30 data points, show fewer labels
        const date = new Date(tick);
        // Show label for 1st of month, or Mondays, or some other interval
        if (date.getDate() === 1 || data.length <= 7) return tick; // Show 1st of month or all if few points
        return ""; // Otherwise hide
    }
    return tick;
  };


  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[400px]">
       <ResponsiveContainer width="100%" height="100%">
        <LineChart accessibilityLayer data={data} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            style={{ fontSize: '12px' }}
            tickFormatter={xAxisTickFormatter}
            interval="preserveStartEnd" // Show first and last tick
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={5}
            width={40}
          />
          <ChartTooltip
            cursor={true}
            content={<ChartTooltipContent indicator="line" />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {users.map((user) => (
            <Line
              key={user}
              dataKey={user}
              type="monotone"
              stroke={`var(--color-${user})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
