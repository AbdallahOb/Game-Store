import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { ImportantComponent } from './features/important/important.component';
import { LoginComponent } from './features/login/login.component';
import { ProductDetailComponent } from './features/products/product-detail/product-detail.component';
import { ProductListComponent } from './features/products/product-list/product-list.component';
import { ReceiptComponent } from './features/receipt/receipt.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: 'login', component: LoginComponent },
  { path: 'products', component: ProductListComponent, canActivate: [authGuard] },
  { path: 'products/:id', component: ProductDetailComponent, canActivate: [authGuard] },
  { path: 'orders/:id/receipt', component: ReceiptComponent, canActivate: [authGuard] },
  { path: 'important', component: ImportantComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'products' },
];
