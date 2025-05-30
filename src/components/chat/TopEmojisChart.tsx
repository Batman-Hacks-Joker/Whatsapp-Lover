"use client";

import React from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EmojiData {
  emoji: string;
  count: number;
}

interface TopEmojisChartProps {
  data: EmojiData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BCA'];

const TopEmojisChart: React.FC<TopEmojisChartProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const top5Emojis = sortedData.slice(0, 5);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Emoji Distribution</CardTitle>
          <CardDescription>Distribution of the most frequently used emojis.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p>Emoji distribution data not available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Emoji Distribution</CardTitle>
        <CardDescription>Distribution of the most frequently used emojis.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={top5Emojis}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="emoji"
              label={({ emoji, percent }) => `${emoji} ${(percent * 100).toFixed(0)}%`}
            >
              {top5Emojis.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name, props) => [`Count: ${value}`, `Emoji: ${name}`]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TopEmojisChart;