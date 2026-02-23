import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
}

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'bi-speedometer2', active: true },
    { label: 'Map', icon: 'bi-globe' },
    { label: 'Installation', icon: 'bi-tools' },
    { label: 'Devices', icon: 'bi-phone' },
    { label: 'Reports', icon: 'bi-file-earmark-text' },
    { label: 'History Replay', icon: 'bi-clock-history' },
    { label: 'Notifications', icon: 'bi-bell' },
    { label: 'Geofence', icon: 'bi-geo-alt' },
  ];
}
