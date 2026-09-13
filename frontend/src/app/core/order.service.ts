import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-config';
import { Order } from './models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  buy(productId: number): Observable<Order> {
    return this.http.post<Order>(`${API_BASE_URL}/orders/`, { product_id: productId });
  }

  get(id: number): Observable<Order> {
    return this.http.get<Order>(`${API_BASE_URL}/orders/${id}/`);
  }
}
