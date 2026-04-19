import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DeviceService, Device, DeviceFormPayload } from '../../services/device.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    SkeletonModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './devices.html',
  styleUrl: './devices.scss',
})
export class Devices implements OnInit {
  @ViewChild('dt') dt!: Table;

  devices = signal<Device[]>([]);
  loading = signal<boolean>(true);
  totalRecords = signal<number>(0);

  // Modal state
  showModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  modalLoading = signal<boolean>(false);
  editingId = signal<string | null>(null);

  // Delete state
  showDeleteConfirm = signal<boolean>(false);
  deviceToDelete = signal<Device | null>(null);
  deleteLoading = signal<boolean>(false);

  // Image removal state
  showRemoveImageConfirm = signal<boolean>(false);
  removingImage = signal<boolean>(false);

  // Form
  formData: DeviceFormPayload = this.emptyForm();
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loading.set(true);
    this.deviceService.getDevices().subscribe({
      next: (res) => {
        this.devices.set(res.data);
        this.totalRecords.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching devices:', err);
        this.loading.set(false);
      },
    });
  }

  onGlobalFilter(event: Event): void {
    this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  // ── Add ──────────────────────────────────────────────────────────────────────
  openAddModal(): void {
    this.formData = this.emptyForm();
    this.selectedFile = null;
    this.imagePreview = null;
    this.editingId.set(null);
    this.isEditMode.set(false);
    this.showModal.set(true);
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────
  openEditModal(device: Device): void {
    this.formData = {
      name: device.name,
      username: device.username,
      email: device.email,
      phone: device.phone,
      street: device.street,
      company: device.company,
      latitude: device.latitude ?? null,
      longitude: device.longitude ?? null,
      imageFile: null,
    };
    this.selectedFile = null;
    this.imagePreview = device.imageUrl ?? null;
    this.editingId.set(device._id);
    this.isEditMode.set(true);
    this.showModal.set(true);
  }

  // ── Image ─────────────────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.formData.imageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => (this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);
  }

  clearSelectedImage(): void {
    this.selectedFile = null;
    this.formData.imageFile = null;
    const d = this.devices().find((d) => d._id === this.editingId());
    this.imagePreview = d?.imageUrl ?? null;
  }

  openRemoveImageConfirm(): void {
    this.showRemoveImageConfirm.set(true);
  }

  executeRemoveImage(): void {
    const id = this.editingId();
    if (!id) return;
    this.removingImage.set(true);
    this.deviceService.removeDeviceImage(id).subscribe({
      next: () => {
        this.imagePreview = null;
        this.devices.update((list) =>
          list.map((d) => (d._id === id ? { ...d, image: undefined, imageUrl: undefined } : d))
        );
        this.removingImage.set(false);
        this.showRemoveImageConfirm.set(false);
      },
      error: (err) => {
        console.error('Remove image failed:', err);
        this.removingImage.set(false);
      },
    });
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  saveDevice(): void {
    if (!this.isFormValid()) return;
    this.modalLoading.set(true);

    const obs = this.isEditMode()
      ? this.deviceService.updateDevice(this.editingId()!, this.formData)
      : this.deviceService.addDevice(this.formData);

    obs.subscribe({
      next: (saved) => {
        if (this.isEditMode()) {
          this.devices.update((list) => list.map((d) => (d._id === saved._id ? saved : d)));
        } else {
          this.devices.update((list) => [...list, saved]);
          this.totalRecords.update((n) => n + 1);
        }
        this.modalLoading.set(false);
        this.closeModal();
      },
      error: (err) => {
        console.error('Save failed:', err);
        this.modalLoading.set(false);
      },
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.formData = this.emptyForm();
    this.selectedFile = null;
    this.imagePreview = null;
    this.editingId.set(null);
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  confirmDelete(device: Device): void {
    this.deviceToDelete.set(device);
    this.showDeleteConfirm.set(true);
  }

  executeDelete(): void {
    const device = this.deviceToDelete();
    if (!device?._id) return;
    this.deleteLoading.set(true);
    this.deviceService.deleteDevice(device._id).subscribe({
      next: () => {
        this.devices.update((list) => list.filter((d) => d._id !== device._id));
        this.totalRecords.update((n) => Math.max(0, n - 1));
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

  // ── Helpers ───────────────────────────────────────────────────────────────────
  private emptyForm(): DeviceFormPayload {
    return { name: '', username: '', email: '', phone: '', street: '', company: '', latitude: null, longitude: null, imageFile: null };
  }

  isFormValid(): boolean {
    return !!(
      this.formData.name?.trim() &&
      this.formData.username?.trim() &&
      this.formData.email?.trim() &&
      this.formData.phone?.trim() &&
      this.formData.street?.trim() &&
      this.formData.company?.trim()
    );
  }
}
