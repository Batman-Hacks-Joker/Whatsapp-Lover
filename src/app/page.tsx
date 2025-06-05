"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from '@/components/chat/FileUpload';
import { DateRangeSelector } from '@/components/chat/DateRangeSelector';
import { MessageDistributionChart } from '@/components/chat/MessageDistributionChart';
import { HourlyDistributionChart } from '@/components/chat/HourlyDistributionChart';
import { DailyDistributionChart } from '@/components/chat/DailyDistributionChart';
import ActivityHeatmap from '@/components/chat/ActivityHeatmap';
import { parseChatFile, extractEmojis } from '@/lib/chat-parser';
import { analyzeChatData, getTopWordsByUser } from '@/lib/analysis';
import type { ChatMessage, AnalyzedData, DateRange } from '@/types/chat';
import UserLongestMessages from '../components/chat/UserLongestMessages';
import UserRandomMessages from '../components/chat/UserRandomMessages';
import UserEmojiChartsContainer from '../components/chat/UserEmojiChartsContainer';
import {
  Activity,
  BarChart3,
  Clock,
  CalendarDays,
  MessageSquare,
  Users,
  UploadCloud,
  Laugh,
} from 'lucide-react';

export default function ChatterStatsPage() {
  const [parsedChatData, setParsedChatData] = useState<ChatMessage[]>([]);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
  const [topWordsByUser, setTopWordsByUser] = useState<any[]>([]); // TODO: Define a proper type for this
  const [chatDateRange, setChatDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
  const [topEmojisData, setTopEmojisData] = useState<{ emoji: string; count: number }[]>([]);
  const { toast } = useToast();

  const handleFileProcessed = async (
    content: string,
    fileName: string,
    fileType: 'txt' | 'csv'
  ) => {
    setIsLoading(true);
    setError(null);
    setAnalyzedData(null);
    setParsedChatData([]);
    setChatDateRange({ from: undefined, to: undefined });
    setSelectedDateRange({ from: undefined, to: undefined });

    try {
      const { messages, topEmojis } = parseChatFile(content, fileType);
      if (messages.length === 0) {
        toast({
          variant: "destructive",
          title: "No Messages Found",
          description: "The file was processed, but no valid chat messages were found.",
        });
        return;
      }

      setParsedChatData(messages);

      const timestamps = messages.map((msg) => msg.timestamp.getTime()).filter(t => !isNaN(t));
      const minDate = new Date(Math.min(...timestamps));
      const maxDate = new Date(Math.max(...timestamps));
      setTopEmojisData(topEmojis);

      setChatDateRange({ from: minDate, to: maxDate });
      setSelectedDateRange({ from: minDate, to: new Date(minDate.getTime() + 24 * 60 * 60 * 1000) });

      toast({
        title: "File Processed",
        description: `${messages.length} messages found in ${fileName}.`,
      });
    } catch (e: any) {
      console.error("Error processing file:", e);
      setError(`Failed to process file: ${e.message || "Unknown error"}`);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: `Failed to process file: ${e.message || "Unknown error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (
      parsedChatData.length === 0 ||
      !selectedDateRange.from ||
      !selectedDateRange.to ||
      !chatDateRange.from ||
      !chatDateRange.to
    ) {
      setAnalyzedData(null);
 setTopWordsByUser([]);
      return;
    }

    setIsLoading(true);

    try {
      const overlapFrom = selectedDateRange.from > chatDateRange.from ? selectedDateRange.from : chatDateRange.from;
      const overlapTo = selectedDateRange.to < chatDateRange.to ? selectedDateRange.to : chatDateRange.to;

      if (overlapFrom > overlapTo) {
        setAnalyzedData(null);
        return;
      }

      const filteredMessages = parsedChatData.filter(
        (msg) => msg.timestamp >= overlapFrom && msg.timestamp <= overlapTo
      );

      setFilteredMessages(filteredMessages);
      setTopEmojisData(extractEmojis(filteredMessages));

      if (filteredMessages.length === 0) {
        setAnalyzedData(null);
 setTopWordsByUser([]);
        return;
      }

      const analysisResult = analyzeChatData(filteredMessages, { from: overlapFrom, to: overlapTo });
      setAnalyzedData(analysisResult);
 setTopWordsByUser(getTopWordsByUser(filteredMessages));
    } catch (e: any) {
      setError(`Failed to analyze data: ${e.message || "Unknown error"}`);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: `Failed to analyze data: ${e.message || "Unknown error"}`,
      });
      setAnalyzedData(null);
 setTopWordsByUser([]);
 } finally {
      setIsLoading(false);
    }
  }, [parsedChatData, selectedDateRange, chatDateRange, toast]);

  const handleDateRangeChange = (newRange: DateRange) => {
    setSelectedDateRange(newRange);
  };

  const hasDataToAnalyze = analyzedData !== null;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen flex flex-col">
        <header className="mb-8 text-center py-6">
          <div className="inline-flex items-center gap-3 bg-primary/20 border border-primary/50 px-6 py-3 rounded-lg shadow-sm">
            <Activity className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-primary-foreground">ChatterStats</h1>
              <p className="text-muted-foreground mt-1">Analyze your chat data with ease.</p>
            </div>
          </div>
        </header>

        {/* Upload Chat File */}
        <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Upload Chat File</CardTitle>
            <UploadCloud className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <FileUpload onFileProcessed={handleFileProcessed} disabled={isLoading} />
          </CardContent>
        </Card>

        {/* Date and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Date Range</CardTitle>
              <CalendarDays className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent className="p-0 flex flex-col items-stretch">
              <DateRangeSelector
                initialRange={selectedDateRange.from && selectedDateRange.to ? selectedDateRange : undefined}
                onRangeChange={handleDateRangeChange}
                disabled={isLoading}
                className="w-full"
                availableDateRange={chatDateRange}
                messages={parsedChatData}
              />
              {!parsedChatData.length && !isLoading && (
                <p className="text-sm text-muted-foreground mt-2 px-6 pb-6">
                  Upload a chat file to enable date selection.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Overall Statistics</CardTitle>
              <MessageSquare className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col">
                    <p className="text-3xl font-bold text-green-600">
                      {analyzedData ? analyzedData.totalMessages.toLocaleString() : '0'}
                    </p>
                    <p className="text-xs text-black">Total messages in selected range</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-3xl font-bold text-green-600">
                      {analyzedData && analyzedData.totalWords !== undefined ? analyzedData.totalWords.toLocaleString() : '0'}
                    </p>
                    <p className="text-xs text-black">Total words in selected range</p>
                  </div>
                </div>
                {chatDateRange.from && chatDateRange.to && (
                  <div className="text-right">
                    <p className="ext-sm font-medium text-muted-foreground">Timeline</p>
                    <p className="text-3xl font-bold text-green-600">
                      {chatDateRange.from.toLocaleDateString('en-GB')} - {chatDateRange.to.toLocaleDateString('en-GB')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Charts in correct order */}
        {hasDataToAnalyze ? (
          <div className="space-y-8">

            {/* 1. Message Distribution per User */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Message Distribution per User</CardTitle>
                <Users className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <MessageDistributionChart data={analyzedData.userMessageCounts} />
              </CardContent>
            </Card>

            {/* 2. Message Distribution by Day of Week */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Message Distribution by Day of Week</CardTitle>
                <BarChart3 className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <DailyDistributionChart data={analyzedData.dailyDistribution} />
              </CardContent>
            </Card>

            {/* 3. Hourly Message Distribution */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Hourly Message Distribution</CardTitle>
                <Clock className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <HourlyDistributionChart data={analyzedData.hourlyDistribution} />
              </CardContent>
            </Card>

            {/* Activity Heatmap */}
            <ActivityHeatmap data={analyzedData.activityHeatmapData} />

            {/* 4. Top Words Per User */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Top 15 Most Common Words by User</CardTitle>
 <MessageSquare className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                {topWordsByUser.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topWordsByUser.map((userData, index) => (
                      <div key={index}>
                        <h3 className="text-md font-bold mb-2">{userData.user}</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {userData.topWords.map((wordData: { word: string; count: number }, wordIndex: number) => (
                            <li key={wordIndex}>{wordData.word} ({wordData.count})</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
 No word data available for the selected date range.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 4. Top Emojis Per User */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Top Emojis Per User</CardTitle>
                <Laugh className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <UserEmojiChartsContainer messages={filteredMessages} />
              </CardContent>
            </Card>

            {analyzedData.userLongestMessages && analyzedData.userLongestMessages.length > 0 && (
              <UserLongestMessages userLongestMessages={analyzedData.userLongestMessages} />
            )}

            {analyzedData.userRandomMessages && analyzedData.userRandomMessages.length > 0 && (
              <UserRandomMessages userRandomMessages={analyzedData.userRandomMessages} />
            )}

          </div>
        ) : (
          parsedChatData.length > 0 && (
            <p className="text-center text-muted-foreground">
              No chat messages found in the selected date range.
            </p>
          )
        )}
      </div>
      <Toaster />
    </>
  );
}
