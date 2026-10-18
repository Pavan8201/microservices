import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountsPage } from './accounts-page';

describe('AccountsPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountsPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('does not create an account when the mobile number is short', () => {
    const fixture = TestBed.createComponent(AccountsPage);
    const page = fixture.componentInstance;
    page.createForm.setValue({
      name: 'Eazy Bytes',
      email: 'tutor@eazybytes.com',
      mobileNumber: '12345',
    });

    page.create();

    http.expectNone(() => true);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Enter a 10-digit mobile number.');
  });

  it('creates an account and then shows the generated record', async () => {
    const fixture = TestBed.createComponent(AccountsPage);
    const page = fixture.componentInstance;
    page.createForm.setValue({
      name: 'Eazy Bytes',
      email: 'tutor@eazybytes.com',
      mobileNumber: '9345432123',
    });

    page.create();

    const created = http.expectOne('/accounts-api/api/create');
    expect(created.request.method).toBe('POST');
    expect(created.request.body).toEqual({
      name: 'Eazy Bytes',
      email: 'tutor@eazybytes.com',
      mobileNumber: '9345432123',
    });
    created.flush({ statusCode: '201', statusMsg: 'Account created successfully' });

    http.expectOne('/accounts-api/api/fetch?mobileNumber=9345432123').flush({
      name: 'Eazy Bytes',
      email: 'tutor@eazybytes.com',
      mobileNumber: '9345432123',
      accountsDto: {
        accountNumber: 3454433243,
        accountType: 'Savings',
        branchAddress: '123 Main Street, New York',
      },
    });

    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Account created successfully');
    expect(text).toContain('Eazy Bytes');
    expect(text).toContain('Savings');
    expect(text).toContain('3454433243');
  });
});
