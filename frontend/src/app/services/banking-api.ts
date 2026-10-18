import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CardDetails, Customer, LoanDetails, ServiceResponse } from '../models/banking.models';

@Injectable({ providedIn: 'root' })
export class BankingApi {
  private readonly http = inject(HttpClient);

  createAccount(customer: Pick<Customer, 'name' | 'email' | 'mobileNumber'>): Observable<ServiceResponse> {
    return this.http.post<ServiceResponse>('/accounts-api/api/create', {
      name: customer.name,
      email: customer.email,
      mobileNumber: customer.mobileNumber,
    });
  }

  fetchAccount(mobileNumber: string): Observable<Customer> {
    return this.http.get<Customer>('/accounts-api/api/fetch', {
      params: { mobileNumber },
    });
  }

  updateAccount(customer: Customer): Observable<ServiceResponse> {
    return this.http.put<ServiceResponse>('/accounts-api/api/update', customer);
  }

  deleteAccount(mobileNumber: string): Observable<ServiceResponse> {
    return this.http.delete<ServiceResponse>('/accounts-api/api/delete', {
      params: { mobileNumber },
    });
  }

  createCard(mobileNumber: string): Observable<ServiceResponse> {
    return this.http.post<ServiceResponse>('/cards-api/api/create', null, {
      params: { mobileNumber },
    });
  }

  fetchCard(mobileNumber: string): Observable<CardDetails> {
    return this.http.get<CardDetails>('/cards-api/api/fetch', {
      params: { mobileNumber },
    });
  }

  updateCard(card: CardDetails): Observable<ServiceResponse> {
    return this.http.put<ServiceResponse>('/cards-api/api/update', card);
  }

  deleteCard(mobileNumber: string): Observable<ServiceResponse> {
    return this.http.delete<ServiceResponse>('/cards-api/api/delete', {
      params: { mobileNumber },
    });
  }

  createLoan(mobileNumber: string): Observable<ServiceResponse> {
    return this.http.post<ServiceResponse>('/loans-api/api/create', null, {
      params: { mobileNumber },
    });
  }

  fetchLoan(mobileNumber: string): Observable<LoanDetails> {
    return this.http.get<LoanDetails>('/loans-api/api/fetch', {
      params: { mobileNumber },
    });
  }

  updateLoan(loan: LoanDetails): Observable<ServiceResponse> {
    return this.http.put<ServiceResponse>('/loans-api/api/update', loan);
  }

  deleteLoan(mobileNumber: string): Observable<ServiceResponse> {
    return this.http.delete<ServiceResponse>('/loans-api/api/delete', {
      params: { mobileNumber },
    });
  }
}

export function responseText(response: ServiceResponse, fallback: string): string {
  const text = response.statusMsg?.trim();
  return text ? text : fallback;
}

export function describeHttpError(error: HttpErrorResponse): {
  missing: boolean;
  message: string;
} {
  if (error.status === 0) {
    return {
      missing: false,
      message: 'The service did not respond. Start it and try again.',
    };
  }

  const body: unknown = error.error;
  if (error.status === 404) {
    return {
      missing: true,
      message: readMessage(body) ?? 'No record found for this mobile number.',
    };
  }

  const message = readMessage(body);
  if (message) {
    return { missing: false, message };
  }

  return { missing: false, message: `Request failed (HTTP ${error.status}).` };
}

function readMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.length === 0 || trimmed.startsWith('<')) {
      return null;
    }
    return clip(trimmed);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;
  if (typeof record['errorMessage'] === 'string' && record['errorMessage'].trim().length > 0) {
    return clip(record['errorMessage']);
  }

  if (typeof record['statusMsg'] === 'string' && record['statusMsg'].trim().length > 0) {
    return clip(record['statusMsg']);
  }

  const fieldMessages = Object.values(record).filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );
  if (fieldMessages.length === 0) {
    return null;
  }
  return clip(fieldMessages.join(' '));
}

function clip(value: string): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > 240 ? `${clean.slice(0, 240)}…` : clean;
}
