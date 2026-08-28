import { Component, signal } from '@angular/core';
import { CompareComponent } from "./component/compare-component/compare-component";

@Component({
  selector: 'app-root',
  imports: [CompareComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('match-front');
}
