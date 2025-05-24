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
  availableDateRange?: DateRange; // Min and max dates available from chat data
}

export function DateRangeSelector({
  className,
  initialRange,
  onRangeChange,
  disabled,
  availableDateRange,
}: DateRangeSelectorProps) {
  const [date, setDate] = React.useState<ReactDateRange | undefined>(() => {
    if (initialRange?.from && initialRange?.to) {
      return { from: initialRange.from, to: initialRange.to };
    }
    return undefined;
  });

  React.useEffect(() => {
    if (initialRange?.from && initialRange?.to) {
      setDate({ from: initialRange.from, to: initialRange.to });
    } else {
      setDate(undefined);
    }
  }, [initialRange]);
  
  const handleSelect = (selectedDateRange: ReactDateRange | undefined) => {
    setDate(selectedDateRange);
    if (selectedDateRange?.from && selectedDateRange?.to) {
      onRangeChange({ from: selectedDateRange.from, to: selectedDateRange.to });
    } else if (selectedDateRange?.from && !selectedDateRange?.to) {
       // If only 'from' is selected, set 'to' to be the same as 'from'
      onRangeChange({ from: selectedDateRange.from, to: selectedDateRange.from });
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={(d) => {
              if (!availableDateRange?.from || !availableDateRange?.to) return false;
              return d < availableDateRange.from || d > availableDateRange.to;
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
