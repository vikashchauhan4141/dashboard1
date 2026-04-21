import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <div class="stat-icon" [ngClass]="colorClass">
        <i class="pi" [ngClass]="icon"></i>
      </div>
      <div class="stat-details">
        <h3>{{ value }}</h3>
        <p>{{ label }}</p>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
      transition: all 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    }
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .stat-icon.blue { background: #eff6ff; color: #3b82f6; }
    .stat-icon.green { background: #f0fdf4; color: #16a34a; }
    .stat-icon.orange { background: #fff7ed; color: #f97316; }
    .stat-details h3 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
    }
    .stat-details p {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
    }
  `]
})
export class StatCardComponent {
  @Input() icon = 'pi-star';
  @Input() label = 'Stat';
  @Input() value: number | string = 0;
  @Input() colorClass: 'blue' | 'green' | 'orange' | string = 'blue';
}
