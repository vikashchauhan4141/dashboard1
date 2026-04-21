import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperAdminService } from '../../../services/super-admin.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, PageHeaderComponent],
  template: `
    <app-page-header 
      title="Dashboard" 
      [subtitle]="'Overview of your system as of ' + currentDate">
    </app-page-header>

    <div class="stats-grid" *ngIf="!loading && !errorMessage">
      <app-stat-card 
        icon="pi-users" 
        label="Total Admins" 
        [value]="stats?.totalAdmins || 0" 
        colorClass="blue">
      </app-stat-card>
      
      <app-stat-card 
        icon="pi-user" 
        label="Total Users" 
        [value]="stats?.totalUsers || 0" 
        colorClass="green">
      </app-stat-card>
      
      <app-stat-card 
        icon="pi-server" 
        label="Total Devices" 
        [value]="stats?.totalDevices || 0" 
        colorClass="orange">
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
export class SuperAdminDashboardComponent implements OnInit, OnDestroy {
  currentDate = new Date().toLocaleDateString();
  stats: any = null;
  loading = true;
  errorMessage = '';
  private destroy$ = new Subject<void>();
  private destroyed = false;

  constructor(
    private superAdminService: SuperAdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';

    this.superAdminService.getStats()
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
          this.stats = res?.data ?? null;
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
