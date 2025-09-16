import { Component, OnInit, signal, computed } from '@angular/core';
import { NgFor, NgClass, NgIf, NgSwitch, NgSwitchCase, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YearViewComponent } from '../../calendar/year-view/year-view.component';
import { WeekViewComponent } from '../../calendar/week-view/week-view.component';
import { DayViewComponent } from '../../calendar/day-view/day-view.component';


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
  color?: string;
  hstart: string; // 'HH:mm'
  hend: string;   // 'HH:mm'
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
  imports: [NgFor, NgClass, NgIf, NgStyle, NgSwitch,FormsModule, NgSwitchCase,YearViewComponent, WeekViewComponent, DayViewComponent],
  templateUrl: './calendar.component.html',
})
export class CalendarComponent implements OnInit {
  private today = new Date();
  isMobile = signal(false);
  year = signal<number>(this.today.getFullYear());
  month = signal<number>(this.today.getMonth());
  weeks = signal<DayCell[][]>([]);
  selectedDate = signal<string | null>(null);
  dayPickerDate: string | null = null;

  showDayModal = signal<boolean>(false);
  eventFormError = signal<string | null>(null);
  events = signal<EventItem[]>([]);
  showEventForm = signal<boolean>(false);
  currentYear = new Date().getFullYear();
  view: 'month' | 'week' | 'year' | 'day' = 'month';
  
  newEvent: {
    color: string; title: string; start: string; end: string; hstart: string; hend: string
} = {
  title: '', start: '', end: '',
  color: '', hstart: '', hend: ''
};
  random = Math.random();
  
direction: 'next' | 'prev' | null = null;
animating = false;
  ngOnInit(): void {
    this.buildCalendar();
    this.checkScreen();
    window.addEventListener('resize', () => this.checkScreen());
    this.selectedDate.set(this.today.toISOString().slice(0, 10));
  }

  onWeekDaySelected(iso: string) {
  this.selectedDate.set(iso);
  this.showDayModal.set(true); // esto hace que se abra el modal al hacer clic en un día
}


  currentView: 'month' | 'year' = 'month';

  get currentWeek(): DayCell[] {
  const sel = this.selectedDate();
  if (!sel) return this.weeks()[0] || [];

  return this.weeks().find(week => 
    week.some(day => day.iso === sel)
  ) || [];
}



prevYear() {
  this.year.set(this.year() - 1);
  this.direction = 'prev';
  this.animating = true;
}

nextYear() {
  this.year.set(this.year() + 1);
   this.direction = 'next';
  this.animating = true;
}



prevWeek() {
  if (!this.selectedDate()) return;
  const d = new Date(this.selectedDate()!);
  d.setDate(d.getDate() - 7);
  this.selectedDate.set(d.toISOString().slice(0,10));
   this.direction = 'prev';
  this.animating = true;
}

nextWeek() {
  if (!this.selectedDate()) return;
  const d = new Date(this.selectedDate()!);
  d.setDate(d.getDate() + 7);
  this.selectedDate.set(d.toISOString().slice(0,10));
   this.direction = 'next';
  this.animating = true;
}


goToDay() {
  if (this.dayPickerDate) {
    this.selectedDate.set(this.dayPickerDate); // selecciona el día
    this.view = 'day'; // asegura que esté en la vista diaria
  }
}



  checkScreen() {
    this.isMobile.set(window.innerWidth < 640); // <640px = sm en Tailwind
  }

private touchStartX = 0;
private touchEndX = 0;

onTouchStart(event: TouchEvent) {
  this.touchStartX = event.changedTouches[0].screenX;
}

onTouchEnd(event: TouchEvent) {
  this.touchEndX = event.changedTouches[0].screenX;
  this.handleSwipe();
}

handleSwipe() {
  const diffX = this.touchEndX - this.touchStartX;

  if (Math.abs(diffX) < 50) return; // ignorar swipecorto

  if (diffX < 0) {
   
    if (this.view === 'month') this.nextMonth();
    else if (this.view === 'week') this.nextWeek();
    else if (this.view === 'year') this.nextYear();
  } else {
   
    if (this.view === 'month') this.prevMonth();
    else if (this.view === 'week') this.prevWeek();
    else if (this.view === 'year') this.prevYear();
  }
}




