import type { ChatMessage, AnalyzedData, DateRange, UserMessageCount, HourlyDistributionItem, DailyDistributionItem } from '@/types/chat';
import { format, eachDayOfInterval, isWithinInterval, getHours, getDay } from 'date-fns';

export function analyzeChatData(messages: ChatMessage[], dateRange: DateRange): AnalyzedData | null {
  if (!dateRange.from || !dateRange.to) {
    return null;
  }

  const filteredMessages = messages.filter(msg => 
    isWithinInterval(msg.timestamp, { start: dateRange.from!, end: dateRange.to! })
  );

  if (filteredMessages.length === 0) {
    return {
      totalMessages: 0,
      userMessageCounts: [],
      dailyDistribution: [],
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({ hour: format(new Date(0, 0, 0, i), 'HH'), count: 0 })),
      allUsers: [],
    };
  }

  // Total Messages
  const totalMessages = filteredMessages.length;

  // Message Distribution per User
  const userCounts: Record<string, number> = {};
  filteredMessages.forEach(msg => {
    userCounts[msg.user] = (userCounts[msg.user] || 0) + 1;
  });
  const userMessageCounts: UserMessageCount[] = Object.entries(userCounts)
    .map(([user, count]) => ({ user, count }))
    .sort((a, b) => b.count - a.count);
  
  const allUsers = [...new Set(filteredMessages.map(msg => msg.user))].sort();

  // Hourly Distribution
  const hourlyCounts: number[] = Array(24).fill(0);
  filteredMessages.forEach(msg => {
    const hour = getHours(msg.timestamp);
    hourlyCounts[hour]++;
  });
  const hourlyDistribution: HourlyDistributionItem[] = hourlyCounts.map((count, hour) => ({
    hour: format(new Date(0, 0, 0, hour), 'HH'), // "00", "01", ...
    count,
  }));

  // Daily Distribution (Monday to Sunday) by Percentage
  const dayOfWeekData: Record<number, { totalCount: number, userCounts: Record<string, number> }> = {};
  for(let i = 0; i < 7; i++) {
    dayOfWeekData[i] = { totalCount: 0, userCounts: {} };
  }

  filteredMessages.forEach(msg => {
    const dayOfWeek = getDay(msg.timestamp); // getDay returns 0 for Sunday, 1 for Monday, etc.
    dayOfWeekData[dayOfWeek].totalCount++;
    dayOfWeekData[dayOfWeek].userCounts[msg.user] = (dayOfWeekData[dayOfWeek].userCounts[msg.user] || 0) + 1;
  });

  const totalFilteredMessages = filteredMessages.length;
  const dailyDistribution: DailyDistributionItem[] = Object.entries(dayOfWeekData).map(([dayIndex, data]) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = dayNames[parseInt(dayIndex)];
    const percentage = totalFilteredMessages === 0 ? 0 : (data.totalCount / totalFilteredMessages) * 100;

    return {
      day,
      percentage: parseFloat(percentage.toFixed(2)), // Keep two decimal places
      totalCount: data.totalCount,
      userCounts: data.userCounts
    };
  }).sort((a, b) => {
      // Sort by day of week (Monday to Sunday)
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
  });

  return {
    totalMessages,
    userMessageCounts,
    dailyDistribution,
    hourlyDistribution,
    allUsers,
  };
}
