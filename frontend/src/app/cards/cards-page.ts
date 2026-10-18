import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CardDetails } from '../models/banking.models';
import { BankingApi, describeHttpError, responseText } from '../services/banking-api';

@Component({
  selector: 'app-cards-page',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './cards-page.html',
})
export class CardsPage {
  private readonly api = inject(BankingApi);
  private readonly destroyRef = inject(DestroyRef);
  private loadedMobile = '';

  readonly busy = signal(false);
  readonly notice = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);
  readonly record = signal<CardDetails | null>(null);
  readonly confirmDelete = signal(false);

  readonly createForm = new FormGroup({
    mobileNumber: mobileControl(),
  });

  readonly findForm = new FormGroup({
    mobileNumber: mobileControl(),
  });

  readonly editForm = new FormGroup({
    mobileNumber: mobileControl(),
    cardNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{12}$/)],
    }),
    cardType: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(40)],
    }),
    totalLimit: amountControl(1),
    amountUsed: amountControl(0),
    availableAmount: amountControl(0),
  });

  groupDigits(value: string): string {
    return value.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
  }

  format(value: number): string {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  }

  share(part: number, total: number): number {
    if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
  }

  create(): void {
    if (this.createForm.invalid || this.busy()) {
      this.createForm.markAllAsTouched();
      return;
    }
    const mobileNumber = this.createForm.controls.mobileNumber.value;
    this.busy.set(true);
    this.api
      .createCard(mobileNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.notice.set({ tone: 'ok', text: responseText(response, 'Card created successfully') });
          this.findForm.controls.mobileNumber.setValue(mobileNumber);
          this.fetch(true);
        },
        error: (error: HttpErrorResponse) => this.fail(error),
      });
  }

  fetch(force = false): void {
    if (this.findForm.invalid || (!force && this.busy())) {
      this.findForm.markAllAsTouched();
      if (force) {
        this.busy.set(false);
      }
      return;
    }
    const mobileNumber = this.findForm.controls.mobileNumber.value;
    this.busy.set(true);
    this.confirmDelete.set(false);
    this.api
      .fetchCard(mobileNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (card) => {
          this.busy.set(false);
          this.record.set(card);
          this.loadedMobile = card.mobileNumber;
          this.editForm.setValue({
            mobileNumber: card.mobileNumber,
            cardNumber: card.cardNumber,
            cardType: card.cardType,
            totalLimit: card.totalLimit,
            amountUsed: card.amountUsed,
            availableAmount: card.availableAmount,
          });
        },
        error: (error: HttpErrorResponse) => {
          this.record.set(null);
          this.fail(error);
        },
      });
  }

  update(): void {
    trimControl(this.editForm.controls.cardType);
    if (this.editForm.invalid || this.busy()) {
      this.editForm.markAllAsTouched();
      return;
    }
    const value = this.editForm.getRawValue();
    this.busy.set(true);
    this.api
      .updateCard({
        mobileNumber: value.mobileNumber,
        cardNumber: value.cardNumber,
        cardType: value.cardType,
        totalLimit: Number(value.totalLimit),
        amountUsed: Number(value.amountUsed),
        availableAmount: Number(value.availableAmount),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.notice.set({ tone: 'ok', text: responseText(response, 'Request processed successfully') });
          this.findForm.controls.mobileNumber.setValue(value.mobileNumber);
          this.fetch(true);
        },
        error: (error: HttpErrorResponse) => this.fail(error),
      });
  }

  remove(): void {
    if (!this.loadedMobile || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.api
      .deleteCard(this.loadedMobile)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.busy.set(false);
          this.record.set(null);
          this.confirmDelete.set(false);
          this.loadedMobile = '';
          this.editForm.reset();
          this.notice.set({ tone: 'ok', text: responseText(response, 'Request processed successfully') });
        },
        error: (error: HttpErrorResponse) => this.fail(error),
      });
  }

  private fail(error: HttpErrorResponse): void {
    this.busy.set(false);
    this.notice.set({ tone: 'error', text: describeHttpError(error).message });
  }
}

function mobileControl(): FormControl<string> {
  return new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[0-9]{10}$/)],
  });
}

function amountControl(min: number): FormControl<number | null> {
  return new FormControl<number | null>(null, { validators: [wholeNumber(min)] });
}

function wholeNumber(min: number): ValidatorFn {
  return (control) => {
    const value: unknown = control.value;
    if (value === null || value === '') {
      return { required: true };
    }
    const amount = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(amount) || amount < min) {
      return { whole: true };
    }
    return null;
  };
}

function trimControl(control: FormControl<string>): void {
  control.setValue(control.value.trim());
}
