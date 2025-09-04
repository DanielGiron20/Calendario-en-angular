import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';

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

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [NgFor, NgClass,],
  templateUrl: './week-view.component.html',
})
export class WeekViewComponent {
  @Input() events: EventItem[] = [];
  @Input() selectedDate: string | null = null;
  @Output() selectedDateChange = new EventEmitter<string>();
  @Output() openDayModal = new EventEmitter<void>();
  @Output() openEventForm = new EventEmitter<void>();
  @Input() eventSpans: EventSpan[] = [];

weekEventSpans(): EventSpan[] {
  const weekIsos = this.currentWeek().map(d => d.iso);
  return this.eventSpans.filter(span =>
    span.colStart < weekIsos.length && span.colEnd >= 0
  );
}

  // Señal interna para recalcular la semana cuando cambia selectedDate
  private internalDate = signal<string | null>(this.selectedDate);

  currentWeek = computed<WeekDay[]>(() => {
    const [year, month, day] = (this.selectedDate || new Date().toISOString().slice(0,10)).split('-').map(Number);
const date = new Date(year, month - 1, day)

    // Ajuste para evitar desfase de zona horaria
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        iso: d.toISOString().slice(0, 10),
        date: d,
        isToday: d.toDateString() === new Date().toDateString(),
      };
    });
  });

  ngOnChanges() {
    // Actualizamos señal interna cuando el input cambia
    this.internalDate.set(this.selectedDate);
  }

  prevWeek() {
    if (!this.internalDate()) return;
    const d = new Date(this.internalDate()!);
    d.setDate(d.getDate() - 7);
    const iso = d.toISOString().slice(0, 10);
    this.internalDate.set(iso);
    this.selectedDateChange.emit(iso);
  }

  nextWeek() {
    if (!this.internalDate()) return;
    const d = new Date(this.internalDate()!);
    d.setDate(d.getDate() + 7);
    const iso = d.toISOString().slice(0, 10);
    this.internalDate.set(iso);
    this.selectedDateChange.emit(iso);
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
