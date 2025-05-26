'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyDistributionData {
  day: string;
  percentage: number;
}

interface DailyDistributionChartProps {
  data: DailyDistributionData[];
}

const DailyDistributionChart: React.FC<DailyDistributionChartProps> = ({ data }) => {
  // Define the desired order of days
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Sort the data according to the desired day order
  const sortedData = data.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={sortedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis tickFormatter={(tick) => `${tick}%`} />
        <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, 'Percentage']} />
        <Bar dataKey="percentage" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export { DailyDistributionChart };