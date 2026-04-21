export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  photo?: string;
  phone?: string;
  street?: string;
  company?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    _id?: string;
    name: string;
    email: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data: User;
}

export interface UserListResponse {
  success: boolean;
  data: User[];
}

export interface SuperAdminStatsResponse {
  success: boolean;
  data: {
    totalAdmins: number;
    totalUsers: number;
    totalDevices: number;
  };
}
