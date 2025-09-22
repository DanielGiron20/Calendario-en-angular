import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';

type EventItem = {
  id: string;
  title: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  color?: string;
};

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Component({
  selector: 'app-year-view',
  standalone: true,
  imports: [NgFor, NgClass, NgIf],
  templateUrl: './year-view.component.html',
  styleUrls: ['./year-view.component.css']
})
export class YearViewComponent {
  @Input() year: number = new Date().getFullYear();
  @Input() events: EventItem[] = [];   // 👉 ahora recibe eventos
  @Input() animating: boolean = false;
  @Input() direction: 'prev' | 'next' | null = null;

  @Output() daySelected = new EventEmitter<string>();  // 👉 emitimos día específico
  @Output() monthSelected = new EventEmitter<number>(); // lo dejamos por compatibilidad

  months = Array.from({ length: 12 }, (_, i) => i); // 0 = enero, 11 = diciembre

  getMonthName(monthIndex: number): string {
    return new Date(this.year, monthIndex, 1).toLocaleString('en', { month: 'long' });
  }

  // getDaysInMonth(monthIndex: number): string[] {
  //   const days: string[] = [];
  //   const date = new Date(this.year, monthIndex, 1);
  //   while (date.getMonth() === monthIndex) {
  //     days.push(formatLocalDate(date)); // formato YYYY-MM-DD
  //     date.setDate(date.getDate() + 1);
  //   }
  //   return days;
  // }

  getDaysInMonth(monthIndex: number): string[] {
  const days: string[] = [];
  const date = new Date(this.year, monthIndex, 1);
  const firstWeekday = date.getDay(); // 0=Sunday ... 6=Saturday

  // celdas vacías al inicio del mes
  for (let i = 0; i < firstWeekday; i++) {
    days.push(''); // puedes usar '' o un valor especial
  }

  // días reales del mes
  while (date.getMonth() === monthIndex) {
    days.push(formatLocalDate(date)); // formato YYYY-MM-DD
    date.setDate(date.getDate() + 1);
  }

  return days;
}


  selectMonth(monthIndex: number) {
  this.monthSelected.emit(monthIndex);
}


  hasEvent(dayIso: string): boolean {
    return this.events.some(ev => ev.start <= dayIso && ev.end >= dayIso);
  }

  selectDay(dayIso: string) {
    this.daySelected.emit(dayIso);
  }
}
