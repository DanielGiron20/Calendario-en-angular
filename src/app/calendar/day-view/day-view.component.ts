import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
export type EventItem = {
  id: string;
  title: string;
  start: string; // 'YYYY-MM-DD'
  end: string;   // 'YYYY-MM-DD'
  hstart: string; // 'HH:mm'
  hend: string;   // 'HH:mm'
  color?: string;
};


@Component({
  selector: 'app-day-view',
  templateUrl: './day-view.component.html',
  imports: [NgIf, NgFor],
  standalone: true,
})
export class DayViewComponent {
  @Input() selectedDate: string | null = null;
  @Input() events: EventItem[] = [];
  @Output() deleteEvent = new EventEmitter<string>();
@Output() openEventModal = new EventEmitter<EventItem>();
  get eventsForDay(): EventItem[] {
    if (!this.selectedDate) return [];
    return this.events.filter(ev => ev.start <= this.selectedDate! && ev.end >= this.selectedDate!);
  }

  onDeleteEvent(eventId: string) {
    this.deleteEvent.emit(eventId);
  }
}
