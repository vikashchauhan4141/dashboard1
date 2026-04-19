import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  // ── User (hardcoded — swap with auth service later) ──────────────────────────
  userName = 'AGENT29x';

  navItems: NavItem[] = [
    { label: 'Dashboard',     icon: 'pi-home',         route: '/dashboard'      },
    { label: 'Map',           icon: 'pi-map-marker',          route: '/map'            },
    { label: 'Devices',       icon: 'pi-server',       route: '/devices'        },
  
  ];

  toggle() {
    this.toggleCollapse.emit();
  }

  closeOnLinkClick() {
    if (!this.isCollapsed) {
      this.toggleCollapse.emit();
    }
  }

  onLogout(): void {
    // TODO: Connect to AuthService when auth is implemented
    console.log('Logout triggered');
  }
}
