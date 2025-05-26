'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

  // Define a color mapping for each day using minimalistic colors
  const dayColors: { [key: string]: string } = { // Updated dayColors mapping
    'Monday': '#FF4949',
    'Tuesday': '#13CE66',
    'Wednesday': '#FFCC3D',
    'Thursday': '#2D8EFF',
    'Friday': '#DCEEFF',
    'Saturday': '#6E38FF',
    'Sunday': '#FF18A3',
  };

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
          <p><b>Total Messages:</b> {dataPoint.totalCount}</p>
          {userBreakdown && <p>{`${userBreakdown}`}</p>}
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
        <Bar dataKey="percentage">
          {
            sortedData.map((entry, index) => <Cell key={`cell-${index}`} fill={dayColors[entry.day]} />)
          }
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export { DailyDistributionChart };