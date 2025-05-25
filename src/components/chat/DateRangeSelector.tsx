"use client";

import * as React from 'react';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange as ReactDateRange } from 'react-day-picker';

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
  messages: { timestamp: Date }[];
}

export function DateRangeSelector({
  className,
  initialRange,
  onRangeChange,
  disabled,
  availableDateRange,
  messages,
}: DateRangeSelectorProps) {
  const defaultStartDate = React.useMemo(() => {
    if (!messages || messages.length === 0) {
 return undefined;
    }
 return messages[0].timestamp;
  }, [messages]);

  const defaultEndDate = React.useMemo(() => {
    if (!messages || messages.length === 0) {
      return undefined;
    }
    return new Date(messages[0].timestamp.getTime() + 24 * 60 * 60 * 1000);
  }, [messages]);

  const [selectedStartDate, setSelectedStartDate] = React.useState<Date | undefined>(initialRange?.from || defaultStartDate);
  const [selectedEndDate, setSelectedEndDate] = React.useState<Date | undefined>(initialRange?.to || defaultEndDate);

  const handleApplyChanges = React.useCallback(() => {
    if (selectedStartDate && selectedEndDate) {
      onRangeChange({ from: selectedStartDate, to: selectedEndDate });
    } else if (selectedStartDate) {
      onRangeChange({ from: selectedStartDate, to: selectedStartDate });
    } else if (selectedEndDate) {
      onRangeChange({ from: selectedEndDate, to: selectedEndDate });
    } else if (defaultStartDate && defaultEndDate) {
      onRangeChange({ from: defaultStartDate, to: defaultEndDate });
    } else if (defaultStartDate) {
      onRangeChange({ from: defaultStartDate, to: defaultStartDate });
    }
  }, [selectedStartDate, selectedEndDate, defaultStartDate, defaultEndDate, onRangeChange]);

  return (
    <div className={cn('flex flex-col items-start space-y-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="start-date"
            variant={'outline'}
            className={cn(
              'w-[130px] justify-start text-left font-normal',
              !selectedStartDate && 'text-muted-foreground'
              , 'truncate'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedStartDate ? (
 isValid(selectedStartDate)
 ? format(selectedStartDate, 'LLL dd, y')
 : 'Invalid Date'
            ) : (
              <span>Start Date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
 mode="single"
 selected={selectedStartDate}
 onSelect={setSelectedStartDate}
            disabled={(d) => {
              if (!availableDateRange?.from || !availableDateRange?.to) return false;
              return d < availableDateRange.from || d > availableDateRange.to;
            }}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="end-date"
            variant={'outline'}
            className={cn(
              'w-[130px] justify-start text-left font-normal',
              !selectedEndDate && 'text-muted-foreground'
              , 'truncate'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedEndDate ? (
 isValid(selectedEndDate)
 ? format(selectedEndDate, 'LLL dd, y')
 : 'Invalid Date'
            ) : (
              <span>End Date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
 mode="single"
 selected={selectedEndDate}
 onSelect={setSelectedEndDate}
            disabled={(d) => {
              if (!availableDateRange?.from || !availableDateRange?.to) return false;
              return d < availableDateRange.from || d > availableDateRange.to;
            }}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
      <Button
        onClick={handleApplyChanges}
 disabled={disabled || (!selectedStartDate && !selectedEndDate)}
      >
        Apply Changes
      </Button>
    </div>
  );
}
