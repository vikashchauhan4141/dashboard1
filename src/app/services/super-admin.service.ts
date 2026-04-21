import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User, UserResponse, UserListResponse, SuperAdminStatsResponse } from '../models/user.model';
import { DeviceListResponse } from '../models/device.model';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private readonly baseUrl = `${environment.apiUrl}/super-admin`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<SuperAdminStatsResponse> {
    return this.http.get<SuperAdminStatsResponse>(`${this.baseUrl}/stats`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getAdmins(): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(`${this.baseUrl}/admins`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getAdminById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/admins/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  createAdmin(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/admins`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateAdmin(id: string, data: Partial<User>): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/admins/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  deleteAdmin(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/admins/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getUsers(): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(`${this.baseUrl}/users`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getDevices(): Observable<DeviceListResponse> {
    return this.http.get<DeviceListResponse>(`${this.baseUrl}/devices`).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
