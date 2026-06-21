import { useCallback, useState } from 'react';
import { startOfDay } from 'date-fns';

/** Abre CalendarDatePickerPopover y navega vía evento `navigate` (mismo contrato que RutinaNavigation). */
export function useAgendaCalendarDatePicker() {
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const pickerOpen = Boolean(pickerAnchor);

  const openPicker = useCallback((event) => {
    setPickerAnchor(event.currentTarget);
  }, []);

  const closePicker = useCallback(() => {
    setPickerAnchor(null);
  }, []);

  const handleDatePicked = useCallback((picked) => {
    if (!picked) return;
    setPickerAnchor(null);
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: { direction: 'pick', date: startOfDay(picked).toISOString() },
    }));
  }, []);

  return { pickerAnchor, pickerOpen, openPicker, closePicker, handleDatePicked };
}
