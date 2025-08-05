import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MobileTabBarComponent } from './shared/components/mobile-tab-bar/mobile-tab-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MobileTabBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('Trade FX Replay');
}
