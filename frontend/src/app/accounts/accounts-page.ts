import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Customer } from '../models/banking.models';
import { BankingApi, describeHttpError, responseText } from '../services/banking-api';

@Component({
  selector: 'app-accounts-page',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './accounts-page.html',
})
export class AccountsPage {
  private readonly api = inject(BankingApi);
  private readonly destroyRef = inject(DestroyRef);
  private loadedMobile = '';

  readonly busy = signal(false);
  readonly notice = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);
  readonly record = signal<Customer | null>(null);
  readonly confirmDelete = signal(false);

  readonly createForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(30)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(80)],
    }),
    mobileNumber: mobileControl(),
  });

  readonly findForm = new FormGroup({
    mobileNumber: mobileControl(),
  });

  readonly editForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(30)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(80)],
    }),
    mobileNumber: mobileControl(),
    accountNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{10}$/)],
    }),
    accountType: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(30)],
    }),
    branchAddress: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
  });

  create(): void {
    trimControl(this.createForm.controls.name);
    trimControl(this.createForm.controls.email);
    if (this.createForm.invalid || this.busy()) {
      this.createForm.markAllAsTouched();
      return;
    }
    const value = this.createForm.getRawValue();
    this.busy.set(true);
    this.api
      .createAccount(value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.notice.set({ tone: 'ok', text: responseText(response, 'Account created successfully') });
          this.findForm.controls.mobileNumber.setValue(value.mobileNumber);
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
      .fetchAccount(mobileNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (customer) => {
          this.busy.set(false);
          this.show(customer);
        },
        error: (error: HttpErrorResponse) => {
          this.record.set(null);
          this.fail(error);
        },
      });
  }

  update(): void {
    trimControl(this.editForm.controls.name);
    trimControl(this.editForm.controls.email);
    trimControl(this.editForm.controls.accountType);
    trimControl(this.editForm.controls.branchAddress);
    if (this.editForm.invalid || this.busy()) {
      this.editForm.markAllAsTouched();
      return;
    }
    const value = this.editForm.getRawValue();
    this.busy.set(true);
    this.api
      .updateAccount({
        name: value.name,
        email: value.email,
        mobileNumber: value.mobileNumber,
        accountsDto: {
          accountNumber: Number(value.accountNumber),
          accountType: value.accountType,
          branchAddress: value.branchAddress,
        },
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
      .deleteAccount(this.loadedMobile)
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

  private show(customer: Customer): void {
    this.record.set(customer);
    this.loadedMobile = customer.mobileNumber;
    this.editForm.setValue({
      name: customer.name,
      email: customer.email,
      mobileNumber: customer.mobileNumber,
      accountNumber: customer.accountsDto ? String(customer.accountsDto.accountNumber) : '',
      accountType: customer.accountsDto?.accountType ?? '',
      branchAddress: customer.accountsDto?.branchAddress ?? '',
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

function trimControl(control: FormControl<string>): void {
  control.setValue(control.value.trim());
}
