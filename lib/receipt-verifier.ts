import { RECEIPT_VERIFIER_URL } from '../constants/config';

export type ExtractedReceipt = {
  payer_name: string | null;
  payer_account: string | null;
  receiver_name: string | null;
  receiver_account: string | null;
  amount: number | null;
  currency: string;
  reference: string | null;
  date: string | null;
  status: string | null;
};

export type VerifyReceiptResult = {
  success: boolean;
  data: ExtractedReceipt;
  bank: string;
};

export async function verifyReceipt(bank: string, url: string): Promise<VerifyReceiptResult> {
  const response = await fetch(`${RECEIPT_VERIFIER_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bank, url }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Verification failed (${response.status})`);
  }

  return response.json();
}

export type MatchedMonth = {
  month: number;
  year: number;
  enrollment_id: string;
  amount: number;
};

export type ApplyPaymentResult = {
  success: boolean;
  message: string;
  receipt: ExtractedReceipt | null;
  matched_months: MatchedMonth[];
  payer_matched: boolean;
};

export async function applyPayment(memberId: string, bank: string, receiptUrl: string): Promise<ApplyPaymentResult> {
  const response = await fetch(`${RECEIPT_VERIFIER_URL}/apply-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId, bank, receipt_url: receiptUrl }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Payment application failed (${response.status})`);
  }

  return response.json();
}
