import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { Device } from '../../../models/device.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-admin-devices',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, ButtonModule,
    DialogModule, InputTextModule, PageHeaderComponent, ToastModule, 
    ConfirmDialogModule, IconFieldModule, InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-devices.component.html',
  styleUrl: './admin-devices.component.scss'
})
export class AdminDevicesComponent implements OnInit, OnDestroy {
  @ViewChild('dt') dt!: Table;

  devices: Device[] = [];
  loading = true;
  saving = false;
  
  displayDialog = false;
  deviceForm!: FormGroup;
  editingId: string | null = null;
  
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  removingImage = false;

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
    this.loadDevices();
  }

  initForm(): void {
    this.deviceForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      street: ['', Validators.required],
      company: ['', Validators.required],
      lat: [null],
      lng: [null]
    });
  }

  loadDevices(): void {
    this.loading = true;
    this.adminService.getDevices()
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

  onGlobalFilter(event: Event): void {
    this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openCreateDialog(): void {
    this.editingId = null;
    this.deviceForm.reset();
    this.selectedFile = null;
    this.imagePreview = null;
    this.displayDialog = true;
  }

  openEditDialog(device: Device): void {
    this.editingId = device._id;
    this.deviceForm.reset({
      name: device.name,
      username: device.username,
      email: device.email,
      phone: device.phone,
      street: device.street,
      company: device.company,
      lat: device.lat,
      lng: device.lng
    });
    this.selectedFile = null;
    this.imagePreview = device.imageUrl || null;
    this.displayDialog = true;
  }

  hideDialog(): void {
    this.displayDialog = false;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => (this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);
  }

  clearSelectedImage(): void {
    this.selectedFile = null;
    if (this.editingId) {
      const d = this.devices.find((x) => x._id === this.editingId);
      this.imagePreview = d?.imageUrl || null;
    } else {
      this.imagePreview = null;
    }
  }

  confirmRemoveExistingImage(): void {
    if (!this.editingId) return;
    this.confirmationService.confirm({
      message: 'Remove existing image immediately? This action cannot be undone.',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.removingImage = true;
        this.adminService.removeDeviceImage(this.editingId!).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.imagePreview = null;
            this.removingImage = false;
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Image removed' });
            this.loadDevices(); // Refresh list to get updated imageUrl
          },
          error: () => {
            this.removingImage = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove image' });
          }
        });
      }
    });
  }

  saveDevice(): void {
    if (this.deviceForm.invalid) {
      this.deviceForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formVals = this.deviceForm.value;
    const fd = new FormData();
    fd.append('name', formVals.name);
    fd.append('username', formVals.username);
    fd.append('email', formVals.email);
    fd.append('phone', formVals.phone);
    fd.append('street', formVals.street);
    fd.append('company', formVals.company);
    if (formVals.lat != null) fd.append('lat', formVals.lat.toString());
    if (formVals.lng != null) fd.append('lng', formVals.lng.toString());
    if (this.selectedFile) fd.append('image', this.selectedFile);

    const obs = this.editingId 
      ? this.adminService.updateDevice(this.editingId, fd)
      : this.adminService.createDevice(fd);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.displayDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: this.editingId ? 'Device updated' : 'Device created' });
        this.loadDevices();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save' });
      }
    });
  }

  deleteDevice(id: string): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this device?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.adminService.deleteDevice(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Device deleted' });
              this.loadDevices();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' })
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
  }
}
