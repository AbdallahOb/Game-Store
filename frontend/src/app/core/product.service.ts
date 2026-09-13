import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-config';
import { Location, PaginatedResponse, Product } from './models';

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  location?: Location | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  list(query: ProductQuery): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('page_size', query.pageSize ?? 10);

    if (query.location) {
      params = params.set('location', query.location);
    }

    return this.http.get<PaginatedResponse<Product>>(`${API_BASE_URL}/products/`, { params });
  }

  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${API_BASE_URL}/products/${id}/`);
  }
}
