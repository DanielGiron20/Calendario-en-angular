import { Component, Input, Output, EventEmitter, computed, signal, SimpleChanges } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';

type EventItem = {
  id: string;
  title: string;
  start: string; // 'YYYY-MM-DD'
  end: string;   // 'YYYY-MM-DD'
  color?: string;
};

type EventSpan = {
  event: EventItem;
  weekIndex: number;
  row: number;
  colStart: number;
  colEnd: number;
};


type WeekDay = {
  iso: string;
  date: Date;
  isToday: boolean;
};

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './week-view.component.html',
})
export class WeekViewComponent {
  @Input() events: EventItem[] = [];
  @Input() selectedDate: string | null = null;
  @Input() eventSpans: EventSpan[] = [];
  @Input() animating: boolean = false;
  @Input() direction: 'prev' | 'next' | null = null;
  @Input() currentWeekIndex: number = -1;
  @Output() selectedDateChange = new EventEmitter<string>();
  @Output() openDayModal = new EventEmitter<void>();
  @Output() openEventForm = new EventEmitter<void>();
  

  

// weekEventSpans(): EventSpan[] {
//   const weekIsos = this.currentWeek.map(d => d.iso);
//   return this.eventSpans.filter(span =>
//     span.colStart < weekIsos.length && span.colEnd >= 0
//   );
// }

weekEventSpans(): EventSpan[] {
  // Si recibimos el índice de la semana del padre, filtramos por él (lo correcto)
  if (this.currentWeekIndex >= 0) {
    return this.eventSpans.filter(span => span.weekIndex === this.currentWeekIndex);
  }

  // Fallback seguro (si por alguna razón no se pasó el índice): 
  // devolvemos spans que intersectan la semana actual 
  const weekIsos = this.currentWeek.map(d => d.iso);
  return this.eventSpans.filter(span =>
    span.colStart < weekIsos.length && span.colEnd >= 0
  );
}

  // Señal interna para recalcular la semana cuando cambia selectedDate
  private internalDate = signal<string | null>(this.selectedDate);

  
 get currentWeek(): WeekDay[] {
  const iso = this.selectedDate || formatLocalDate(new Date());
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return {
      iso: formatLocalDate(d),
      date: d,
      isToday: d.toDateString() === new Date().toDateString(),
    };
  });
}


  

  

  getEventsForDay(dayIso: string) {
    return this.events.filter(ev => ev.start <= dayIso && ev.end >= dayIso);
  }

  selectDay(iso: string) {
  this.selectedDate = iso;
  this.selectedDateChange.emit(iso); // sincroniza el día con el padre
  this.openDayModal.emit();           // abre el modal del día
}

addEvent(iso: string) {
  this.selectedDate = iso;
  this.selectedDateChange.emit(iso); // sincroniza
  this.openEventForm.emit();          // abre el modal de evento
}


}
