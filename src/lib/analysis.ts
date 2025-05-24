import type { ChatMessage, AnalyzedData, DateRange, UserMessageCount, HourlyDistributionItem, TemporalDataItem } from '@/types/chat';
import { format, eachDayOfInterval, isWithinInterval, getHours } from 'date-fns';

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
      temporalVolume: { daily: [] },
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

  // Temporal Message Volume (Daily)
  const dailyVolume: Record<string, Record<string, number>> = {}; // { 'YYYY-MM-DD': { user1: count, user2: count } }
  const daysInInterval = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

  daysInInterval.forEach(day => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    dailyVolume[formattedDay] = {};
    allUsers.forEach(user => {
      dailyVolume[formattedDay][user] = 0; // Initialize count for all users for this day
    });
  });
  
  filteredMessages.forEach(msg => {
    const dayKey = format(msg.timestamp, 'yyyy-MM-dd');
    if (dailyVolume[dayKey]) { // Ensure dayKey exists (it should due to pre-initialization)
        dailyVolume[dayKey][msg.user] = (dailyVolume[dayKey][msg.user] || 0) + 1;
    }
  });

  const temporalDailyData: TemporalDataItem[] = Object.entries(dailyVolume).map(([date, userCountsForDay]) => ({
    date,
    ...userCountsForDay,
  })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


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

  return {
    totalMessages,
    userMessageCounts,
    temporalVolume: { daily: temporalDailyData },
    hourlyDistribution,
    allUsers,
  };
}
