import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import 'react-day-picker/style.css';

export function Calendar({ selected, onSelect, disabled, className, ...props }) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      showOutsideDays
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium',
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-slate-500 rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
          '[&:has([aria-selected])]:bg-slate-100'
        ),
        day: cn(
          'inline-flex items-center justify-center rounded-md text-sm font-normal',
          'h-9 w-9 p-0 hover:bg-slate-100 hover:text-slate-900'
        ),
        day_selected: 'bg-slate-900 text-slate-50 hover:bg-slate-900 hover:text-slate-50 focus:bg-slate-900 focus:text-slate-50',
        day_today: 'bg-slate-100 text-slate-900',
        day_outside: 'text-slate-400 opacity-50',
        day_disabled: 'text-slate-400 opacity-50 cursor-not-allowed',
        day_range_middle: 'aria-selected:bg-slate-100 aria-selected:text-slate-900',
        day_hidden: 'invisible',
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
