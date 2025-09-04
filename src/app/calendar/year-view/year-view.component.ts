import { Component, Input } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
@Component({
  selector: 'app-year-view',
  standalone: true,
  imports: [NgFor],
  templateUrl: './year-view.component.html',
  styleUrls: ['./year-view.component.css']
})
export class YearViewComponent {
  @Input() year: number = new Date().getFullYear();

  months = Array.from({ length: 12 }, (_, i) => i); // 0 = enero, 11 = diciembre

  getMonthName(monthIndex: number): string {
    return new Date(this.year, monthIndex, 1).toLocaleString('default', { month: 'long' });
  }

  getDaysInMonth(monthIndex: number): string[] {
    const days: string[] = [];
    const date = new Date(this.year, monthIndex, 1);
    while (date.getMonth() === monthIndex) {
      days.push(date.toISOString().slice(0, 10)); // formato YYYY-MM-DD
      date.setDate(date.getDate() + 1);
    }
    return days;
  }
}
