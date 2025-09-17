import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
@Component({
  selector: 'app-year-view',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './year-view.component.html',
  styleUrls: ['./year-view.component.css']
})
export class YearViewComponent {
  @Input() year: number = new Date().getFullYear();
@Output() monthSelected = new EventEmitter<number>();
@Input() animating: boolean = false;
@Input() direction: 'prev' | 'next' | null = null;

  months = Array.from({ length: 12 }, (_, i) => i); // 0 = enero, 11 = diciembre

   selectMonth(monthIndex: number) {
    this.monthSelected.emit(monthIndex); // 0 = Enero ... 11 = Diciembre
  }
  getMonthName(monthIndex: number): string {
    return new Date(this.year, monthIndex, 1).toLocaleString('en-US', { month: 'long' });
  }

  getDaysInMonth(monthIndex: number): string[] {
    const days: string[] = [];
    const date = new Date(this.year, monthIndex, 1);
    while (date.getMonth() === monthIndex) {
      days.push(formatLocalDate(date)); // formato YYYY-MM-DD
      date.setDate(date.getDate() + 1);
    }
    return days;
  }
}
