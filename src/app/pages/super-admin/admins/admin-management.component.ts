import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SuperAdminService } from '../../../services/super-admin.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    TableModule, ButtonModule, DialogModule, InputTextModule,
    PasswordModule, ToastModule, ConfirmDialogModule, IconFieldModule, InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-management.component.html',
  styleUrl: './admin-management.component.scss'
})
export class AdminManagementComponent implements OnInit, OnDestroy {
  admins: User[] = [];
  loading = true;
  refreshing = false;
  saving = false;
  displayDialog = false;
  adminForm!: FormGroup;
  editingAdminId: string | null = null;
  loadingAdminDetails = false;
  adminEditorError = '';
  selectedAdmin: User | null = null;

  private destroy$ = new Subject<void>();
  private adminsRequestInFlight = false;
  private destroyed = false;

  constructor(
    private superAdminService: SuperAdminService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAdmins(true);
  }

  get isEditMode(): boolean {
    return !!this.editingAdminId;
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Update Admin' : 'Create Admin';
  }

  get dialogSubtitle(): string {
    return this.isEditMode
      ? 'Review contact details and access status before saving changes.'
      : 'Add a new admin with secure sign-in credentials for your team.';
  }

  get dialogActionLabel(): string {
    if (this.saving) {
      return this.isEditMode ? 'Saving Changes...' : 'Creating Admin...';
    }

    return this.isEditMode ? 'Update Admin' : 'Create Admin';
  }

  get currentStatusLabel(): string {
    return this.adminForm.get('isActive')?.value !== false ? 'Active' : 'Inactive';
  }

  get adminInitial(): string {
    const name = `${this.adminForm.get('name')?.value ?? ''}`.trim();
    return name ? name.charAt(0).toUpperCase() : 'A';
  }

