import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="header-left">
        <button *ngIf="showBackButton" class="back-btn" (click)="goBack()">
          <i class="pi pi-arrow-left"></i>
        </button>
        <div>
          <h1 class="page-title">{{ title }}</h1>
          <p class="page-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="header-right">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .back-btn {
      background: #fff;
      border: 1px solid #e2e8f0;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #475569;
      transition: all 0.2s;
    }
    .back-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .page-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }
    .page-subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.9rem;
      color: #64748b;
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showBackButton = false;

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
