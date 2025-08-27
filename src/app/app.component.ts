import { Component } from '@angular/core';
import { CalendarComponent } from "./components/calendar/calendar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CalendarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'calendario-app';
}
