import type { ChatMessage, AnalyzedData, DateRange, UserMessageCount, HourlyDistributionItem, DailyDistributionItem, UserLongestMessages } from '@/types/chat';
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
      totalWords: 0,
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

  // Top 3 Longest Messages per User
  const userMessages: Record<string, ChatMessage[]> = {};
  filteredMessages.forEach(msg => {
    if (!userMessages[msg.user]) {
      userMessages[msg.user] = [];
    }
    // Exclude potential emoji-only messages (starts and ends with an emoji)
    const emojiRegex = /^([\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|[\u2600-\u26FF]|[\u2700-\u27BF])+$/;
    if (!emojiRegex.test(msg.message.trim())) {
      userMessages[msg.user].push(msg);
    }
  });

  const userLongestMessages: UserLongestMessages[] = Object.entries(userMessages)
    .filter(([, messages]) => messages.length >= 3) // Only include users with at least 3 messages
    .map(([user, messages]) => ({
      user,
      messages: messages.sort((a, b) => b.message.length - a.message.length).slice(0, 3), // Get top 3 longest
    }));

  // Total Words
  const totalWords = filteredMessages.reduce((total, message) => {
    return total + message.message.split(/\s+/).filter(word => word.length > 0).length;
  }, 0);

  return {
    totalMessages,
    userMessageCounts,
    dailyDistribution,
    hourlyDistribution,
    allUsers,
    totalWords,
    userLongestMessages,
  };
}
