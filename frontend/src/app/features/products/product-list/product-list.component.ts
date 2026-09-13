import { Component, OnInit, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { coverColorFor, coverIconFor } from '../../../core/product-cover';
import { Location, Product } from '../../../core/models';
import { ProductService } from '../../../core/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [MatCardModule, MatButtonToggleModule, MatPaginatorModule, MatIconModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  products = signal<Product[]>([]);
  totalCount = signal(0);
  pageIndex = signal(0);
  pageSize = signal(10);
  locationFilter = signal<Location | null>(null);
  loading = signal(false);

  coverColorFor = coverColorFor;
  coverIconFor = coverIconFor;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Store · Game Store');
    // The location filter lives in the URL (?location=JO), not just a local signal - that
    // way the filtered view is bookmarkable/shareable and survives a page refresh.
    this.route.queryParamMap.subscribe((params) => {
      const location = params.get('location') as Location | null;
      this.locationFilter.set(location);
      this.pageIndex.set(0);
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService
      .list({
        page: this.pageIndex() + 1,
        pageSize: this.pageSize(),
        location: this.locationFilter(),
      })
      .subscribe({
        next: (response) => {
          this.products.set(response.results);
          this.totalCount.set(response.count);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
  }

  onLocationChange(location: Location | null): void {
    // Navigates (updating the URL) instead of setting locationFilter directly - the
    // queryParamMap subscription above is what actually reacts to it and reloads.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { location: location ?? null },
    });
  }

  openProduct(id: number): void {
    this.router.navigate(['/products', id]);
  }
}
