import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Devices } from './pages/devices/devices';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: Dashboard,
  },
  {
    path: 'devices',
    component: Devices,
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
