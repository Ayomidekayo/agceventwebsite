import { api } from './api';

export interface InitializePaymentPayload {
  purpose: 'DIRECT_SPONSORSHIP' | 'SPONSORSHIP_COMMITMENT';
  enquiryId?: string;
  commitmentId?: string;
  amount: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
}

export interface InitializePaymentResponse {
  success: boolean;
  reference: string;
  authorizationUrl: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  status: string;
  reference: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
}

export interface BankTransferPayload {
  enquiryId: string;
  commitmentId?: string;
  amount: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
  transferSenderName: string;
  transferReference: string;
  transferDate: string;
}

export interface BankTransferResponse {
  success: boolean;
  message: string;
  reference: string;
  status: string;
}

export async function initializePayment(
  payload: InitializePaymentPayload,
): Promise<InitializePaymentResponse> {
  const response = await api.post('/payments/initialize', payload);

  return response.data?.data ?? response.data;
}

export async function verifyPayment(
  reference: string,
): Promise<PaymentVerificationResponse> {
  const response = await api.get(
    `/payments/verify/${encodeURIComponent(reference)}`,
  );

  return response.data?.data ?? response.data;
}

export async function getBankDetails(): Promise<BankDetails> {
  const response = await api.get('/payments/bank-details');

  return response.data?.data ?? response.data;
}

export async function submitBankTransfer(
  payload: BankTransferPayload,
): Promise<BankTransferResponse> {
  const response = await api.post(
    '/payments/bank-transfer',
    payload,
  );

  return response.data?.data ?? response.data;
}