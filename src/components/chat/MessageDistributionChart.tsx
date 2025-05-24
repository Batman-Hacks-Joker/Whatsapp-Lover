"use client";

import type { UserMessageCount } from '@/types/chat';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { CardDescription } from '../ui/card';

// Define colors for the bars
const barColors = [
  'hsl(var(--chart-2))', // Green - for the user with most messages
  'hsl(var(--chart-1))', // Light Sky Blue - for the second user
  'hsl(var(--chart-3))', // Orange
  'hsl(var(--chart-4))', // Purple
  'hsl(var(--chart-5))', // Pink
];

// Chart config for legend - will show the primary user's color (Green)
const chartConfig = {
  messages: {
    label: 'Messages',
    color: 'hsl(var(--chart-2))', // Green, matching the first bar color
  },
} satisfies ChartConfig;

export function MessageDistributionChart({ data }: MessageDistributionChartProps) {
  if (!data || data.length === 0) {
    return <CardDescription>No message distribution data available for the selected range.</CardDescription>;
  }
  
  // Sort data by count descending for better visualization, and take top N if too many users
  const displayData = data.sort((a,b) => b.count - a.count).slice(0, 15); // Display top 15 users

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart accessibilityLayer data={displayData} margin={{ top: 5, right: 20, left: -20, bottom: 50 /* Increased bottom margin for labels */ }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="user"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            angle={-45} // Angle labels for better readability
            textAnchor="end" // Anchor angled labels correctly
            interval={0} // Show all labels
            height={1} // Minimal height, actual height controlled by margin
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
          <Bar dataKey="count" name="Messages" radius={4}>
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
