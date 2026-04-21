import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  userName = 'User';
  userRole = 'Agent';
  navItems: NavItem[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name || user.email.split('@')[0];
      
      if (user.role === 'super_admin') {
        this.userRole = 'Super Admin';
        this.navItems = [
          { label: 'Dashboard', icon: 'pi-home', route: '/super-admin/dashboard' },
          { label: 'Map', icon: 'pi-map-marker', route: '/super-admin/map' },
          { label: 'Admins', icon: 'pi-shield', route: '/super-admin/admins' },
          { label: 'Users', icon: 'pi-users', route: '/super-admin/users' },
          { label: 'Devices', icon: 'pi-server', route: '/super-admin/devices' }
        ];
      } else if (user.role === 'admin') {
        this.userRole = 'Admin';
        this.navItems = [
          { label: 'Dashboard', icon: 'pi-home', route: '/admin/dashboard' },
          { label: 'Map', icon: 'pi-map-marker', route: '/admin/map' },
          { label: 'Users', icon: 'pi-users', route: '/admin/users' },
          { label: 'Devices', icon: 'pi-server', route: '/admin/devices' }
        ];
      } else {
        // Fallback for some reason
        this.navItems = [
          { label: 'Map', icon: 'pi-map-marker', route: '/map' }
        ];
      }
    }
  }

  toggle() {
    this.toggleCollapse.emit();
  }

  closeOnLinkClick() {
    if (!this.isCollapsed) {
      if (window.innerWidth <= 768) {
        this.toggleCollapse.emit();
      }
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}
 