import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { memberApi } from '../lib/member-api';

interface CharityDonateCardProps {
  paymentMethods: any[];
}

export function CharityDonateCard({ paymentMethods }: CharityDonateCardProps) {
  const { theme, isDark } = useTheme();
  const { member, refreshData } = useAuth();
  const { showAlert } = useAlert();

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [reference, setReference] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(paymentMethods?.[0]?.name || '');
  const [submitting, setSubmitting] = useState(false);

  const predefinedAmounts = ['100', '500', '1000', '5000'];

  const handleDonate = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showAlert('Error', 'Please enter a valid amount.', 'error');
      return;
    }
    if (!reference.trim()) {
      showAlert('Error', 'Transaction reference is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await memberApi.submitCharity({
        member_id: member.id,
        amount: Number(amount),
        payment_method: selectedMethod,
        reference_number: reference.trim().toUpperCase(),
        charity_note: note.trim()
      });

      showAlert('Thank You! 💝', 'Your donation has been declared. Waiting for admin verification.', 'success');
      setModalVisible(false);
      setAmount('');
      setNote('');
      setReference('');
      refreshData();
    } catch (e) {
      console.error("Charity Drop Error:", e);
      showAlert('Error', 'Failed to submit donation.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!paymentMethods || paymentMethods.length === 0) return null;

  return (
    <>
      <TouchableOpacity 
        style={[styles.banner, { backgroundColor: '#FF6B6B' }]} 
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerText}>
            <ThemedText style={styles.bannerTitle}>Support Your Community 💝</ThemedText>
            <ThemedText style={styles.bannerSubtitle}>Make a voluntary donation or Sadaqa anytime.</ThemedText>
          </View>
          <View style={styles.bannerAction}>
            <ThemedText style={{ color: '#FF6B6B', fontWeight: '800', fontSize: 12 }}>DONATE</ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
           <TouchableOpacity style={{ flex: 1 }} onPress={() => setModalVisible(false)} disabled={submitting} />
           
           <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
              
              <View style={styles.modalHeader}>
                <Ionicons name="heart" size={24} color="#FF6B6B" />
                <ThemedText type="subtitle" style={{ marginLeft: 8 }}>Make a Donation</ThemedText>
              </View>

              <ThemedText type="caption" style={{ marginBottom: 20 }}>
                Your generosity helps us achieve more. Thank you!
              </ThemedText>

              {/* Amount Inputs */}
              <View style={{ marginBottom: 20 }}>
                <View style={styles.amountChips}>
                  {predefinedAmounts.map(amt => (
                     <TouchableOpacity 
                        key={amt} 
                        style={[
                          styles.amountChip, 
                          amount === amt ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }
                        ]}
                        onPress={() => setAmount(amt)}
                     >
                       <ThemedText style={{ 
                         color: amount === amt ? 'white' : theme.text, 
                         fontWeight: amount === amt ? '800' : '600' 
                       }}>
                         {amt}
                       </ThemedText>
                     </TouchableOpacity>
                  ))}
                </View>
                <View style={[styles.inputContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                   <ThemedText style={{ marginRight: 8, fontWeight: '800', color: theme.textMuted }}>ETB</ThemedText>
                   <TextInput 
                     value={amount}
                     onChangeText={setAmount}
                     keyboardType="numeric"
                     placeholder="Other Amount"
                     placeholderTextColor={theme.textMuted}
                     style={{ flex: 1, color: theme.text, fontSize: 18, fontWeight: '800' }}
                   />
                </View>
              </View>

              {/* Note */}
              <View style={{ marginBottom: 20 }}>
                <ThemedText type="caption" style={{ marginBottom: 8, marginLeft: 4 }}>Note / Purpose (Optional)</ThemedText>
                <View style={[styles.inputContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                   <TextInput 
                     value={note}
                     onChangeText={setNote}
                     placeholder="e.g. Building Fund, General Sadaqa"
                     placeholderTextColor={theme.textMuted}
                     style={{ flex: 1, color: theme.text }}
                   />
                </View>
              </View>

              {/* Payment Method Toggle */}
              <View style={{ marginBottom: 20 }}>
                 <ThemedText type="caption" style={{ marginBottom: 8, marginLeft: 4 }}>Payment Method</ThemedText>
                 <View style={[styles.methodToggle, { backgroundColor: theme.surfaceElevated }]}>
                    {paymentMethods.map((method: any, idx: number) => (
                      <TouchableOpacity 
                        key={idx}
                        onPress={() => setSelectedMethod(method.name)}
                        style={[styles.methodOption, selectedMethod === method.name && { backgroundColor: theme.primary }]}
                      >
                        <ThemedText style={{ 
                          fontSize: 12, 
                          fontWeight: '800', 
                          color: selectedMethod === method.name ? 'white' : theme.textMuted 
                        }}>
                          {method.name.split(' ')[0]}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                 </View>
              </View>

              {/* Reference Number */}
              <View style={{ marginBottom: 24 }}>
                <ThemedText type="caption" style={{ marginBottom: 8, marginLeft: 4 }}>Transaction Ref / ID</ThemedText>
                <View style={[styles.inputContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                   <TextInput 
                     value={reference}
                     onChangeText={v => setReference(v.toUpperCase())}
                     placeholder="e.g. FT23... or Receipt #..."
                     placeholderTextColor={theme.textMuted}
                     style={{ flex: 1, color: theme.text, fontWeight: '900', letterSpacing: 1 }}
                   />
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity 
                disabled={submitting}
                onPress={handleDonate}
                style={[styles.submitButton, { backgroundColor: '#FF6B6B' }]}
              >
                {submitting ? <ActivityIndicator color="white" /> : (
                  <>
                    <ThemedText style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Confirm Donation</ThemedText>
                    <Ionicons name="heart" size={20} color="white" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>

           </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    flex: 1,
    paddingRight: 16,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  bannerAction: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  amountChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  methodToggle: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  methodOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitButton: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
