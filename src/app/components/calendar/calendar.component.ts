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

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d); // mes en JS es 0-based
}

function sameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear()
      && d1.getMonth() === d2.getMonth()
      && d1.getDate() === d2.getDate();
}

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
  
   
  selectedEvent = signal<EventItem | null>(null);
  showEventModal = signal(false);

  newEvent: {
    color: string; title: string; start: string; end: string; hstart: string; hend: string
} = {
  title: '', start: '', end: '',
  color: '', hstart: '', hend: ''
};
  random = Math.random();
  
direction: 'next' | 'prev' | null = null;
animating = false;

getDayLabel(): string {
  const sel = this.selectedDate();
  if (!sel) return ''; // si no hay fecha seleccionada
  const date = parseLocalDate(sel);

  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return formatter.format(date);
}

formatEventDate(dateStr: string | undefined, timeStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T' + (timeStr || '00:00'));
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleString('en-US', options);
}




  ngOnInit(): void {
    this.buildCalendar();
    this.checkScreen();
    window.addEventListener('resize', () => this.checkScreen());
    this.selectedDate.set(formatLocalDate(this.today));
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

  // Actualiza mes y año si cruzamos de mes
  this.month.set(d.getMonth());
  this.year.set(d.getFullYear());

  // Reconstruye la grilla de semanas del mes correspondiente
  this.buildCalendar();

  this.selectedDate.set(formatLocalDate(d));
  this.direction = 'prev';
  this.animating = true;
}

