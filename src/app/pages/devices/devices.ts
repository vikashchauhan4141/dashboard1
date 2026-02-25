import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './devices.html',
  styleUrl: './devices.scss',
})
export class Devices implements OnInit {
  users = signal<User[]>([]);
  loading = signal<boolean>(true);
  globalFilter = signal<string>('');

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.loading.set(false);
      },
    });
  }

  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
}
