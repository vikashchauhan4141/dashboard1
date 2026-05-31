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

    <div class="charts-grid" *ngIf="!loading && !errorMessage">
      <!-- Device Status Chart -->
      <div class="chart-card">
        <h3>Device Operational Status</h3>
        <div class="chart-content">
          <!-- Animated SVG Donut Chart -->
          <svg width="150" height="150" viewBox="0 0 42 42" class="donut">
            <circle cx="21" cy="21" r="15.91549430918954" fill="#fff"></circle>
            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" stroke-width="4"></circle>
            
            <!-- Segment 1: Active (Green) -->
            <circle class="donut-segment segment-green" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                    stroke="#10b981" stroke-width="4" 
                    [attr.stroke-dasharray]="deviceActiveDashArray" 
                    stroke-dashoffset="0">
            </circle>
            
            <!-- Segment 2: Inactive (Red) -->
            <circle class="donut-segment segment-red" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                    stroke="#ef4444" stroke-width="4" 
                    [attr.stroke-dasharray]="deviceInactiveDashArray" 
                    [attr.stroke-dashoffset]="deviceInactiveDashOffset">
            </circle>
          </svg>
          
          <div class="chart-legend">
            <div class="legend-item">
              <span class="dot green"></span>
              <span class="label">Active: <strong>{{ activeDevices }}</strong> ({{ activeDevicePct }}%)</span>
            </div>
            <div class="legend-item">
              <span class="dot red"></span>
              <span class="label">Inactive: <strong>{{ inactiveDevices }}</strong> ({{ inactiveDevicePct }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- User Status Card -->
      <div class="chart-card">
        <h3>User Activity Status</h3>
        <div class="bar-chart-container">
          <div class="progress-bar-wrap">
            <div class="bar-label">
              <span>Active Accounts</span>
              <span>{{ activeUsers }} of {{ totalUsers }} ({{ activeUserPct }}%)</span>
            </div>
            <div class="bar-bg">
              <div class="bar-fill green" [style.width.%]="activeUserPct"></div>
            </div>
          </div>

          <div class="progress-bar-wrap">
            <div class="bar-label">
              <span>Suspended/Inactive Accounts</span>
              <span>{{ inactiveUsers }} of {{ totalUsers }} ({{ inactiveUserPct }}%)</span>
            </div>
            <div class="bar-bg">
              <div class="bar-fill red" [style.width.%]="inactiveUserPct"></div>
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
    .dot.green { background: #10b981; }
    .dot.red { background: #ef4444; }

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
    .bar-fill.green { background: linear-gradient(90deg, #10b981, #34d399); }
    .bar-fill.red { background: linear-gradient(90deg, #ef4444, #f87171); }

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

  activeDevices = 0;
  inactiveDevices = 0;
  activeDevicePct = 0;
  inactiveDevicePct = 0;
  deviceActiveDashArray = '0 100';
  deviceInactiveDashArray = '0 100';
  deviceInactiveDashOffset = '0';

  activeUsers = 0;
  inactiveUsers = 0;
  activeUserPct = 0;
  inactiveUserPct = 0;

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
        const usersList = Array.isArray(res.users?.data) ? res.users.data : [];
        const devicesList = Array.isArray(res.devices?.data) ? res.devices.data : [];

        this.totalUsers = usersList.length;
        this.totalDevices = devicesList.length;

        // Compute device status counts
        this.activeDevices = devicesList.filter(d => d.isActive !== false).length;
        this.inactiveDevices = this.totalDevices - this.activeDevices;

        if (this.totalDevices > 0) {
          this.activeDevicePct = Math.round((this.activeDevices / this.totalDevices) * 100);
          this.inactiveDevicePct = Math.round((this.inactiveDevices / this.totalDevices) * 100);

          this.deviceActiveDashArray = `${this.activeDevicePct} ${100 - this.activeDevicePct}`;
          this.deviceInactiveDashArray = `${this.inactiveDevicePct} ${100 - this.inactiveDevicePct}`;
          this.deviceInactiveDashOffset = String(-this.activeDevicePct);
        } else {
          this.deviceActiveDashArray = '0 100';
          this.deviceInactiveDashArray = '0 100';
        }

        // Compute user status counts
        this.activeUsers = usersList.filter(u => u.isActive !== false).length;
        this.inactiveUsers = this.totalUsers - this.activeUsers;

        if (this.totalUsers > 0) {
          this.activeUserPct = Math.round((this.activeUsers / this.totalUsers) * 100);
          this.inactiveUserPct = Math.round((this.inactiveUsers / this.totalUsers) * 100);
        } else {
          this.activeUserPct = 0;
          this.inactiveUserPct = 0;
        }
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
