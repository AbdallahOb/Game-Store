export type Location = 'JO' | 'SA';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: string;
  location: Location;
}

export interface PaginatedResponse<T> {
  count: number;
  page: number;
  total_pages: number;
  results: T[];
}

export interface Order {
  id: number;
  product: number;
  product_title: string;
  price: string;
  location: Location;
  buyer: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
