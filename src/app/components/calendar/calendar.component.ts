import { Component, OnInit, signal, computed } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

type DayCell = {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
  isToday: boolean;
};

type EventItem = {
  id: string;
  title: string;
  start: string; // 'YYYY-MM-DD'
  end: string;   // 'YYYY-MM-DD'
};

type EventSpan = {
  event: EventItem;
  weekIndex: number;
  row: number;
  colStart: number;
  colEnd: number;
};



@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [NgFor, NgClass, NgIf, FormsModule],
  templateUrl: './calendar.component.html',
})
export class CalendarComponent implements OnInit {
  private today = new Date();
  year = signal<number>(this.today.getFullYear());
  month = signal<number>(this.today.getMonth());
  weeks = signal<DayCell[][]>([]);
  selectedDate = signal<string | null>(null);
  showDayModal = signal<boolean>(false);

  events = signal<EventItem[]>([]);

  // calcular spans multi-día
  eventSpans = computed<EventSpan[]>(() => {
    const spans: EventSpan[] = [];
    const weeks = this.weeks();
    const events = this.events();

    if (weeks.length === 0) return spans;

    events.forEach((event) => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);

      // ignorar eventos de un solo día
      if (event.start === event.end) return;

      weeks.forEach((week, weekIndex) => {
        const weekStart = new Date(week[0].iso);
        const weekEnd = new Date(week[6].iso);

        if (endDate < weekStart || startDate > weekEnd) return;

        const segStart = startDate > weekStart ? startDate : weekStart;
        const segEnd = endDate < weekEnd ? endDate : weekEnd;

        const colStart = week.findIndex(d => d.iso === segStart.toISOString().slice(0, 10));
        const colEnd = week.findIndex(d => d.iso === segEnd.toISOString().slice(0, 10));

        if (colStart === -1 || colEnd === -1) return;

        // asignar fila libre dentro de la semana
        let row = 0;
        while (spans.some(s =>
          s.weekIndex === weekIndex &&
          s.row === row &&
          !(s.colEnd < colStart || s.colStart > colEnd)
        )) {
          row++;
        }

        spans.push({
          event,
          weekIndex,
          row,
          colStart,
          colEnd
        });
      });
    });

    return spans;
  });


  
  showEventForm = signal<boolean>(false);
  newEvent: { title: string; start: string; end: string } = {
    title: '',
    start: '',
    end: '',
  };

  ngOnInit(): void {
    this.buildCalendar();
  }

  openEventForm() {
    const selected = this.selectedDate();
    this.newEvent = {
      title: '',
      start: selected ?? this.today.toISOString().slice(0, 10),
      end: selected ?? this.today.toISOString().slice(0, 10),
    };
    this.showEventForm.set(true);
  }

  saveEvent() {
    if (this.newEvent.title && this.newEvent.start && this.newEvent.end) {
      const newEventWithId = {
        ...this.newEvent,
        id: Math.random().toString(36).substr(2, 9)
      };
      this.events.update((evts) => [...evts, newEventWithId]);
      this.showEventForm.set(false);
    }
  }

  getEventsForDay(dayIso: string): EventItem[] {
    return this.events().filter(
      (ev) => ev.start <= dayIso && ev.end >= dayIso
    );
  }

  openDayModal() {
    if (this.selectedDate()) {
      this.showDayModal.set(true);
    }
  }

  closeDayModal() {
    this.showDayModal.set(false);
  }

  prevMonth() {
    const m = this.month() - 1;
    if (m < 0) {
      this.month.set(11);
      this.year.set(this.year() - 1);
    } else {
      this.month.set(m);
    }
    this.buildCalendar();
  }

  nextMonth() {
    const m = this.month() + 1;
    if (m > 11) {
      this.month.set(0);
      this.year.set(this.year() + 1);
    } else {
      this.month.set(m);
    }
    this.buildCalendar();
  }

  goToday() {
    this.year.set(this.today.getFullYear());
    this.month.set(this.today.getMonth());
    this.selectedDate.set(this.today.toISOString().slice(0, 10));
    this.buildCalendar();
  }

  selectDay(day: DayCell) {
    this.selectedDate.set(day.iso);
  }

  monthLabel(): string {
    const dtf = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
    return dtf.format(new Date(this.year(), this.month(), 1));
  }

  private buildCalendar() {
    const y = this.year();
    const m = this.month();

    const firstOfMonth = new Date(y, m, 1);
    const firstWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();

    const leading = firstWeekday;
    const total = leading + daysInMonth;
    const trailing = (7 - (total % 7)) % 7;

    const cells: DayCell[] = [];
    const makeCell = (d: Date, inCurrent: boolean): DayCell => {
      const iso = d.toISOString().slice(0, 10);
      const todayIso = this.today.toISOString().slice(0, 10);
      return {
        date: d,
        iso,
        inCurrentMonth: inCurrent,
        isToday: iso === todayIso,
      };
    };

    for (let i = leading - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      cells.push(makeCell(new Date(y, m - 1, day), false));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(makeCell(new Date(y, m, d), true));
    }

    for (let d = 1; d <= trailing; d++) {
      cells.push(makeCell(new Date(y, m + 1, d), false));
    }

    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    this.weeks.set(weeks);
  }
}