  initForm(): void {
    this.adminForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      isActive: [true]
    });
    this.configureFormForCreate();
  }

  loadAdmins(showTableLoader = false): void {
    if (this.adminsRequestInFlight) {
      return;
    }

    const shouldShowTableLoader = showTableLoader || this.admins.length === 0;
    this.loading = shouldShowTableLoader;
    this.refreshing = !shouldShowTableLoader;
    this.adminsRequestInFlight = true;

    this.superAdminService.getAdmins()
      .pipe(
        takeUntil(this.destroy$),
        timeout(15000),
        finalize(() => {
          this.adminsRequestInFlight = false;

          if (this.destroyed) {
            return;
          }

          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.admins = Array.isArray(res?.data) ? res.data : [];
        },
        error: (err) => {
          console.error(err);
          const detail = err?.name === 'TimeoutError'
            ? 'Request timed out. Please try again.'
            : (err?.error?.message || 'Failed to load admins.');
          this.messageService.add({ severity: 'error', summary: 'Error', detail });
        }
      });
  }

  openCreateDialog(): void {
    this.editingAdminId = null;
    this.selectedAdmin = null;
    this.adminEditorError = '';
    this.loadingAdminDetails = false;
    this.configureFormForCreate();
    this.displayDialog = true;
  }

  openEditDialog(admin: User): void {
    if (!admin?._id || this.loadingAdminDetails) {
      return;
    }

    this.editingAdminId = admin._id;
    this.selectedAdmin = null;
    this.adminEditorError = '';
    this.loadingAdminDetails = true;
    this.configureFormForEdit();
    this.displayDialog = true;
    this.fetchAdminDetails(admin._id);
  }

  retryLoadAdminDetails(): void {
    if (!this.editingAdminId) {
      return;
    }

    this.fetchAdminDetails(this.editingAdminId);
  }

  hideDialog(): void {
    this.displayDialog = false;
  }

  handleDialogHidden(): void {
    this.resetDialogState();
  }

  saveAdmin(): void {
    if (this.loadingAdminDetails || this.adminEditorError) {
      return;
    }

    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode) {
      this.updateAdmin();
      return;
    }

    this.createAdmin();
  }

  deleteAdmin(id: string): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this admin?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.superAdminService.deleteAdmin(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Admin deleted successfully' });
              this.loadAdmins();
            },
            error: (err) => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete' });
            }
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configureFormForCreate(): void {
    this.adminForm.reset({
      name: '',
      email: '',
      phone: '',
      password: '',
      isActive: true
    });
    this.adminForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.adminForm.get('password')?.updateValueAndValidity();
    this.adminForm.get('isActive')?.disable({ emitEvent: false });
  }

  private configureFormForEdit(): void {
    this.adminForm.reset({
      name: '',
      email: '',
      phone: '',
      password: '',
      isActive: true
    });
    this.adminForm.get('password')?.clearValidators();
    this.adminForm.get('password')?.setValue('');
    this.adminForm.get('password')?.updateValueAndValidity();
    this.adminForm.get('isActive')?.enable({ emitEvent: false });
  }

  private fetchAdminDetails(adminId: string): void {
    this.loadingAdminDetails = true;
    this.adminEditorError = '';

    this.superAdminService.getAdminById(adminId)
      .pipe(
        takeUntil(this.destroy$),
        timeout(15000),
        finalize(() => {
          if (this.destroyed || this.editingAdminId !== adminId) {
            return;
          }

          this.loadingAdminDetails = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          if (this.editingAdminId !== adminId || !this.displayDialog) {
            return;
          }

          const admin = res?.data;
          if (!admin) {
            this.adminEditorError = 'Admin details are unavailable right now.';
            return;
          }

          this.selectedAdmin = admin;
          this.adminForm.patchValue({
            name: admin.name ?? '',
            email: admin.email ?? '',
            phone: admin.phone ?? '',
            password: '',
            isActive: admin.isActive !== false
          });
        },
        error: (err) => {
          console.error(err);
          this.adminEditorError = err?.name === 'TimeoutError'
            ? 'Admin details request timed out. Please try again.'
            : (err?.error?.message || 'Failed to load admin details.');
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.adminEditorError });
        }
      });
  }

  private createAdmin(): void {
    const rawValue = this.adminForm.getRawValue();
    const payload = {
      name: `${rawValue.name ?? ''}`.trim(),
      email: `${rawValue.email ?? ''}`.trim(),
      phone: `${rawValue.phone ?? ''}`.trim(),
      password: `${rawValue.password ?? ''}`
    };

    this.saving = true;
    this.superAdminService.createAdmin(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (this.destroyed) {
            return;
          }

          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.hideDialog();
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Admin created successfully' });
          this.loadAdmins();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create admin' });
        }
      });
  }

  private updateAdmin(): void {
    if (!this.editingAdminId || !this.selectedAdmin) {
      return;
    }

    const payload = this.buildUpdatePayload();
    if (Object.keys(payload).length === 0) {
      this.messageService.add({ severity: 'info', summary: 'No Changes', detail: 'Update at least one field before saving.' });
      return;
    }

    this.saving = true;
    this.superAdminService.updateAdmin(this.editingAdminId, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (this.destroyed) {
            return;
          }

          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          const updatedAdmin = res?.data;
          if (updatedAdmin?._id) {
            this.admins = this.admins.map(admin => admin._id === updatedAdmin._id ? { ...admin, ...updatedAdmin } : admin);
          }
          this.hideDialog();
          this.messageService.add({ severity: 'success', summary: 'Success', detail: res?.message || 'Admin updated successfully' });
          this.loadAdmins();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to update admin' });
        }
      });
  }

  private buildUpdatePayload(): Partial<User> {
    const rawValue = this.adminForm.getRawValue();
    const original = this.selectedAdmin;
    if (!original) {
      return {};
    }

    const payload: Partial<User> = {};
    const normalizedName = `${rawValue.name ?? ''}`.trim();
    const normalizedEmail = `${rawValue.email ?? ''}`.trim();
    const normalizedPhone = `${rawValue.phone ?? ''}`.trim();
    const normalizedStatus = rawValue.isActive !== false;

    if (normalizedName !== (original.name ?? '')) {
      payload.name = normalizedName;
    }

    if (normalizedEmail !== (original.email ?? '')) {
      payload.email = normalizedEmail;
    }

    if (normalizedPhone !== (original.phone ?? '')) {
      payload.phone = normalizedPhone;
    }

    if (normalizedStatus !== (original.isActive !== false)) {
      payload.isActive = normalizedStatus;
    }

    return payload;
  }

  private resetDialogState(): void {
    this.editingAdminId = null;
    this.selectedAdmin = null;
    this.loadingAdminDetails = false;
    this.adminEditorError = '';
    this.configureFormForCreate();
  }
}
