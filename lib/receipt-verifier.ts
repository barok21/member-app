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
