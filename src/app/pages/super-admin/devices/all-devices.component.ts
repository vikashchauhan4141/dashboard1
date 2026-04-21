import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SuperAdminService } from '../../../services/super-admin.service';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';
import { Device } from '../../../models/device.model';

@Component({
  selector: 'app-all-devices',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, TableModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <app-page-header title="All Devices" subtitle="View all devices across the platform"></app-page-header>
    
    <div class="card">
      <p-table 
        [value]="devices" 
        [loading]="loading" 
        [paginator]="true" 
        [rows]="10" 
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        styleClass="p-datatable-sm custom-table">
        
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 50px">#</th>
            <th>Photo</th>
            <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
            <th pSortableColumn="username">Username <p-sortIcon field="username"></p-sortIcon></th>
            <th pSortableColumn="company">Company <p-sortIcon field="company"></p-sortIcon></th>
            <th pSortableColumn="createdBy.name">Created By <p-sortIcon field="createdBy.name"></p-sortIcon></th>
            <th>Location</th>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="body" let-device let-i="rowIndex">
          <tr>
            <td>{{ i + 1 }}</td>
            <td>
              <div class="device-photo">
                <img *ngIf="device.imageUrl" [src]="device.imageUrl" alt="device photo" />
                <span *ngIf="!device.imageUrl">{{ device.name?.charAt(0)?.toUpperCase() || 'D' }}</span>
              </div>
            </td>
            <td class="font-semibold">{{ device.name }}</td>
            <td>&#64;{{ device.username }}</td>
            <td>{{ device.company || '-' }}</td>
            <td>
              <div class="created-by-badge" *ngIf="device.createdBy">
                <span>{{ device.createdBy.name }}</span>
              </div>
              <span *ngIf="!device.createdBy" class="text-gray-400">-</span>
            </td>
            <td>
              <div class="coords-badge" *ngIf="device.lat && device.lng">
                <i class="pi pi-map-marker"></i>
                <span>{{ device.lat | number:'1.4-4' }}, {{ device.lng | number:'1.4-4' }}</span>
              </div>
              <span *ngIf="!device.lat || !device.lng" class="text-gray-400">-</span>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center p-4">No devices found.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      border: 1px solid #e2e8f0;
      padding: 1rem;
    }
    .device-photo {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: linear-gradient(135deg, #188b52, #23c46e);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
      overflow: hidden;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .created-by-badge {
      display: flex;
      flex-direction: column;
      span { font-weight: 500; font-size: 0.85rem; color: #334155; }
    }
    .coords-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(22, 163, 74, 0.1);
      color: #16A34A;
      border: 1px solid rgba(22, 163, 74, 0.2);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.75rem;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
    }
  `]
})
export class AllDevicesComponent implements OnInit, OnDestroy {
  devices: Device[] = [];
  loading = true;
  private destroy$ = new Subject<void>();
  private destroyed = false;

  constructor(
    private superAdminService: SuperAdminService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loading = true;

    this.superAdminService.getDevices()
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
          this.devices = Array.isArray(res?.data) ? res.data : [];
        },
        error: (err) => {
          console.error(err);
          const detail = err?.name === 'TimeoutError'
            ? 'Request timed out. Please try again.'
            : 'Failed to load devices.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
  }
}
