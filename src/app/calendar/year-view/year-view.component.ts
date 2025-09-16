import { Component, EventEmitter, Input, Output } from '@angular/core';
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
@Output() monthSelected = new EventEmitter<number>();
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
      days.push(date.toISOString().slice(0, 10)); // formato YYYY-MM-DD
      date.setDate(date.getDate() + 1);
    }
    return days;
  }
}
