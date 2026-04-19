import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'devices',
    loadComponent: () =>
      import('./pages/devices/devices').then((m) => m.Devices),
  },
  {
    path: 'map',
    loadComponent: () =>
      import('./pages/map/map.component').then((m) => m.MapComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