  get selectedYear(): number {
  return this.year();
}



//   get selectedYear(): number {
//   const dateStr = this.selectedDate();
//   return dateStr ? new Date(dateStr).getFullYear() : this.currentYear;
// }

  getVisibleEvents(events: EventItem[]) {
    const limit = this.isMobile() ? 2 : 3; // 2 en móvil, 3 en desktop
    return events.slice(0, limit);
  }

  getExtraEvents(events: EventItem[]) {
    const limit = this.isMobile() ? 2 : 3;
    return events.length > limit ? events.slice(limit) : [];
  }

  openEventForm() {
    const selected = this.selectedDate();
    this.newEvent = {
      title: '',
      start: selected ?? this.today.toISOString().slice(0, 10),
      end: selected ?? this.today.toISOString().slice(0, 10),
      color: '',
      hstart: '',
      hend: ''
    };
    this.showEventForm.set(true);
  }

  get eventsForSelectedDate(): EventItem[] {
  const sel = this.selectedDate();
  if (!sel) return [];
  return this.events().filter(ev => ev.start.slice(0, 10) <= sel && ev.end.slice(0, 10) >= sel);
}



switchToMonth(monthIndex: number) {
  this.month.set(monthIndex);
  this.view = 'month';
  this.buildCalendar(); // para que reconstruya la grilla de ese mes
}
  saveEvent() {
  // Validación 1 titulo
  if (!this.newEvent.title.trim()) {
    this.eventFormError.set('the tittle cannot be empty.');
    return;
  }

  // Validación 2 fechas
  if (this.newEvent.end < this.newEvent.start) {
    this.eventFormError.set('The end date cannot be less than the start date.');
    return;
  }
  //validacion 3 horas
  if (this.newEvent.hstart === this.newEvent.hend ||
      this.newEvent.hend < this.newEvent.hstart) {
    this.eventFormError.set('The end time cannot be earlier than the start time.');
    return;
  }

  const newEventWithId: EventItem = { 
    id: Math.random().toString(36).substr(2, 9),
    title: this.newEvent.title,
    start: this.newEvent.start,
    end: this.newEvent.end,
    color: this.newEvent.color || 'bg-blue-600',
    hstart: this.newEvent.hstart,
    hend: this.newEvent.hend
  };

  this.events.update(evts => [...evts, newEventWithId]);
  this.showEventForm.set(false);
  this.eventFormError.set(null); // limpiar
}


  selectDay(day: DayCell) {
    this.selectedDate.set(day.iso);
  }

  openDayModal() {
    if (this.selectedDate()) this.showDayModal.set(true);
  }

  closeDayModal() {
    this.showDayModal.set(false);
  }
  deleteEvent(eventId: string) {
  this.events.update(evts => evts.filter(e => e.id !== eventId));
}



  prevMonth() {
    const m = this.month() - 1;
    if (m < 0) { this.month.set(11); this.year.set(this.year() - 1); }
    else this.month.set(m);
    this.buildCalendar();
     this.direction = 'prev';
  this.animating = true;
  }

  nextMonth() {
    const m = this.month() + 1;
    if (m > 11) { this.month.set(0); this.year.set(this.year() + 1); }
    else this.month.set(m);
    this.buildCalendar();
     this.direction = 'next';
  this.animating = true;
  }

  goToday() {
    this.view = 'month';
    this.year.set(this.today.getFullYear());
    this.month.set(this.today.getMonth());
    this.selectedDate.set(this.today.toISOString().slice(0, 10));
    this.buildCalendar();
  }

