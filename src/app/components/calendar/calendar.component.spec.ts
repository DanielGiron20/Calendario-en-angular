import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';

type DayCell = {
  date: Date;
  iso: string;          // 'YYYY-MM-DD'
  inCurrentMonth: boolean;
  isToday: boolean;
};

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './calendar.component.html',
})
export class CalendarComponent implements OnInit {
  private today = new Date();
  year = signal<number>(this.today.getFullYear());
  month = signal<number>(this.today.getMonth()); // 0-11

  weeks = signal<DayCell[][]>([]); // 6 filas x 7 días máx.

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
    this.buildCalendar();
  }

  monthLabel(): string {
    const dtf = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
    return dtf.format(new Date(this.year(), this.month(), 1));
  }

  private buildCalendar() {
    const y = this.year();
    const m = this.month();

    const firstOfMonth = new Date(y, m, 1);
    const firstWeekday = firstOfMonth.getDay(); // 0=Dom ... 6=Sáb
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();

    const leading = firstWeekday; // días del mes anterior para completar la primera semana
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

    // Días previos (del mes anterior)
    for (let i = leading - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      cells.push(makeCell(new Date(y, m - 1, day), false));
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(makeCell(new Date(y, m, d), true));
    }

    // Días posteriores (del mes siguiente)
    for (let d = 1; d <= trailing; d++) {
      cells.push(makeCell(new Date(y, m + 1, d), false));
    }

    // Partir en semanas
    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    this.weeks.set(weeks);
  }
}