nextWeek() {
  if (!this.selectedDate()) return;
  const d = new Date(this.selectedDate()!);
  d.setDate(d.getDate() + 7);

  // Actualiza mes y año si cruzamos de mes
  this.month.set(d.getMonth());
  this.year.set(d.getFullYear());

  // Reconstruye la grilla de semanas del mes correspondiente
  this.buildCalendar();

  this.selectedDate.set(formatLocalDate(d));
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
    else if (this.view === 'day') this.nextDay();
  } else {
   
    if (this.view === 'month') this.prevMonth();
    else if (this.view === 'week') this.prevWeek();
    else if (this.view === 'year') this.prevYear();
    else if (this.view === 'day') this.prevDay();
  }
}

 openEventModal(event: EventItem) {
  this.selectedEvent.set(event);
  this.showEventModal.set(true);
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
      start: selected ?? formatLocalDate(this.today),
      end: selected ?? formatLocalDate(this.today),
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
  if (this.newEvent.start === this.newEvent.end && this.newEvent.hend < this.newEvent.hstart) {
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

get currentWeekIndex(): number {
  const sel = this.selectedDate();
  if (!sel) return -1;
  return this.weeks().findIndex(week => week.some(day => day.iso === sel));
}



  prevMonth() {
    const m = this.month() - 1;
    if (m < 0) { this.month.set(11); this.year.set(this.year() - 1); }
    else this.month.set(m);
    this.buildCalendar();
     this.direction = 'prev';
  this.animating = true;
  const firstDay = new Date(this.year(), this.month(), 1);
  this.selectedDate.set(formatLocalDate(firstDay));
  }

  nextMonth() {
    const m = this.month() + 1;
    if (m > 11) { this.month.set(0); this.year.set(this.year() + 1); }
    else this.month.set(m);
    this.buildCalendar();
     this.direction = 'next';
  this.animating = true;
  const firstDay = new Date(this.year(), this.month(), 1);
  this.selectedDate.set(formatLocalDate(firstDay));
  }

  goToday() {
    this.view = 'month';
    this.year.set(this.today.getFullYear());
    this.month.set(this.today.getMonth());
    this.selectedDate.set(formatLocalDate(this.today));
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
    return this.events().filter(ev => ev.start <= dayIso && ev.end >= dayIso)
    .sort((a, b) => a.start.localeCompare(b.start));
  }

  
onDaySelectedFromYear(dayIso: string) {
  this.selectedDate.set(dayIso);
  this.view ='day'; // cambia directamente a vista diaria
}

onMonthSelectedFromYear(monthIndex: number) {
  const firstDayIso = `${this.currentYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  this.selectedDate.set(firstDayIso);
  this.view ='month'; // cambia a vista mensual
}


prevDay() {
  const sel = this.selectedDate();
  if (!sel) return;

  const d = parseLocalDate(sel); // convierte a Date
  d.setDate(d.getDate() - 1);    // retrocede un día
  this.selectedDate.set(formatLocalDate(d));

  this.direction = 'prev';
  this.animating = true;
}

nextDay() {
  const sel = this.selectedDate();
  if (!sel) return;

  const d = parseLocalDate(sel); // convierte a Date
  d.setDate(d.getDate() + 1);    // avanza un día
  this.selectedDate.set(formatLocalDate(d));

  this.direction = 'next';
  this.animating = true;
}

// dentro de la clase CalendarComponent
openDayModalFromCell(day: DayCell) {
  // seleccionar el día
  this.selectedDate.set(day.iso);
  // abrir el modal
  this.showDayModal.set(true);
}





eventSpans = computed<EventSpan[]>(() => {
  const spans: EventSpan[] = [];
  const weeks = this.weeks();
  const events = this.events();

  if (weeks.length === 0) return spans;

  const isMobile = window.innerWidth < 640;
  let maxVisibleEvents = isMobile ? 2 : 3;
  if(this.view === 'week'){
    maxVisibleEvents = 8;
  }


  
  
  
  const occ: boolean[][][] = weeks.map(week => week.map(() => new Array(maxVisibleEvents).fill(false)));

  // registro de colocaciones por evento/semana/col: key = `${eventId}-${weekIndex}-${col}`
  const placed = new Set<string>();

  // ordenar eventos (mantener tu criterio original)
  const sortedEvents = [...events].sort((a, b) => {
    const diff = a.start.localeCompare(b.start);
    if (diff !== 0) return diff;
  
    return (new Date(a.end).getTime() - new Date(a.start).getTime()) -
           (new Date(b.end).getTime() - new Date(b.start).getTime());
  });

  // 1) intentar segmentos contiguos (solo marcar filas < maxVisibleEvents)
  for (const ev of sortedEvents) {

    const startDate = parseLocalDate(ev.start);
    const endDate = parseLocalDate(ev.end);

    weeks.forEach((week, weekIndex) => {
      const weekStart = parseLocalDate(week[0].iso);
      const weekEnd = parseLocalDate(week[6].iso);

      if (endDate < weekStart || startDate > weekEnd) return;

      const segStart = startDate > weekStart ? startDate : weekStart;
      const segEnd = endDate < weekEnd ? endDate : weekEnd;

      const colStart = week.findIndex(d => sameDay(d.date, segStart));
      const colEnd = week.findIndex(d => sameDay(d.date, segEnd));
      if (colStart === -1 || colEnd === -1) return;

      let col = colStart;
      while (col <= colEnd) {
        let placedThisIteration = false;

        // buscar una fila disponible (0..maxVisibleEvents-1) 
        for (let row = 0; row < maxVisibleEvents; row++) {
          // calcular hasta qué columna puedo extender en esta fila
          let endCol = col;
          while (endCol <= colEnd && !occ[weekIndex][endCol][row]) endCol++;
          endCol--; // endCol es última columna libre en esta fila

          if (endCol >= col) {
           
            for (let c = col; c <= endCol; c++) {
              occ[weekIndex][c][row] = true;
              placed.add(`${ev.id}-${weekIndex}-${c}`);
            }

            spans.push({
              event: ev,
              weekIndex,
              row,
              colStart: col,
              colEnd: endCol
            });

            col = endCol + 1; 
            placedThisIteration = true;
            break;
          }
        }

        if (!placedThisIteration) {
          // no hay fila contigua disponible empezando en 'col' --> avanzar un día
          col++;
        }
      }
    });
  }

  // 2) intentar colocar por día (single-day) donde el evento aún no fue colocado
  for (const ev of sortedEvents) {
    const startDate = parseLocalDate(ev.start);
  const endDate = parseLocalDate(ev.end);

    weeks.forEach((week, weekIndex) => {
      const weekStart = parseLocalDate(week[0].iso);
    const weekEnd = parseLocalDate(week[6].iso);

      if (endDate < weekStart || startDate > weekEnd) return;

      const segStart = startDate > weekStart ? startDate : weekStart;
      const segEnd = endDate < weekEnd ? endDate : weekEnd;

    const colStart = week.findIndex(d => sameDay(d.date, segStart));
    const colEnd = week.findIndex(d => sameDay(d.date, segEnd));
      if (colStart === -1 || colEnd === -1) return;

      for (let c = colStart; c <= colEnd; c++) {
        const placedKey = `${ev.id}-${weekIndex}-${c}`;
        if (placed.has(placedKey)) continue; // ya colocado (por un segmento)

        // contar cuántos spans ya hay en ese día
//const spansInDay = spans.filter(s => s.weekIndex === weekIndex && s.colStart === c && s.colEnd === c);
//if (spansInDay.length >= maxVisibleEvents) continue; // ya se llenó este día


        // intentar encontrar una fila libre en esa columna
        let freeRow = -1;
        for (let r = 0; r < maxVisibleEvents; r++) {
          if (!occ[weekIndex][c][r]) {
            freeRow = r;
            break;
          }
        }

        if (freeRow !== -1) {
          occ[weekIndex][c][freeRow] = true;
          placed.add(placedKey);
          spans.push({
            event: ev,
            weekIndex,
            row: freeRow,
            colStart: c,
            colEnd: c
          });
        }
      }
    });
  }

  
  const dayEventCount: Record<string, number> = {};
  weeks.forEach(week => {
    week.forEach(day => {
      dayEventCount[day.iso] = this.getEventsForDay(day.iso).length;
    });
  });

  
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
      iso: formatLocalDate(d),
      inCurrentMonth: inCurrent,
      isToday: formatLocalDate(d) === formatLocalDate(this.today)
    });

    for (let i = leading - 1; i >= 0; i--) cells.push(makeCell(new Date(y, m - 1, prevMonthDays - i), false));
    for (let d = 1; d <= daysInMonth; d++) cells.push(makeCell(new Date(y, m, d), true));
    for (let d = 1; d <= trailing; d++) cells.push(makeCell(new Date(y, m + 1, d), false));

    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    this.weeks.set(weeks);
  }
}
