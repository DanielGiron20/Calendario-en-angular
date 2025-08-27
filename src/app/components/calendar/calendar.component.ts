import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

type DayCell = {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
  isToday: boolean;
};

type EventItem = {
  title: string;
  start: string; // 'YYYY-MM-DD'
  end: string;   // 'YYYY-MM-DD'
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

  showEventForm = signal<boolean>(false);
  newEvent: { title: string; start: string; end: string } = {
    title: '',
    start: '',
    end: '',
  };

  openDayModal() {
  if (this.selectedDate()) {
    this.showDayModal.set(true);
  }
}

closeDayModal() {
  this.showDayModal.set(false);
}

  ngOnInit(): void {
    this.buildCalendar();
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
      this.events.update((evts) => [...evts, { ...this.newEvent }]);
      this.showEventForm.set(false);
    }
  }

  getEventsForDay(dayIso: string): EventItem[] {
    return this.events().filter(
      (ev) => ev.start <= dayIso && ev.end >= dayIso
    );
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
