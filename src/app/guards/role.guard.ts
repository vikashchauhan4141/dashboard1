import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const roles: string[] = route.data['roles'] || [];
    const currentUser = this.authService.getCurrentUser();

    if (currentUser && roles.includes(currentUser.role)) {
      return true;
    }
    
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
