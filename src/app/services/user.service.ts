import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DeviceSingleResponse } from '../models/device.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  getMyVehicle(): Observable<DeviceSingleResponse> {
    return this.http.get<DeviceSingleResponse>(`${this.baseUrl}/my-vehicle`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  addMyVehicle(formData: FormData): Observable<DeviceSingleResponse> {
    return this.http.post<DeviceSingleResponse>(`${this.baseUrl}/my-vehicle`, formData).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateMyLocation(lat: number, lng: number): Observable<DeviceSingleResponse> {
    return this.http.put<DeviceSingleResponse>(`${this.baseUrl}/my-vehicle`, { lat, lng }).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
