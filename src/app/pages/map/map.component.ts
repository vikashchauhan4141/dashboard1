import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ElementRef, ViewChild, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService, Device } from '../../services/device.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  /** Devices that have valid lat/lng coordinates */
  trackableDevices = computed(() =>
    this.devices().filter(d => d.latitude != null && d.longitude != null)
  );

  /** Client-side search over name, username, company */
  filteredDevices = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.trackableDevices();
    return this.trackableDevices().filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.username.toLowerCase().includes(q) ||
      (d.company ?? '').toLowerCase().includes(q)
    );
  });

  constructor(private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  // ── Data ──────────────────────────────────────────────────────────────────────
  loadDevices(): void {
    this.loading.set(true);
    // Fetch all devices (large limit) — map page needs full list for filtering
    this.deviceService.getDevices('', 1, 100).subscribe({
      next: (res) => {
        this.devices.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load devices:', err);
        this.loading.set(false);
      },
    });
  }

  // ── Map ───────────────────────────────────────────────────────────────────────
  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement).setView([20, 78], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
        '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
  }

  // ── Select device → fly to marker ────────────────────────────────────────────
  selectDevice(device: Device): void {
    this.selected.set(device);

    const lat = device.latitude!;
    const lng = device.longitude!;

    this.markersLayer.clearLayers();

    const icon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="marker-pin"></div><div class="marker-pulse"></div>',
      iconSize: [30, 42],
      iconAnchor: [15, 42],
    });

    L.marker([lat, lng], { icon }).addTo(this.markersLayer);

    this.map.flyTo([lat, lng], 8, { animate: true, duration: 1.4 });
  }

  closeCard(): void {
    this.selected.set(null);
  }
}
