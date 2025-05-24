"use client";

import type { HourlyDistributionItem } from '@/types/chat';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { CardDescription } from '../ui/card';

interface HourlyDistributionChartProps {
  data: HourlyDistributionItem[];
}

const chartConfig = {
  messages: {
    label: 'Messages',
    color: 'hsl(var(--chart-2))', // Using a different chart color
  },
} satisfies ChartConfig;

export function HourlyDistributionChart({ data }: HourlyDistributionChartProps) {
  if (!data || data.every(item => item.count === 0)) {
    return <CardDescription>No hourly message distribution data available for the selected range.</CardDescription>;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart accessibilityLayer data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="hour" // Should be "00", "01", ..., "23"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={5}
            width={40}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dashed" />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="count" name="Messages" fill="var(--color-messages)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
