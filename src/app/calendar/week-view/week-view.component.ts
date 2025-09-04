import { Component, Input, computed, signal } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';

type EventItem = {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
};

type WeekDay = {
  iso: string;
  date: Date;
  isToday: boolean;
};

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './week-view.component.html',
})
export class WeekViewComponent {
  @Input() events: EventItem[] = [];
  @Input() selectedDate: string | null = null;

  currentWeek = computed<WeekDay[]>(() => {
    const baseDate = this.selectedDate || new Date().toISOString().slice(0, 10);
    const date = new Date(baseDate);

    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // domingo

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

  prevWeek() {
    if (!this.selectedDate) return;
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() - 7);
    this.selectedDate = d.toISOString().slice(0, 10);
  }

  nextWeek() {
    if (!this.selectedDate) return;
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + 7);
    this.selectedDate = d.toISOString().slice(0, 10);
  }

  getEventsForDay(dayIso: string) {
    return this.events.filter(ev => ev.start <= dayIso && ev.end >= dayIso);
  }
}
