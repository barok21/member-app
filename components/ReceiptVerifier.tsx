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
import { applyPayment, ExtractedReceipt, MatchedMonth } from '../lib/receipt-verifier';
import { getEthiopianMonthName } from '../lib/ethiopian-date';

const BANKS = [
  { id: 'cbe', label: 'CBE', icon: 'business' as const },
  { id: 'dashen', label: 'Dashen', icon: 'business' as const },
  { id: 'awash', label: 'Awash', icon: 'business' as const },
  { id: 'boa', label: 'BOA', icon: 'business' as const },
  { id: 'zemen', label: 'Zemen', icon: 'business' as const },
  { id: 'tele', label: 'Telebirr', icon: 'phone-portrait' as const },
];

type Step = 'input' | 'loading' | 'success' | 'error';

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
  const [errorMessage, setErrorMessage] = useState('');

  const reset = () => {
    setStep('input');
    setBank('');
    setUrl('');
    setReceipt(null);
    setMatchedMonths([]);
    setErrorMessage('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleVerifyAndPay = async () => {
    if (!bank) {
      showAlert('Error', 'Please select a bank.', 'error');
      return;
    }
    if (!url.trim()) {
      showAlert('Error', 'Please enter a receipt URL or ID.', 'error');
      return;
    }

    setStep('loading');
    setErrorMessage('');

    try {
      const result = await applyPayment(memberId, bank, url);
      setReceipt(result.receipt);
      setMatchedMonths(result.matched_months);
      setStep('success');
    } catch (e: any) {
      setErrorMessage(e.message || 'Payment application failed');
      setStep('error');
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
              <ThemedText type="subtitle" style={{ marginBottom: 4 }}>Auto-Pay with Receipt</ThemedText>
              <ThemedText type="caption" style={{ marginBottom: 24, color: theme.textMuted }}>
                Paste a bank receipt URL to auto-pay your membership. Payment is applied immediately.
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
                onPress={handleVerifyAndPay}
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                <ThemedText style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Verify & Pay</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          )}

          {step === 'loading' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={{ marginTop: 20, color: theme.textMuted }}>Verifying and applying payment...</ThemedText>
            </View>
          )}

          {step === 'success' && receipt && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText type="subtitle" style={{ marginBottom: 4 }}>Payment Applied ✓</ThemedText>
              <ThemedText type="caption" style={{ marginBottom: 24, color: theme.primary }}>
                Verified by {bank.toUpperCase()}
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
                  <ThemedText type="caption" style={{ marginBottom: 12 }}>Months Covered</ThemedText>
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

              <TouchableOpacity
                onPress={() => { reset(); onSuccess(); }}
                style={[styles.primaryButton, { backgroundColor: theme.primary, marginTop: 24 }]}
              >
                <ThemedText style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Done</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          )}

          {step === 'error' && (
            <View style={styles.centerState}>
              <Ionicons name="alert-circle" size={48} color={theme.error} />
              <ThemedText style={{ marginTop: 16, textAlign: 'center', color: theme.error }}>
                {errorMessage}
              </ThemedText>
              <TouchableOpacity
                onPress={() => setStep('input')}
                style={[styles.primaryButton, { backgroundColor: theme.primary, marginTop: 24, paddingHorizontal: 32 }]}
              >
                <ThemedText style={{ color: 'white', fontWeight: '900' }}>Try Again</ThemedText>
              </TouchableOpacity>
            </View>
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
