/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Treaty } from '@elysiajs/eden';
import type { PaginatedResponse } from '@frontend/types/pagination';

export type ExtractPaginationData<T> = T extends {
  post: (...args: any[]) => Promise<{ data?: infer R; error?: any }>;
}
  ? R extends { data: { items: (infer Item)[]; pageInfo: any } }
    ? Item
    : never
  : never;

export type ExtractPaginationResponse<T> = T extends {
  post: (...args: any[]) => Promise<{ data?: infer R; error?: any }>;
}
  ? R extends { data: infer Data }
    ? Data extends PaginatedResponse<any>
      ? Data
      : never
    : never
  : never;

export type ExtractFields<T> = T extends {
  post: (params: infer P) => any;
}
  ? P extends { sortBy?: infer S }
    ? S extends string
      ? S
      : string
    : string
  : string;

export type ExtractFilters<T> = T extends {
  post: (params: infer P) => any;
}
  ? P extends { filters?: infer F }
    ? F
    : never
  : never;

export type TreatyData<T extends (...args: any[]) => Promise<any>> =
  Treaty.Data<T>;

export type TreatyResponse<T> = Treaty.TreatyResponse<{
  200: T;
}>;
