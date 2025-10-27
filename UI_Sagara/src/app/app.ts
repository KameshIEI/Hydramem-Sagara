import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { ProjectionFormComponent } from './components/projection-form/projection-form';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, ProjectionFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  ptitle = 'hydramem-standalone-project';;
}
