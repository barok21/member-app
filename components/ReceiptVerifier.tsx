import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { verifyReceipt, ExtractedReceipt } from '../lib/receipt-verifier';
import { memberApi } from '../lib/member-api';
import { getEthiopianMonthName } from '../lib/ethiopian-date';

const BANKS = [
  { id: 'cbe', label: 'CBE', icon: 'business' as const },
  { id: 'dashen', label: 'Dashen', icon: 'business' as const },
  { id: 'awash', label: 'Awash', icon: 'business' as const },
  { id: 'boa', label: 'BOA', icon: 'business' as const },
  { id: 'zemen', label: 'Zemen', icon: 'business' as const },
  { id: 'tele', label: 'Telebirr', icon: 'phone-portrait' as const },
];

type Step = 'input' | 'verifying' | 'result' | 'applying';

type MatchedMonth = {
  month: number;
  year: number;
  enrollmentId: string;
  amount: number;
};

interface ReceiptVerifierProps {
  visible: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  enrollments: any[];
  onSuccess: () => void;
}

export function ReceiptVerifier({ visible, onClose, memberId, memberName, enrollments, onSuccess }: ReceiptVerifierProps) {
  const { theme } = useTheme();
  const { showAlert } = useAlert();
  const [step, setStep] = useState<Step>('input');
  const [bank, setBank] = useState('');
  const [url, setUrl] = useState('');
  const [receipt, setReceipt] = useState<ExtractedReceipt | null>(null);
  const [matchedMonths, setMatchedMonths] = useState<MatchedMonth[]>([]);
  const [error, setError] = useState('');

  const reset = () => {
    setStep('input');
    setBank('');
    setUrl('');
    setReceipt(null);
    setMatchedMonths([]);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleVerify = async () => {
    if (!bank) {
      showAlert('Error', 'Please select a bank.', 'error');
      return;
    }
    if (!url.trim()) {
      showAlert('Error', 'Please enter a receipt URL or ID.', 'error');
      return;
    }

    setStep('verifying');
    setError('');

    try {
      const result = await verifyReceipt(bank, url);
      setReceipt(result.data);

      const activeEnrollments = enrollments.filter((e: any) => e.status === 'active');
      if (activeEnrollments.length === 0) {
        setStep('result');
        setMatchedMonths([]);
        return;
      }

      const amount = result.data.amount || 0;
      const matched: MatchedMonth[] = [];

      for (const env of activeEnrollments) {
        const fee = env.monthly_fee || 0;
        if (fee <= 0) continue;

        const unpaid = env.unpaid_months_details || [];
        let remaining = amount;

        for (const um of unpaid) {
          if (remaining >= fee) {
            matched.push({
              month: um.month,
              year: um.year,
              enrollmentId: env.enrollment_id,
              amount: fee,
            });
            remaining -= fee;
          } else {
            break;
          }
        }
      }

      setMatchedMonths(matched);
      setStep('result');
    } catch (e: any) {
      setError(e.message || 'Verification failed');
      setStep('input');
      showAlert('Verification Failed', e.message || 'Could not verify this receipt.', 'error');
    }
  };

  const handleApply = async () => {
    if (matchedMonths.length === 0) {
      showAlert('No Months', 'The receipt amount does not cover any unpaid months.', 'error');
      return;
    }

    setStep('applying');
    try {
      for (const m of matchedMonths) {
        await memberApi.submitVerifiedPayment({
          member_id: memberId,
          enrollment_id: m.enrollmentId,
          amount: m.amount,
          payment_for_month: m.month,
          payment_for_year: m.year,
          reference_number: receipt?.reference || url,
          receipt_data: receipt,
          receipt_url: url,
        });
      }

      showAlert('Payment Applied!', `${matchedMonths.length} month(s) have been paid automatically.`, 'success');
      reset();
      onSuccess();
    } catch (e: any) {
      showAlert('Error', 'Failed to apply payment: ' + (e.message || 'unknown error'), 'error');
      setStep('result');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {step === 'input' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText type="subtitle" style={{ marginBottom: 4 }}>Verify Receipt</ThemedText>
              <ThemedText type="caption" style={{ marginBottom: 24, color: theme.textMuted }}>
                Paste a bank receipt URL to auto-pay your membership.
              </ThemedText>

              <ThemedText type="caption" style={styles.label}>Select Bank</ThemedText>
              <View style={styles.bankRow}>
                {BANKS.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setBank(b.id)}
                    style={[
                      styles.bankChip,
                      {
                        backgroundColor: bank === b.id ? theme.primary : theme.surfaceElevated,
                        borderColor: bank === b.id ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={b.icon}
                      size={18}
                      color={bank === b.id ? 'white' : theme.text}
                    />
                    <ThemedText
                      style={[
                        styles.bankLabel,
                        { color: bank === b.id ? 'white' : theme.text },
                      ]}
                    >
                      {b.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="caption" style={styles.label}>Receipt URL or ID</ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <TextInput
                    value={url}
                    onChangeText={setUrl}
                    placeholder="https://apps.cbe.com.et:100/?id=FT..."
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.input, { color: theme.text }]}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleVerify}
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="scan-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <ThemedText style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Verify Receipt</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          )}

          {step === 'verifying' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={{ marginTop: 20, color: theme.textMuted }}>Verifying receipt...</ThemedText>
            </View>
          )}

          {step === 'applying' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={{ marginTop: 20, color: theme.textMuted }}>Applying payment...</ThemedText>
            </View>
          )}

          {step === 'result' && receipt && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText type="subtitle" style={{ marginBottom: 4 }}>Receipt Verified ✓</ThemedText>
              <ThemedText type="caption" style={{ marginBottom: 24, color: theme.primary }}>
                Payment confirmed by {bank.toUpperCase()}
              </ThemedText>

              <View style={[styles.receiptCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <View style={styles.receiptRow}>
                  <ThemedText type="caption">Payer</ThemedText>
                  <ThemedText type="bold" style={{ fontSize: 14 }}>{receipt.payer_name || '—'}</ThemedText>
                </View>
                <View style={[styles.receiptRow, styles.receiptDivider, { borderTopColor: theme.border }]}>
                  <ThemedText type="caption">Amount</ThemedText>
                  <ThemedText type="bold" style={{ fontSize: 20, color: theme.success }}>
                    {receipt.amount?.toLocaleString()} {receipt.currency}
                  </ThemedText>
                </View>
                <View style={[styles.receiptRow, styles.receiptDivider, { borderTopColor: theme.border }]}>
                  <ThemedText type="caption">Reference</ThemedText>
                  <ThemedText type="bold" style={{ fontSize: 13 }}>{receipt.reference || '—'}</ThemedText>
                </View>
                <View style={[styles.receiptRow, styles.receiptDivider, { borderTopColor: theme.border }]}>
                  <ThemedText type="caption">Receiver</ThemedText>
                  <ThemedText type="bold" style={{ fontSize: 14 }}>{receipt.receiver_name || '—'}</ThemedText>
                </View>
                <View style={[styles.receiptRow, styles.receiptDivider, { borderTopColor: theme.border }]}>
                  <ThemedText type="caption">Date</ThemedText>
                  <ThemedText type="bold" style={{ fontSize: 13 }}>{receipt.date || '—'}</ThemedText>
                </View>
              </View>

              {matchedMonths.length > 0 && (
                <View style={[styles.matchCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <ThemedText type="caption" style={{ marginBottom: 12 }}>Auto-Matched Months</ThemedText>
                  {matchedMonths.map((m, i) => (
                    <View key={i} style={[styles.matchRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
                      <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                      <ThemedText style={{ marginLeft: 8, fontWeight: '600' }}>
                        {getEthiopianMonthName(m.month, 'en')} {m.year}
                      </ThemedText>
                      <ThemedText style={{ marginLeft: 'auto', color: theme.textMuted }}>
                        {m.amount} ETB
                      </ThemedText>
                    </View>
                  ))}
                  <View style={[styles.matchTotal, { borderTopColor: theme.primary }]}>
                    <ThemedText type="bold">Total: {matchedMonths.reduce((s, m) => s + m.amount, 0)} ETB</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.success }}>
                      {matchedMonths.length} month(s)
                    </ThemedText>
                  </View>
                </View>
              )}

              {matchedMonths.length === 0 && (
                <View style={[styles.matchCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <Ionicons name="alert-circle-outline" size={24} color={theme.error} style={{ marginBottom: 8 }} />
                  <ThemedText style={{ color: theme.textMuted, textAlign: 'center' }}>
                    The receipt amount ({receipt.amount} ETB) doesn't match any unpaid months. You can still submit it for manual review.
                  </ThemedText>
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={[styles.secondaryButton, { borderColor: theme.border }]}
                >
                  <ThemedText style={{ fontWeight: '800' }}>Close</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleApply}
                  disabled={matchedMonths.length === 0}
                  style={[
                    styles.primaryButton,
                    { flex: 1.5, backgroundColor: matchedMonths.length > 0 ? theme.primary : theme.border },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: 'white', fontWeight: '900' }}>Apply to Account</ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
  },
  bankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  bankLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputWrapper: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  receiptCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptDivider: {
    borderTopWidth: 1,
  },
  matchCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  matchTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    marginTop: 8,
    paddingTop: 12,
  },
});
