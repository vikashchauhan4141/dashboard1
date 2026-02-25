import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';


interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  imports: [CommonModule,RouterLink,RouterLinkActive], 
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'bi-speedometer2', route: '/dashboard' },
    { label: 'Map', icon: 'bi-globe', route: '/map' },
    { label: 'Installation', icon: 'bi-tools', route: '/installation' },
    { label: 'Devices', icon: 'bi-phone', route: '/devices' },
    { label: 'Reports', icon: 'bi-file-earmark-text', route: '/reports' },
    { label: 'History Replay', icon: 'bi-clock-history', route: '/history-replay' },
    { label: 'Notifications', icon: 'bi-bell', route: '/notifications' },
    { label: 'Geofence', icon: 'bi-geo-alt', route: '/geofence' },
  ];
}
