import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Device {
    id?: string;
    name: string;
    username: string;
    email: string;
    street: string;
    phone: string;
    company: string;
}

@Injectable({
    providedIn: 'root',
})
export class DeviceService {
    private baseUrl = 'https://699c4c1c110b5b738cc24bdb.mockapi.io/device';

    constructor(private http: HttpClient) { }

    getDevices(): Observable<Device[]> {
        return this.http.get<Device[]>(this.baseUrl);
    }

    addDevice(data: Device): Observable<Device> {
        return this.http.post<Device>(this.baseUrl, data);
    }

    updateDevice(id: string, data: Device): Observable<Device> {
        return this.http.put<Device>(`${this.baseUrl}/${id}`, data);
    }

    deleteDevice(id: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${id}`);
    }
}
