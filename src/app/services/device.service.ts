import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ── Interfaces matching the API response ─────────────────────────────────────

export interface Device {
  _id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  street: string;
  company: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Device[];
}

export interface DeviceSingleResponse {
  success: boolean;
  data: Device;
}

export interface DeviceMutationResponse {
  success: boolean;
  message: string;
  data: Device;
}

export interface DeviceDeleteResponse {
  success: boolean;
  message: string;
}

// ── Payload for create / update (text fields only) ───────────────────────────
export interface DeviceFormPayload {
  name: string;
  username: string;
  email: string;
  phone: string;
  street: string;
  company: string;
  latitude?: number | null;
  longitude?: number | null;
  imageFile?: File | null;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly baseUrl = `${environment.apiUrl}/devices`;
  constructor(private http: HttpClient) {}

  // ── GET  /api/devices  (with optional search + pagination) ─────────────────
  getDevices(search = '', page = 1, limit = 10): Observable<DeviceListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<DeviceListResponse>(this.baseUrl, { params });
  }

  // ── GET  /api/devices/:id ───────────────────────────────────────────────────
  getDevice(id: string): Observable<Device> {
    return this.http
      .get<DeviceSingleResponse>(`${this.baseUrl}/${id}`)
      .pipe(map((r) => r.data));
  }

  // ── POST /api/devices  (multipart/form-data — image optional) ──────────────
  addDevice(payload: DeviceFormPayload): Observable<Device> {
    const fd = this.buildFormData(payload);
    return this.http
      .post<DeviceMutationResponse>(this.baseUrl, fd)
      .pipe(map((r) => r.data));
  }

  // ── PUT  /api/devices/:id  (multipart/form-data — image optional) ──────────
  updateDevice(id: string, payload: DeviceFormPayload): Observable<Device> {
    const fd = this.buildFormData(payload);
    return this.http
      .put<DeviceMutationResponse>(`${this.baseUrl}/${id}`, fd)
      .pipe(map((r) => r.data));
  }

  // ── DELETE /api/devices/:id ─────────────────────────────────────────────────
  deleteDevice(id: string): Observable<DeviceDeleteResponse> {
    return this.http.delete<DeviceDeleteResponse>(`${this.baseUrl}/${id}`);
  }

  // ── DELETE /api/devices/:id/image  (remove image, keep device) ─────────────
  removeDeviceImage(id: string): Observable<DeviceDeleteResponse> {
    return this.http.delete<DeviceDeleteResponse>(`${this.baseUrl}/${id}/image`);
  }

  // ── Helper: build FormData from payload ────────────────────────────────────
  private buildFormData(payload: DeviceFormPayload): FormData {
    const fd = new FormData();
    fd.append('name', payload.name);
    fd.append('username', payload.username);
    fd.append('email', payload.email);
    fd.append('phone', payload.phone);
    fd.append('street', payload.street);
    fd.append('company', payload.company);
    if (payload.latitude != null) fd.append('latitude', String(payload.latitude));
    if (payload.longitude != null) fd.append('longitude', String(payload.longitude));
    if (payload.imageFile) {
      fd.append('image', payload.imageFile, payload.imageFile.name);
    }
    return fd;
  }
}
