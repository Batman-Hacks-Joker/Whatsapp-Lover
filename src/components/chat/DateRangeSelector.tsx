'use client';

import * as React from 'react';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { DateRange } from '@/types/chat';

interface DateRangeSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  initialRange?: DateRange;
  onRangeChange: (range: DateRange) => void;
  disabled?: boolean;
  availableDateRange?: DateRange;
  messages?: { timestamp: Date }[]; // Mark as optional to be safe
}

export function DateRangeSelector({
  className,
  initialRange,
  onRangeChange,
  disabled,
  availableDateRange,
  messages = [], // Default empty array fallback
}: DateRangeSelectorProps) {
  const defaultStartDate = React.useMemo(() => {
    return messages?.[0]?.timestamp;
  }, [messages]);

  const defaultEndDate = React.useMemo(() => {
    const start = messages?.[0]?.timestamp;
    return start ? new Date(start.getTime() + 24 * 60 * 60 * 1000) : undefined;
  }, [messages]);

  const [selectedStartDate, setSelectedStartDate] = React.useState<Date | undefined>(
    initialRange?.from || defaultStartDate
  );
  const [selectedEndDate, setSelectedEndDate] = React.useState<Date | undefined>(
    initialRange?.to || defaultEndDate
  );

  const handleApplyChanges = React.useCallback(() => {
    if (selectedStartDate && selectedEndDate) {
      onRangeChange({ from: selectedStartDate, to: selectedEndDate });
    } else if (selectedStartDate || selectedEndDate) {
      const date = selectedStartDate || selectedEndDate;
      onRangeChange({ from: date!, to: date! });
    } else if (defaultStartDate || defaultEndDate) {
      const date = defaultStartDate || defaultEndDate!;
      onRangeChange({ from: date, to: date });
    }
  }, [selectedStartDate, selectedEndDate, defaultStartDate, defaultEndDate, onRangeChange]);

  const handleWholeTimeline = React.useCallback(() => {
    if (availableDateRange?.from && availableDateRange?.to) {
      setSelectedStartDate(availableDateRange.from);
      setSelectedEndDate(availableDateRange.to);
    }
  }, [availableDateRange]);

  return (
    <div className={cn('flex flex-col space-y-2 p-4', className)}>
      <div className="flex space-x-2">
        {/* Start Date */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex-1">
              <Button
                variant="outline"
                id="start-date"
                className={cn(
                  'justify-start text-left font-normal truncate w-full border border-black',
                  selectedStartDate
                    ? 'bg-green-500 text-white hover:bg-green-500/90'
                    : 'text-gray-600'
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedStartDate && isValid(selectedStartDate)
                  ? format(selectedStartDate, 'LLL dd, y')
                  : 'Start Date'}
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="single"
              selected={selectedStartDate}
              onSelect={setSelectedStartDate}
              disabled={(d) =>
                availableDateRange?.from && availableDateRange?.to
                  ? d < availableDateRange.from || d > availableDateRange.to
                  : false
              }
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>

        {/* End Date */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex-1">
              <Button
                variant="outline"
                id="end-date"
                className={cn(
                  'justify-start text-left font-normal truncate w-full border border-black',
                  selectedEndDate
                    ? 'bg-blue-500 text-white hover:bg-blue-500/90'
                    : 'text-gray-600'
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedEndDate && isValid(selectedEndDate)
                  ? format(selectedEndDate, 'LLL dd, y')
                  : 'End Date'}
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="single"
              selected={selectedEndDate}
              onSelect={setSelectedEndDate}
              disabled={(d) =>
                availableDateRange?.from && availableDateRange?.to
                  ? d < availableDateRange.from || d > availableDateRange.to
                  : false
              }
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Timeline and Default Buttons */}
      <div className="flex space-x-2 w-full">
        <Button
          className="flex-1 bg-yellow-500 text-yellow-900 hover:bg-yellow-500/90 border border-black"
          onClick={handleWholeTimeline}
          disabled={disabled || !availableDateRange?.from || !availableDateRange?.to}
        >
          Whole timeline
        </Button>
        <Button
          className="flex-1 bg-purple-600 text-white hover:bg-purple-600/90 border border-black"
          onClick={() => {
            if (defaultStartDate && defaultEndDate) {
              setSelectedStartDate(defaultStartDate);
              setSelectedEndDate(defaultEndDate);
            }
          }}
          disabled={!messages || messages.length === 0}
        >
          Default
        </Button>
      </div>

      {/* Apply Changes */}
      <Button
        className="w-full bg-pink-500 text-white hover:bg-pink-500/90 border border-black"
        onClick={handleApplyChanges}
        disabled={disabled || (!selectedStartDate && !selectedEndDate)}
      >
        Apply Changes
      </Button>
    </div>
  );
}
