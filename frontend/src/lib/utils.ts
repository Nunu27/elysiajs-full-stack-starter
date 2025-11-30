import { clsx, type ClassValue } from 'clsx';
import type { Treaty } from '@elysiajs/eden';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import { redirect } from '@tanstack/react-router';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BaseResponse {
  success: boolean;
  message?: string;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An error occurred';
}

export function getErrorMessageFromApi(error: unknown) {
  return (error as BaseResponse).message || 'An error occurred';
}

interface ErrorHandlerConfig<TData> {
  showToast?: {
    onSuccess?: boolean;
    onError?: boolean;
  };
  callback?: (result: TData) => void | Promise<void>;
}

export async function errorHandler<
  T extends Record<number, unknown>,
  TResponse extends Treaty.TreatyResponse<T>,
  TData extends Treaty.Data<TResponse>,
>(promise: Promise<TResponse>, config: ErrorHandlerConfig<TData> = {}) {
  const { showToast = {}, callback } = config;

  try {
    const { data, error } = await promise;

    if (error) {
      if (
        error.status === 401 &&
        (data as BaseResponse).message === 'Unauthorized'
      ) {
        await cookieStore.delete('session');
        toast.error('Session expired');
        return redirect({ to: '/login' });
      }
      throw new Error(getErrorMessageFromApi(error.value));
    }

    if (showToast.onSuccess ?? true) {
      const response = data as BaseResponse;

      if (response.message) {
        toast.success(response.message);
      }
    }

    await callback?.(data as TData);
  } catch (error) {
    if (showToast.onError ?? true) {
      toast.error(getErrorMessage(error));
    }
  }
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

export function getTitleFromBreadcrumbs(breadcrumbs: { title: string }[]) {
  return breadcrumbs.reduce((acc, curr) => curr.title + ' - ' + acc, 'Elysia Full-Stack Starter');
}
