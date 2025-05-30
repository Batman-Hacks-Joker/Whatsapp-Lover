
export interface ChatMessage {
  id: string; // Unique ID for each message
  timestamp: Date;
  user: string;
  message: string;
}

export interface UserMessageCount {
  user: string;
  count: number;
}

export interface HourlyDistributionItem {
  hour: string; // "00", "01", ..., "23"
  count: number;
}

export interface TemporalDataItem {
  date: string; // "YYYY-MM-DD"
  [user: string]: number | string; // Message counts for each user, plus the date string
}

export interface UserLongestMessages {
  user: string;
  longestMessages: string[];
}

export interface AnalyzedData {
  totalMessages: number;
  userMessageCounts: UserMessageCount[];
  temporalVolume: {
    daily: TemporalDataItem[];
  };
  hourlyDistribution: HourlyDistributionItem[];
  totalWords?: number; // Optional: Total words in the analyzed messages
  userLongestMessages?: UserLongestMessages[]; // Optional: Top 3 longest messages per user
  allUsers: string[]; // List of all unique users found in the filtered data
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
