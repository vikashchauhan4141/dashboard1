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

    <div class="charts-grid" *ngIf="!loading && !errorMessage">
      <!-- Donut Chart Card -->
      <div class="chart-card">
        <h3>System User Breakdown</h3>
        <div class="chart-content">
          <!-- Animated SVG Donut Chart -->
          <svg width="160" height="160" viewBox="0 0 42 42" class="donut">
            <circle cx="21" cy="21" r="15.91549430918954" fill="#fff"></circle>
            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" stroke-width="3.5"></circle>
            
            <!-- Segment 1: Admins (Blue) -->
            <circle class="donut-segment segment-blue" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                    stroke="#3b82f6" stroke-width="3.5" 
                    [attr.stroke-dasharray]="adminDashArray" 
                    stroke-dashoffset="0">
            </circle>
            
            <!-- Segment 2: Users (Green) -->
            <circle class="donut-segment segment-green" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                    stroke="#10b981" stroke-width="3.5" 
                    [attr.stroke-dasharray]="userDashArray" 
                    [attr.stroke-dashoffset]="userDashOffset">
            </circle>
          </svg>
          
          <div class="chart-legend">
            <div class="legend-item">
              <span class="dot blue"></span>
              <span class="label">Admins: <strong>{{ stats?.totalAdmins || 0 }}</strong> ({{ adminPct }}%)</span>
            </div>
            <div class="legend-item">
              <span class="dot green"></span>
              <span class="label">Users: <strong>{{ stats?.totalUsers || 0 }}</strong> ({{ userPct }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Company Devices Card -->
      <div class="chart-card">
        <h3>Device & Admin Ratios</h3>
        <div class="bar-chart-container">
          <div class="progress-bar-wrap">
            <div class="bar-label">
              <span>Admins per Device Ratio</span>
              <span>{{ adminDevicePct }}%</span>
            </div>
            <div class="bar-bg">
              <div class="bar-fill blue" [style.width.%]="adminDevicePct"></div>
            </div>
          </div>

          <div class="progress-bar-wrap">
            <div class="bar-label">
              <span>Users per Device Ratio</span>
              <span>{{ userDevicePct }}%</span>
            </div>
            <div class="bar-bg">
              <div class="bar-fill green" [style.width.%]="userDevicePct"></div>
            </div>
          </div>
        </div>
      </div>
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
      margin-bottom: 1.5rem;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .chart-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    }
    .chart-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1a2e22;
      margin: 0 0 1.25rem 0;
    }
    .chart-content {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 1.5rem;
    }
    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88rem;
      color: #4a6355;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot.blue { background: #3b82f6; }
    .dot.green { background: #10b981; }

    .donut {
      transform: rotate(-90deg);
    }
    .donut-segment {
      transition: stroke-dasharray 0.5s ease;
      transform-origin: center;
    }

    .bar-chart-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      justify-content: center;
      height: 120px;
    }
    .progress-bar-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 600;
      color: #4a6355;
    }
    .bar-bg {
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s ease-out;
    }
    .bar-fill.blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .bar-fill.green { background: linear-gradient(90deg, #10b981, #34d399); }

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
  
  adminDashArray = '0 100';
  userDashArray = '0 100';
  userDashOffset = '0';
  adminPct = 0;
  userPct = 0;
  adminDevicePct = 0;
  userDevicePct = 0;

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
          this.calculateChartData();
        },
        error: (err) => {
          console.error('Failed to load stats', err);
          this.errorMessage = err?.name === 'TimeoutError'
            ? 'Dashboard request timed out. Please try again.'
            : 'Failed to load dashboard data.';
        }
      });
  }

  calculateChartData(): void {
    if (!this.stats) return;

    const totalAdmins = this.stats.totalAdmins || 0;
    const totalUsers = this.stats.totalUsers || 0;
    const totalDevices = this.stats.totalDevices || 0;
    const totalPeople = totalAdmins + totalUsers;

    if (totalPeople > 0) {
      this.adminPct = Math.round((totalAdmins / totalPeople) * 100);
      this.userPct = Math.round((totalUsers / totalPeople) * 100);

      this.adminDashArray = `${this.adminPct} ${100 - this.adminPct}`;
      this.userDashArray = `${this.userPct} ${100 - this.userPct}`;
      // Offset second segment by first segment's size (clockwise)
      this.userDashOffset = String(-this.adminPct);
    }

    if (totalDevices > 0) {
      this.adminDevicePct = Math.min(100, Math.round((totalAdmins / totalDevices) * 100));
      this.userDevicePct = Math.min(100, Math.round((totalUsers / totalDevices) * 100));
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
  }
}
