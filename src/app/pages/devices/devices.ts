import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DeviceService, Device } from '../../services/device.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './devices.html',
  styleUrl: './devices.scss',
})
export class Devices implements OnInit {
  devices = signal<Device[]>([]);
  loading = signal<boolean>(true);

  // Modal state
  showModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  modalLoading = signal<boolean>(false);

  // Delete confirm state
  showDeleteConfirm = signal<boolean>(false);
  deviceToDelete = signal<Device | null>(null);
  deleteLoading = signal<boolean>(false);

  // Form model
  formData: Device = this.emptyForm();

  constructor(private deviceService: DeviceService) { }

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loading.set(true);
    this.deviceService.getDevices().subscribe({
      next: (data) => {
        this.devices.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching devices:', err);
        this.loading.set(false);
      },
    });
  }

  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  // ── Add ──────────────────────────────────────
  openAddModal(): void {
    this.formData = this.emptyForm();
    this.isEditMode.set(false);
    this.showModal.set(true);
  }

  // ── Edit ─────────────────────────────────────
  openEditModal(device: Device): void {
    this.formData = { ...device };
    this.isEditMode.set(true);
    this.showModal.set(true);
  }

  // ── Save (Add or Update) ──────────────────────
  saveDevice(): void {
    if (!this.isFormValid()) return;
    this.modalLoading.set(true);

    if (this.isEditMode()) {
      this.deviceService.updateDevice(this.formData.id!, this.formData).subscribe({
        next: (updated) => {
          this.devices.update((list) =>
            list.map((d) => (d.id === updated.id ? updated : d))
          );
          this.modalLoading.set(false);
          this.closeModal();
        },
        error: (err) => {
          console.error('Update failed:', err);
          this.modalLoading.set(false);
        },
      });
    } else {
      this.deviceService.addDevice(this.formData).subscribe({
        next: (created) => {
          this.devices.update((list) => [...list, created]);
          this.modalLoading.set(false);
          this.closeModal();
        },
        error: (err) => {
          console.error('Add failed:', err);
          this.modalLoading.set(false);
        },
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.formData = this.emptyForm();
  }

  // ── Delete ────────────────────────────────────
  confirmDelete(device: Device): void {
    this.deviceToDelete.set(device);
    this.showDeleteConfirm.set(true);
  }

  executeDelete(): void {
    const device = this.deviceToDelete();
    if (!device?.id) return;
    this.deleteLoading.set(true);

    this.deviceService.deleteDevice(device.id).subscribe({
      next: () => {
        this.devices.update((list) => list.filter((d) => d.id !== device.id));
        this.deleteLoading.set(false);
        this.closeDeleteConfirm();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.deleteLoading.set(false);
      },
    });
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.deviceToDelete.set(null);
  }

  // ── Helpers ───────────────────────────────────
  private emptyForm(): Device {
    return { name: '', username: '', email: '', street: '', phone: '', company: '' };
  }

  isFormValid(): boolean {
    return !!(
      this.formData.name?.trim() &&
      this.formData.username?.trim() &&
      this.formData.email?.trim() &&
      this.formData.street?.trim() &&
      this.formData.phone?.trim() &&
      this.formData.company?.trim()
    );
  }
}