  monthLabel(): string {
    const dtf = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });
    return dtf.format(new Date(this.year(), this.month(), 1));
  }

  
  getSingleDayEvents(dayIso: string): EventItem[] {
    return this.events().filter(ev => ev.start === dayIso && ev.end === dayIso);
  }

  /** Todos los eventos del día (single o dentro de multi-día) */
  getEventsForDay(dayIso: string): EventItem[] {
    return this.events().filter(ev => ev.start <= dayIso && ev.end >= dayIso);
  }

  eventSpans = computed<EventSpan[]>(() => {
  const spans: EventSpan[] = [];
  const weeks = this.weeks();
  const events = this.events();

  if (weeks.length === 0) return spans;

  // --- Definir límite dinámico según tamaño de pantalla ---
  const isMobile = window.innerWidth < 640; // sm breakpoint en Tailwind
  const maxVisibleEvents = isMobile ? 2 : 3;

  // --- LÓGICA ORIGINAL (NO TOCAR) ---
  const sortedEvents = [...events].sort((a, b) => {
    const diff = a.start.localeCompare(b.start);
    if (diff !== 0) return diff;
    return (new Date(a.end).getTime() - new Date(a.start).getTime()) -
           (new Date(b.end).getTime() - new Date(a.start).getTime());
  });

  const dayRowCount: Record<string, number> = {};

  sortedEvents.forEach(ev => {
    const startDate = new Date(ev.start);
    const endDate = new Date(ev.end);

    weeks.forEach((week, weekIndex) => {
      const weekStart = new Date(week[0].iso);
      const weekEnd = new Date(week[6].iso);

      if (endDate < weekStart || startDate > weekEnd) return;

      const segStart = startDate > weekStart ? startDate : weekStart;
      const segEnd = endDate < weekEnd ? endDate : weekEnd;

      const colStart = week.findIndex(d => d.iso === segStart.toISOString().slice(0, 10));
      const colEnd = week.findIndex(d => d.iso === segEnd.toISOString().slice(0, 10));
      if (colStart === -1 || colEnd === -1) return;

      const keyPrefix = `${weekIndex}-`;
      let col = colStart;
      while (col <= colEnd) {
        let segmentStart = col;
        let rowForSegment = 0;

        // buscar primer row libre en esta columna
        while (dayRowCount[`${keyPrefix}${col}-${rowForSegment}`]) rowForSegment++;

        // extender segmento mientras haya espacio consecutivo
        while (col <= colEnd && !dayRowCount[`${keyPrefix}${col}-${rowForSegment}`]) {
          dayRowCount[`${keyPrefix}${col}-${rowForSegment}`] = 1;
          col++;
        }

        if (rowForSegment < maxVisibleEvents) {
          spans.push({
            event: ev,
            weekIndex,
            row: rowForSegment,
            colStart: segmentStart,
            colEnd: col - 1
          });
        }
      }
    });
  });

  const dayEventCount: Record<string, number> = {};
  weeks.forEach(week => {
    week.forEach(day => {
      dayEventCount[day.iso] = this.getEventsForDay(day.iso).length;
    });
  });

  // Botón "+ View more"
  weeks.forEach((week, weekIndex) => {
    week.forEach((day, colIndex) => {
      const eventCount = dayEventCount[day.iso] || 0;
      
      if (eventCount > maxVisibleEvents) {
        const alreadyHasMore = spans.some(span => 
          span.event.title.startsWith('+ View more') && 
          span.weekIndex === weekIndex && 
          span.colStart === colIndex
        );

        if (!alreadyHasMore) {
          const moreEvent: EventItem = {
            id: 'more-' + day.iso,
            title: `+ View more (${eventCount - maxVisibleEvents})`,
            start: day.iso,
            end: day.iso,
            hstart: '',
            hend: ''
          };
          
          spans.push({ 
            event: moreEvent, 
            weekIndex, 
            row: maxVisibleEvents, 
            colStart: colIndex, 
            colEnd: colIndex 
          });
        }
      }
    });
  });

  return spans;
});



openDayModalFromMore(span: EventSpan) {
  const date = span.event.id.replace('more-', '');
  this.selectedDate.set(date);
  this.showDayModal.set(true);
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
    const makeCell = (d: Date, inCurrent: boolean) => ({
      date: d,
      iso: d.toISOString().slice(0, 10),
      inCurrentMonth: inCurrent,
      isToday: d.toISOString().slice(0, 10) === this.today.toISOString().slice(0, 10)
    });

    for (let i = leading - 1; i >= 0; i--) cells.push(makeCell(new Date(y, m - 1, prevMonthDays - i), false));
    for (let d = 1; d <= daysInMonth; d++) cells.push(makeCell(new Date(y, m, d), true));
    for (let d = 1; d <= trailing; d++) cells.push(makeCell(new Date(y, m + 1, d), false));

    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    this.weeks.set(weeks);
  }
}
