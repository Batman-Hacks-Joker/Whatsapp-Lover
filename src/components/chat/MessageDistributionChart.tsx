"use client";

import type { UserMessageCount } from '@/types/chat';
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';
import {
 ChartContainer, type ChartConfig,} from '@/components/ui/chart';
import { CardDescription } from '../ui/card';

// Define colors for the bars
const barColors = [
  'hsl(var(--chart-2))', // Green - for the user with most messages
  'hsl(var(--chart-1))', // Light Sky Blue - for the second user
  'hsl(var(--chart-3))', // Orange
  'hsl(var(--chart-4))', // Purple
  'hsl(var(--chart-5))', // Pink
  'hsl(var(--chart-6))', // Teal
];

// Chart config for legend - will show the primary user's color (Green)
const chartConfig = {
  messages: {
    label: 'Messages',
    color: 'hsl(var(--chart-2))', // Green, matching the first bar color
  },
  count: {
    label: 'Count',
  },
} satisfies ChartConfig;

interface MessageDistributionChartProps {
  data: UserMessageCount[];
}

export function MessageDistributionChart({ data }: MessageDistributionChartProps) {
  if (!data || data.length === 0) {
    return <CardDescription>No message distribution data available for the selected range.</CardDescription>;
  }

  // Sort data by count descending for better visualization, and take top N if too many users
  // For a pie chart, displaying too many slices can be cluttered. Limit to a reasonable number or group others.
  // Let's display top 6 users and potentially group the rest if needed, but for simplicity here, we'll just take top 6.
  const displayData = data.sort((a, b) => b.count - a.count).slice(0, 6); // Display top 6 users for pie chart

  // Calculate total message count for percentage calculation
  const totalMessages = data.reduce((sum, user) => sum + user.count, 0);

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="count"
            data={displayData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={60} // Add innerRadius for donut chart effect to place labels
            fill="#8884d8" // Default fill, will be overridden by Cell colors
            labelLine={false} // Hide label lines
            label={({ cx, cy, midAngle, outerRadius, percent, payload }) => {
              const radius = outerRadius * 0.8; // Position label inside the slice
              const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
              const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
              return (
                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">{`${(percent * 100).toFixed(0)}%`}</text>
              );
            }}
          >
            {/* Use Cell to apply custom colors to each slice */}
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
            ))}
          </Pie>
          {/* Add Tooltip and Legend from recharts */}
          <Tooltip formatter={(value, name, props) => [`${props.payload.user}: ${value}`, 'Total Messages']} />
 <Legend
            payload={
              displayData.map((entry, index) => ({
                value: entry.user,
                color: barColors[index % barColors.length],
              }))
            }
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ paddingLeft: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
