'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DailyDistributionData {
  day: string;
  percentage: number;
  totalCount: number;
  userCounts: { [user: string]: number };
}

interface DailyDistributionChartProps {
  data: DailyDistributionData[];
}

const DailyDistributionChart: React.FC<DailyDistributionChartProps> = ({ data }) => {
  // Define the desired order of days
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Sort the data according to the desired day order
  const sortedData = data.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  // Custom Tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const userBreakdown = Object.entries(dataPoint.userCounts)
        .map(([user, count]) => {
          const percentage = dataPoint.totalCount > 0 ? (count / dataPoint.totalCount) * 100 : 0;
          return `${user}: ${percentage.toFixed(2)}%`;
        })
        .join('\n');

      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
          <p className="label">{`${label}`}</p>
          <p>{`Percentage: ${dataPoint.percentage.toFixed(2)}%`}</p>
          <p>{`Total Messages: ${dataPoint.totalCount}`}</p>
          {userBreakdown && <p>{`Messages by User:\n${userBreakdown}`}</p>}
        </div>
      );
    }

    return null;
  };

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
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="percentage" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export { DailyDistributionChart };