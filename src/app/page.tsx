"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from '@/components/chat/FileUpload';
import { DateRangeSelector } from '@/components/chat/DateRangeSelector';
import { MessageDistributionChart } from '@/components/chat/MessageDistributionChart';
import { TemporalMessageVolumeChart } from '@/components/chat/TemporalMessageVolumeChart';
import { HourlyDistributionChart } from '@/components/chat/HourlyDistributionChart';
import { parseChatFile } from '@/lib/chat-parser';
import { analyzeChatData } from '@/lib/analysis';
import type { ChatMessage, AnalyzedData, DateRange } from '@/types/chat';
import { Activity, BarChart3, CalendarDays, Clock, MessageSquare, Users, UploadCloud } from 'lucide-react';

export default function ChatterStatsPage() {
  const [parsedChatData, setParsedChatData] = useState<ChatMessage[]>([]);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
  const [initialChatDateRange, setInitialChatDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileProcessed = async (content: string, fileName: string, fileType: 'txt' | 'csv') => {
    setIsLoading(true);
    setError(null);
    setAnalyzedData(null);
    setParsedChatData([]);
    setInitialChatDateRange({ from: undefined, to: undefined });
    setSelectedDateRange({ from: undefined, to: undefined });

    try {
      const messages = parseChatFile(content, fileType);
      if (messages.length === 0) {
        toast({
          variant: "destructive",
          title: "No Messages Found",
          description: "The file was processed, but no valid chat messages were found.",
        });
        setIsLoading(false);
        return;
      }
      setParsedChatData(messages);

      const timestamps = messages.map(msg => msg.timestamp.getTime());
      const minDate = new Date(Math.min(...timestamps));
      const maxDate = new Date(Math.max(...timestamps));
      
      const defaultRange = { from: minDate, to: maxDate };
      setInitialChatDateRange(defaultRange);
      setSelectedDateRange(defaultRange); // Set initial selected range to full range

      toast({
        title: "File Processed",
        description: `${messages.length} messages found in ${fileName}.`,
      });

    } catch (e: any) {
      console.error("Error processing file:", e);
      setError(`Failed to process file: ${e.message || 'Unknown error'}`);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: `Failed to process file: ${e.message || 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (parsedChatData.length > 0 && selectedDateRange.from && selectedDateRange.to) {
      setIsLoading(true);
      try {
        const analysisResult = analyzeChatData(parsedChatData, selectedDateRange);
        setAnalyzedData(analysisResult);
      } catch (e: any) {
        setError(`Failed to analyze data: ${e.message || 'Unknown error'}`);
        toast({
          variant: "destructive",
          title: "Analysis Error",
          description: `Failed to analyze data: ${e.message || 'Unknown error'}`,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // If no data or no valid range, clear analysis
      setAnalyzedData(null);
    }
  }, [parsedChatData, selectedDateRange, toast]);


  const handleDateRangeChange = (newRange: DateRange) => {
    setSelectedDateRange(newRange);
  };
  
  const hasDataToAnalyze = parsedChatData.length > 0;

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Upload Chat File</CardTitle>
              <UploadCloud className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <FileUpload onFileProcessed={handleFileProcessed} disabled={isLoading} />
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Date Range</CardTitle>
              <CalendarDays className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <DateRangeSelector
                initialRange={selectedDateRange.from && selectedDateRange.to ? selectedDateRange : undefined}
                onRangeChange={handleDateRangeChange}
                disabled={!hasDataToAnalyze || isLoading}
                availableDateRange={initialChatDateRange}
              />
              {!hasDataToAnalyze && !isLoading && (
                 <p className="text-sm text-muted-foreground mt-2">Upload a chat file to enable date selection.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 shadow-md">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !analyzedData && (
          <div className="space-y-8">
            <Card className="shadow-md">
              <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
          </div>
        )}

        {!isLoading && !analyzedData && hasDataToAnalyze && selectedDateRange.from && selectedDateRange.to && (
           <Card className="text-center p-8 shadow-md">
            <CardTitle className="text-xl mb-2">No Data for Selected Range</CardTitle>
            <CardDescription>There are no messages within the currently selected date range. Try adjusting the dates or uploading a different file.</CardDescription>
          </Card>
        )}
        
        {!isLoading && !hasDataToAnalyze && !error && (
          <Card className="text-center p-8 shadow-md">
            <CardTitle className="text-xl mb-2">Welcome to ChatterStats!</CardTitle>
            <CardDescription>Upload your chat file to begin your analysis. See message counts, user activity, and more.</CardDescription>
          </Card>
        )}


        {analyzedData && !isLoading && (
          <div className="space-y-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Overall Statistics</CardTitle>
                <MessageSquare className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{analyzedData.totalMessages.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total messages in selected range</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Message Distribution per User</CardTitle>
                <Users className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <MessageDistributionChart data={analyzedData.userMessageCounts} />
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Message Volume Over Time</CardTitle>
                 <BarChart3 className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">Daily message counts per user.</CardDescription>
                <TemporalMessageVolumeChart data={analyzedData.temporalVolume.daily} users={analyzedData.allUsers} />
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Hourly Message Distribution</CardTitle>
                <Clock className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <HourlyDistributionChart data={analyzedData.hourlyDistribution} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Toaster />
    </>
  );
}
