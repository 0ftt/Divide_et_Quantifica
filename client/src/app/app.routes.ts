import { Routes } from '@angular/router';
import { authGuard, adminGuard } from '$core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadComponent: () =>
      import('$routed/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'broker',
    title: 'Broker',
    canActivate: [authGuard],
    loadComponent: () =>
      import('$routed/broker/broker.page').then((m) => m.BrokerPage),
  },
  {

    path: 'stocks',
    redirectTo: 'broker',
    pathMatch: 'full',
  },
  {
    path: 'history',
    redirectTo: 'broker',
    pathMatch: 'full',
  },
  {
    path: 'reset',
    title: 'Reset password',
    loadComponent: () => import('$routed/reset/reset.page').then((m) => m.ResetPage),
  },
  {
    path: 'admin-panel',
    title: 'Admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('$routed/admin-panel/admin-panel.page').then((m) => m.AdminPanelPage),
  },
  {
    path: 'account-settings',
    title: 'Account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('$routed/account-settings/account-settings.page').then((m) => m.AccountSettingsPage),
  },
  {
    path: 'leaderboard',
    title: 'Leaderboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('$routed/leaderboard/leaderboard.page').then((m) => m.LeaderboardPage),
  },
];
