import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { coverColorFor, coverIconFor } from '../../../core/product-cover';
import { Product } from '../../../core/models';
import { OrderService } from '../../../core/order.service';
import { ProductService } from '../../../core/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  buying = signal(false);
  errorMessage = signal('');

  coverColorFor = coverColorFor;
  coverIconFor = coverIconFor;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private orderService: OrderService,
    private title: Title
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.get(id).subscribe((product) => {
      this.product.set(product);
      this.title.setTitle(`${product.title} · Game Store`);
    });
  }

  buy(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    this.buying.set(true);
    this.errorMessage.set('');

    this.orderService.buy(product.id).subscribe({
      next: (order) => {
        this.buying.set(false);
        this.router.navigate(['/orders', order.id, 'receipt']);
      },
      error: () => {
        this.buying.set(false);
        this.errorMessage.set('Purchase failed. Please try again.');
      },
    });
  }
}
