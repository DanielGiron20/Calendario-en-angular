import { Component, Input, Output, EventEmitter, computed, signal  } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
type EventItem = {
  id: string;
  title: string;
  start: string; // 'YYYY-MM-DDTHH:mm'
  end: string;   // 'YYYY-MM-DDTHH:mm'
  color?: string;
  hstart: string;
  hend: string
};

type DayEvent = EventItem & {
  startHour: number;
  endHour: number;
};

@Component({
  selector: 'app-day-view',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './day-view.component.html',
})
export class DayViewComponent {
  @Input() selectedDate: string | null = null;
  @Input() events: EventItem[] = [];
  @Output() deleteEvent = new EventEmitter<EventItem>();
  @Output() addEvent = new EventEmitter<void>();

  // Lista de horas de 0 a 23
  hours = Array.from({ length: 24 }, (_, i) => i);

  // Calculamos eventos para esta vista con posición y altura
  get dayEvents(): DayEvent[] {
    if (!this.selectedDate) return [];

    return this.events
      .filter(ev => ev.start.slice(0, 10) === this.selectedDate)
      .map(ev => {
        const startHour = parseInt(ev.hstart.slice(11, 13), 10);
        const endHour = parseInt(ev.hend.slice(11, 13), 10);
        return { ...ev, startHour, endHour };
      });
  }

  onDelete(event: DayEvent) {
    this.deleteEvent.emit(event);
  }

  onAdd() {
    this.addEvent.emit();
  }
}
