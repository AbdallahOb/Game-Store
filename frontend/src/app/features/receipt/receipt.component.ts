import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { Order } from '../../core/models';
import { OrderService } from '../../core/order.service';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './receipt.component.html',
  styleUrl: './receipt.component.css',
})
export class ReceiptComponent implements OnInit {
  order = signal<Order | null>(null);
  notFound = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Receipt · Game Store');
    // Always re-fetches by id from the API, rather than trusting data passed via the
    // router - so a direct link or a page refresh on this route still shows the receipt.
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.orderService.get(id).subscribe({
      next: (order) => this.order.set(order),
      error: () => this.notFound.set(true),
    });
  }

  backToProducts(): void {
    this.router.navigate(['/products']);
  }
}
