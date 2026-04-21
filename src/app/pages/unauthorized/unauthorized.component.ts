import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-card">
        <i class="pi pi-lock lock-icon"></i>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <button class="go-back-btn" (click)="goBack()">Go to Dashboard</button>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      height: 100vh;
      align-items: center;
      justify-content: center;
      background: #f0f2f5;
    }
    .unauthorized-card {
      background: #fff;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      text-align: center;
      max-width: 400px;
    }
    .lock-icon {
      font-size: 4rem;
      color: #ef4444;
      margin-bottom: 1.5rem;
    }
    h2 { margin: 0 0 1rem; color: #1e293b; font-size: 1.75rem; }
    p { margin: 0 0 2rem; color: #64748b; }
    .go-back-btn {
      background: #16A34A;
      color: #fff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .go-back-btn:hover { background: #15803d; }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack(): void {
    // Rely on AuthGuard logic / routing to bounce to proper dashboard
    this.router.navigate(['/']);
  }
}
