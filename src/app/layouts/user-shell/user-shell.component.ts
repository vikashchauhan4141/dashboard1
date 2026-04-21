import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './user-shell.component.html',
  styleUrl: './user-shell.component.scss'
})
export class UserShellComponent implements OnInit {
  userName = 'User';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name || user.email.split('@')[0];
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}
