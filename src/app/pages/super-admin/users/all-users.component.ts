import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperAdminService } from '../../../services/super-admin.service';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-all-users',
  standalone: true,
  imports: [CommonModule, TableModule, ToastModule, IconFieldModule, InputIconModule, InputTextModule],
  providers: [MessageService],
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.scss'
})
export class AllUsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = true;
  private destroy$ = new Subject<void>();
  private destroyed = false;

  constructor(
    private superAdminService: SuperAdminService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;

    this.superAdminService.getUsers()
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
          this.users = Array.isArray(res?.data) ? res.data : [];
        },
        error: (err) => {
          console.error(err);
          const detail = err?.name === 'TimeoutError'
            ? 'Request timed out. Please try again.'
            : 'Failed to load users.';
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
