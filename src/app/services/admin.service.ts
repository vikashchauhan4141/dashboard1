import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UserResponse, UserListResponse } from '../models/user.model';
import { DeviceListResponse, DeviceSingleResponse, GenericResponse } from '../models/device.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(`${this.baseUrl}/users`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  createUser(data: any): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/users`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateUser(id: string, data: any): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/users/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  deleteUser(id: string): Observable<GenericResponse> {
    return this.http.delete<GenericResponse>(`${this.baseUrl}/users/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getDevices(): Observable<DeviceListResponse> {
    return this.http.get<DeviceListResponse>(`${this.baseUrl}/devices`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  createDevice(formData: FormData): Observable<DeviceSingleResponse> {
    return this.http.post<DeviceSingleResponse>(`${this.baseUrl}/devices`, formData).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateDevice(id: string, formData: FormData): Observable<DeviceSingleResponse> {
    return this.http.put<DeviceSingleResponse>(`${this.baseUrl}/devices/${id}`, formData).pipe(
      catchError(err => throwError(() => err))
    );
  }

  deleteDevice(id: string): Observable<GenericResponse> {
    return this.http.delete<GenericResponse>(`${this.baseUrl}/devices/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  removeDeviceImage(id: string): Observable<GenericResponse> {
    return this.http.delete<GenericResponse>(`${this.baseUrl}/devices/${id}/image`).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
