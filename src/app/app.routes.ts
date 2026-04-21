import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

// Layouts
import { AdminShellComponent } from './layouts/admin-shell/admin-shell.component';
import { UserShellComponent } from './layouts/user-shell/user-shell.component';

// Auth / Public
import { LoginComponent } from './pages/login/login.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';

// Super Admin
import { SuperAdminDashboardComponent } from './pages/super-admin/dashboard/super-admin-dashboard.component';
import { AdminManagementComponent } from './pages/super-admin/admins/admin-management.component';
import { AllUsersComponent } from './pages/super-admin/users/all-users.component';

// Admin
import { AdminDashboardComponent } from './pages/admin/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/admin/users/admin-users.component';

// Devices Component (Original Elegant UI)
import { Devices as DevicesComponent } from './pages/devices/devices';

// User / Map
import { MapComponent } from './pages/map/map.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },

  // ── SUPER ADMIN ROUTES ───────────────────────────────────────────
  { 
    path: 'super-admin',
    component: AdminShellComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['super_admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SuperAdminDashboardComponent },
      { path: 'map', component: MapComponent },
      { path: 'admins', component: AdminManagementComponent },
      { path: 'users', component: AllUsersComponent },
      { path: 'devices', component: DevicesComponent }
    ]
  },

  // ── ADMIN ROUTES ──────────────────────────────────────────────────
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'map', component: MapComponent },
      { path: 'devices', component: DevicesComponent },
      { path: 'users', component: AdminUsersComponent }
    ]
  },

  // ── USER ROUTES (Map) ─────────────────────────────────────────────
  {
    path: 'map',
    component: UserShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: MapComponent }
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'login' }
];
