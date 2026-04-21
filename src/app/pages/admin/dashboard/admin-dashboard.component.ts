import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { Subject, forkJoin } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, PageHeaderComponent],
  template: `
    <app-page-header title="Admin Dashboard" subtitle="Manage your users and devices"></app-page-header>

    <div class="stats-grid" *ngIf="!loading && !errorMessage">
      <app-stat-card 
        icon="pi-user" 
        label="My Users" 
        [value]="totalUsers" 
        colorClass="green">
      </app-stat-card>
      
      <app-stat-card 
        icon="pi-server" 
        label="My Devices" 
        [value]="totalDevices" 
        colorClass="blue">
      </app-stat-card>
    </div>

    <div class="loading-state" *ngIf="loading">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Loading dashboard data...</p>
    </div>

    <div class="error-state" *ngIf="!loading && errorMessage">
      <i class="pi pi-exclamation-circle"></i>
      <p>{{ errorMessage }}</p>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #64748b;
    }
    .loading-state i {
      font-size: 2rem;
      color: #16A34A;
      margin-bottom: 1rem;
    }
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #b91c1c;
      text-align: center;
    }
    .error-state i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  totalUsers = 0;
  totalDevices = 0;
  loading = true;
  errorMessage = '';
  private destroy$ = new Subject<void>();
  private destroyed = false;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      users: this.adminService.getUsers(),
      devices: this.adminService.getDevices()
    })
    .pipe(
      takeUntil(this.destroy$),
      timeout(15000),
      finalize(() => {
        if (this.destroyed) {
          return;
        }

        this.loading = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (res) => {
        this.totalUsers = res.users.data?.length || 0;
        this.totalDevices = res.devices.data?.length || 0;
      },
      error: (err) => {
        console.error('Failed to load stats', err);
        this.errorMessage = err?.name === 'TimeoutError'
          ? 'Dashboard request timed out. Please try again.'
          : 'Failed to load dashboard data.';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
  }
}
