export interface Device {
  _id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  street: string;
  company: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  createdBy?: { name: string; email: string };
  ownerId?: string;
  createdAt: string;
}

export interface DeviceListResponse {
  success: boolean;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  data: Device[];
}

export interface DeviceSingleResponse {
  success: boolean;
  message?: string;
  data: Device;
}

export interface GenericResponse {
  success: boolean;
  message: string;
}
