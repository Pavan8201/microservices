import { Routes } from '@angular/router';
import { AccountsPage } from './accounts/accounts-page';
import { CardsPage } from './cards/cards-page';
import { LoansPage } from './loans/loans-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'accounts' },
  { path: 'accounts', component: AccountsPage },
  { path: 'cards', component: CardsPage },
  { path: 'loans', component: LoansPage },
  { path: '**', redirectTo: 'accounts' },
];
