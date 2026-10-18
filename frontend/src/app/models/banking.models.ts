export interface AccountDetails {
  accountNumber: number;
  accountType: string;
  branchAddress: string;
}

export interface Customer {
  name: string;
  email: string;
  mobileNumber: string;
  accountsDto: AccountDetails | null;
}

export interface CardDetails {
  mobileNumber: string;
  cardNumber: string;
  cardType: string;
  totalLimit: number;
  amountUsed: number;
  availableAmount: number;
}

export interface LoanDetails {
  mobileNumber: string;
  loanNumber: string;
  loanType: string;
  totalLoan: number;
  amountPaid: number;
  outstandingAmount: number;
}

export interface ServiceResponse {
  statusCode: string;
  statusMsg: string;
}

export type PanelStatus = 'idle' | 'loading' | 'found' | 'missing' | 'error';

export interface PanelState<T> {
  status: PanelStatus;
  data: T | null;
  message: string;
}

export function idlePanel<T>(): PanelState<T> {
  return { status: 'idle', data: null, message: '' };
}
