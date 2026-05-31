import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DeviceService, Device } from '../../services/device.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import * as L from 'leaflet';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, ToastModule],
  providers: [MessageService],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: false }) mapEl!: ElementRef;

  private map!: L.Map;
  private markersLayer = L.layerGroup();

  devices     = signal<Device[]>([]);
  loading     = signal<boolean>(true);
  searchQuery = signal<string>('');
  selected    = signal<Device | null>(null);
  tempCoords  = signal<{ lat: number; lng: number } | null>(null);

  isUserRole = false;
  displayAddVehicle = false;
  vehicleForm: FormGroup;
  saving = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  private destroy$ = new Subject<void>();

  trackableDevices = computed(() =>
    this.devices().filter(d => d.latitude != null && d.longitude != null)
  );

  filteredDevices = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.trackableDevices();
    return this.trackableDevices().filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.username.toLowerCase().includes(q) ||
      (d.company ?? '').toLowerCase().includes(q)
    );
  });

  constructor(
    private deviceService: DeviceService,
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.vehicleForm = this.fb.group({
      name: ['', Validators.required],
      lat: [null, Validators.required],
      lng: [null, Validators.required]
    });

    // Automatically re-draw map markers when devices, filter, selection, or tempCoords change reactively
    effect(() => {
      this.renderMarkers();
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isUserRole = user?.role === 'user';

    // Start 15-second background polling
    timer(0, 15000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Only poll if no pending user edits or dialogs are open
        if (!this.tempCoords() && !this.displayAddVehicle && !this.saving) {
          if (this.isUserRole) {
            this.pollMyVehicle();
          } else {
            this.pollDevices();
          }
        }
      });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDevices(): void {
    this.loading.set(true);
    this.pollDevices();
  }

  pollDevices(): void {
    this.deviceService.getDevices('', 1, 100).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.devices.set(res.data);
        this.loading.set(false);

        // Update active selection marker if coordinates changed in backend
        const selected = this.selected();
        if (selected) {
          const updated = res.data.find(d => d._id === selected._id);
          if (updated && (updated.latitude !== selected.latitude || updated.longitude !== selected.longitude)) {
            this.selectDevice(updated, false);
          }
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Failed to load devices:', err);
      },
    });
  }

  loadMyVehicle(): void {
    this.loading.set(true);
    this.pollMyVehicle();
  }

  pollMyVehicle(): void {
    this.userService.getMyVehicle().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.devices.set([res.data]);

        const selected = this.selected();
        if (!selected && res.data.latitude && res.data.longitude && this.map) {
          this.selectDevice(res.data);
        } else if (selected && (res.data.latitude !== selected.latitude || res.data.longitude !== selected.longitude)) {
          this.selectDevice(res.data, false);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.displayAddVehicle = true;
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load vehicle' });
        }
      }
    });
  }

  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement).setView([20, 78], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);

    if (this.isUserRole) {
      this.map.on('dblclick', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        this.tempCoords.set({ lat, lng });
      });
      this.map.doubleClickZoom.disable();
    }
    
    // Initial draw
    this.renderMarkers();

    // Attempt auto-flight if device already loaded and selected from logic
    const selected = this.selected();
    if (selected && selected.latitude && selected.longitude) {
      this.selectDevice(selected);
    }
  }

  renderMarkers(): void {
    if (!this.map) return;
    this.markersLayer.clearLayers();

    const selectedDevice = this.selected();
    const list = this.filteredDevices();

    list.forEach(device => {
      const lat = device.latitude;
      const lng = device.longitude;
      if (lat == null || lng == null) return;

      const isSelected = !!selectedDevice && selectedDevice._id === device._id;

      const icon = L.divIcon({
        className: `custom-marker ${isSelected ? 'selected' : ''}`,
        html: `<div class="marker-pin ${isSelected ? 'active-pin' : ''}"></div><div class="marker-pulse ${isSelected ? '' : 'hidden-pulse'}"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      });

      const isDraggable = this.isUserRole && isSelected;

      const marker = L.marker([lat, lng], { 
        icon, 
        draggable: isDraggable 
      }).addTo(this.markersLayer);

      marker.bindTooltip(device.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -40]
      });

      marker.on('click', () => {
        this.selectDevice(device, false);
      });

      if (isDraggable) {
        marker.on('dragend', (event) => {
          const position = event.target.getLatLng();
          this.tempCoords.set({ lat: position.lat, lng: position.lng });
        });
      }
    });

    // Temp marker for location update
    const temp = this.tempCoords();
    if (this.isUserRole && temp) {
      const icon = L.divIcon({
        className: 'custom-marker temp',
        html: '<div class="marker-pin temp-pin"></div><div class="marker-pulse temp-pulse"></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      });
      const marker = L.marker([temp.lat, temp.lng], { icon, draggable: true }).addTo(this.markersLayer);
      marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        this.tempCoords.set({ lat: position.lat, lng: position.lng });
      });
    }
  }

  selectDevice(device: Device, shouldFly = true): void {
    this.selected.set(device);
    this.tempCoords.set(null);

    const lat = device.latitude;
    const lng = device.longitude;

    if (!lat || !lng) return;

    if (shouldFly && this.map) {
      this.map.flyTo([lat, lng], 12, { animate: true, duration: 1.4 });
    }
  }

  saveLocationUpdates(): void {
    const coords = this.tempCoords();
    if (!coords) return;

    this.saving = true;
    this.userService.updateMyLocation(coords.lat, coords.lng)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.tempCoords.set(null);
          this.devices.set([res.data]);
          this.selectDevice(res.data);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Location updated successfully' });
        },
        error: (err) => {
          this.saving = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update location' });
        }
      });
  }

  resetLocationUpdates(): void {
    this.tempCoords.set(null);
    const selected = this.selected();
    if (selected) {
      this.selectDevice(selected);
    }
  }

  closeCard(): void {
    this.selected.set(null);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => (this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);
  }

  saveVehicle(): void {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }
    
    this.saving = true;
    const fd = new FormData();
    fd.append('name', this.vehicleForm.value.name);
    fd.append('lat', this.vehicleForm.value.lat.toString());
    fd.append('lng', this.vehicleForm.value.lng.toString());
    if (this.selectedFile) {
      fd.append('image', this.selectedFile);
    }

    this.userService.addMyVehicle(fd).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.saving = false;
        this.displayAddVehicle = false;
        this.devices.set([res.data]);
        this.selectDevice(res.data);
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to add vehicle' });
      }
    });
  }
}
