import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, signal, computed } from '@angular/core';
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
import { Subject } from 'rxjs';
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
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user?.role === 'user') {
      this.isUserRole = true;
      this.loadMyVehicle();
    } else {
      this.loadDevices();
    }
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
    this.deviceService.getDevices('', 1, 100).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.devices.set(res.data);
        this.loading.set(false);
        // Map will not fly instantly, wait for user click
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Failed to load devices:', err);
      },
    });
  }

  loadMyVehicle(): void {
    this.loading.set(true);
    this.userService.getMyVehicle().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.devices.set([res.data]);
        if (res.data.lat && res.data.lng && this.map) {
          this.selectDevice(res.data);
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
    
    // Attempt auto-flight if device already loaded and selected from logic
    const selected = this.selected();
    if (selected && selected.latitude && selected.longitude) {
        this.selectDevice(selected);
    }
  }

  selectDevice(device: Device): void {
    this.selected.set(device);

    const lat = device.latitude;
    const lng = device.longitude;

    if (!lat || !lng) return;

    this.markersLayer.clearLayers();

    const icon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="marker-pin"></div><div class="marker-pulse"></div>',
      iconSize: [30, 42],
      iconAnchor: [15, 42],
    });

    L.marker([lat, lng], { icon }).addTo(this.markersLayer);
    
    if (this.map) {
      this.map.flyTo([lat, lng], 12, { animate: true, duration: 1.4 });
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
