'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ScaleLinear, scaleLinear } from 'd3-scale'; // Using d3-scale for color scaling
import { max } from 'd3-array'; // Using d3-array for finding max value
import { cn } from '@/lib/utils';

interface HeatmapDataPoint {
  day: number; // 0 for Sunday, 6 for Saturday
  hour: number; // 0 to 23
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapDataPoint[];
}

const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const hoursOfDay = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

// SVG dimensions
const SVG_WIDTH = 900; // Adjusted width for better display of 24 hours
const SVG_HEIGHT = 300; // Height for 7 days
const MARGIN = { top: 20, right: 20, bottom: 30, left: 60 };
const CHART_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right; // Chart area width
const CHART_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

const CELL_SIZE = Math.min(CHART_WIDTH / hoursOfDay.length, CHART_HEIGHT / daysOfWeek.length);

// Color scale (adjust colors as needed)
const colorScale: ScaleLinear<string, number, never> = scaleLinear<string, number>()
  .domain([0, 1]) // Domain will be mapped from message count 0 to maxCount
  .range(['#e0f2f7', '#01579b']); // Light color to dark color

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">
            Activity heatmap data not available for the selected range.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Create a map for easier lookup: { `day,hour`: count }
  const dataMap = new Map<string, number>();
  data.forEach((d) => {
    dataMap.set(`${d.day},${d.hour}`, d.count);
  });

  // Find the maximum message count for the color scale domain
  const maxCount = max(data, (d) => d.count) || 0;
  colorScale.domain([0, maxCount]); // Set the domain of the color scale

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent>
        <div className="overflow-x-auto"> {/* Add overflow for horizontal scrolling */}
          <svg width={SVG_WIDTH} height={SVG_HEIGHT}>
            <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
              {/* Y-axis (Days of Week) */}
              {daysOfWeek.map((day, index) => (
                <text
                  key={`day-label-${index}`}
                  x={-MARGIN.left / 2} // Adjust position
                  y={index * CELL_SIZE + CELL_SIZE / 2}
                  dy=".31em"
                  textAnchor="middle"
                  className="text-xs fill-current text-gray-600" // Tailwind text styles
                >
                  {day}
                </text>
              ))}

              {/* X-axis (Hours of Day) */}
              {hoursOfDay.map((hour, index) => (
                <text
                  key={`hour-label-${index}`}
                  x={index * CELL_SIZE + CELL_SIZE / 2}
                  y={CHART_HEIGHT + MARGIN.bottom / 3} // Adjust position below chart
                  dy=".71em"
                  textAnchor="middle"
                  className="text-xs fill-current text-gray-600" // Tailwind text styles
                >
                  {hour.toString().padStart(2, '0')}
                </text>
              ))}

              {/* Heatmap Cells */}
              {daysOfWeek.map((_, dayIndex) =>
                hoursOfDay.map((hourIndex) => {
                  const count = dataMap.get(`${dayIndex},${hourIndex}`) || 0;
                  const color = colorScale(count);

                  return (
                    <rect
                      key={`heatmap-cell-${dayIndex}-${hourIndex}`}
                      x={hourIndex * CELL_SIZE}
                      y={dayIndex * CELL_SIZE}
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      fill={color}
                      className="stroke-white stroke-px" // Add thin white stroke for separation
                    >
                       {/* Tooltip title for each cell */}
                       <title>{`${daysOfWeek[dayIndex]}, Hour ${hourIndex.toString().padStart(2, '0')}: ${count} messages`}</title>
                    </rect>
                  );
                })
              )}
            </g>
          </svg>
          {/* Color Scale Legend */}
          <svg width={SVG_WIDTH} height={MARGIN.bottom * 2}> {/* Allocate space for legend */}
            <g transform={`translate(${MARGIN.left}, ${MARGIN.bottom / 2})`}> {/* Position below heatmap */}
               {/* Gradient for the color scale */}
              <linearGradient id="heatmapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colorScale(0) as string} />
                <stop offset="100%" stopColor={colorScale(maxCount) as string} />
              </linearGradient>
              <rect
                x={0}
                y={0}
                width={CHART_WIDTH / 2} // Make legend half the width of the chart area
                height={10} // Height of the gradient bar
                fill="url(#heatmapGradient)"
              />
              {/* Labels for min and max count */}
              <text
                x={0}
                y={25} // Position below the bar
                textAnchor="start"
                className="text-xs fill-current text-gray-600"
              >
                {`Min: ${0}`}
              </text>
              <text x={CHART_WIDTH / 2} y={25} textAnchor="end" className="text-xs fill-current text-gray-600">
                {`Max: ${maxCount.toLocaleString()}`}
              </text>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityHeatmap;