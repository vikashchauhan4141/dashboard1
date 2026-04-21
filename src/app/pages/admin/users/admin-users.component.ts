import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { AdminService } from '../../../services/admin.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, PageHeaderComponent,
    TableModule, ButtonModule, DialogModule, InputTextModule, 
    PasswordModule, ToastModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = true;
  saving = false;
  
  displayDialog = false;
  userForm!: FormGroup;
  editingId: string | null = null;

  private destroy$ = new Subject<void>();
  private destroyed = false;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', Validators.minLength(8)],
      street: [''],
      company: [''],
      isActive: [true]
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers()
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

  openCreateDialog(): void {
    this.editingId = null;
    this.userForm.reset({ isActive: true });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.displayDialog = true;
  }

  openEditDialog(user: any): void {
    this.editingId = user._id;
    this.userForm.reset({
      name: user.name,
      email: user.email, // email normally can't be changed, but we set it
      phone: user.phone || '',
      street: user.street || '',
      company: user.company || '',
      isActive: user.isActive !== false
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.displayDialog = true;
  }

  hideDialog(): void {
    this.displayDialog = false;
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const data = this.userForm.value;

    if (this.editingId) {
      // Edit User
      this.adminService.updateUser(this.editingId, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.handleSuccess('User updated successfully');
          },
          error: (err) => this.handleError(err)
        });
    } else {
      // Create User
      this.adminService.createUser(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.handleSuccess('User created successfully');
          },
          error: (err) => this.handleError(err)
        });
    }
  }

  deleteUser(id: string): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this user?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.adminService.deleteUser(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User deleted successfully' });
              this.loadUsers();
            },
            error: (err) => this.handleError(err)
          });
      }
    });
  }

  private handleSuccess(msg: string) {
    this.saving = false;
    this.displayDialog = false;
    this.messageService.add({ severity: 'success', summary: 'Success', detail: msg });
    this.loadUsers();
  }

  private handleError(err: any) {
    this.saving = false;
    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Action failed' });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
  }
}
