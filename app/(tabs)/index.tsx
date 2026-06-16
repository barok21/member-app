import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, ActivityIndicator, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../../components/ThemedText';
import { EnrollmentCard } from '../../components/EnrollmentCard';
import { StreakWidget } from '../../components/StreakWidget';
import { MilestoneBadges } from '../../components/MilestoneBadges';
import { StreakLeaderboard } from '../../components/StreakLeaderboard';
import { CharityDonateCard } from '../../components/CharityDonateCard';
import { Ionicons } from '@expo/vector-icons';
import { memberApi, SystemAnnouncement } from '../../lib/member-api';
import { AnnouncementCard } from '../../components/AnnouncementPopup';
import { ReceiptVerifier } from '../../components/ReceiptVerifier';
import { Image } from 'react-native';

export default function DashboardScreen() {
  const { theme, isDark } = useTheme();
  const { member, memberData, refreshData } = useAuth();
  const { showAlert } = useAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Record<string, { month: number, year: number }[]>>({});
  
  // Reporting Modal State
  const [reportModal, setReportModal] = useState<{
    visible: boolean;
    enrollmentId?: string;
    amount: number;
    months: { month: number, year: number }[];
  }>({ visible: false, amount: 0, months: [] });
  const [reportRef, setReportRef] = useState('');
  const [reportMethod, setReportMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [showReceiptVerifier, setShowReceiptVerifier] = useState(false);

  const fetchAnnouncement = React.useCallback(async () => {
    try {
      const data = await memberApi.getActiveAnnouncement();
      setAnnouncement(data ? (data as any) : null);
    } catch (e) {
      console.error("Failed to fetch dashboard announcement:", e);
    }
  }, []);

  React.useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshData(), fetchAnnouncement()]);
    setRefreshing(false);
  }, [refreshData, fetchAnnouncement]);

  const toggleMonth = (enrollmentId: string, month: number, year: number) => {
    const current = selectedMonths[enrollmentId] || [];
    const exists = current.find(m => m.month === month && m.year === year);
    
    if (exists) {
      setSelectedMonths({
        ...selectedMonths,
        [enrollmentId]: current.filter(m => !(m.month === month && m.year === year))
      });
    } else {
      setSelectedMonths({
        ...selectedMonths,
        [enrollmentId]: [...current, { month, year }].sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month))
      });
    }
  };

  const openReportModal = (enrollmentId: string, amountPerMonth: number) => {
    const months = selectedMonths[enrollmentId] || [];
    const firstMethod = memberData?.paymentMethods?.[0]?.name || '';
    setReportModal({
      visible: true,
      enrollmentId,
      amount: amountPerMonth * months.length,
      months
    });
    setReportMethod(firstMethod);
  };

  const handleReportPayment = async () => {
    if (!reportRef.trim()) {
      showAlert('Error', 'Reference number is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      for (const m of reportModal.months) {
        await memberApi.submitDeclaration({
          member_id: member.id,
          enrollment_id: reportModal.enrollmentId,
          amount: reportModal.amount / reportModal.months.length,
          payment_method: reportMethod,
          payment_for_month: m.month,
          payment_for_year: m.year,
          reference_number: reportRef
        });
      }
      
      showAlert('Success', 'Payment reported successfully. Waiting for admin approval.', 'success');
      setReportModal({ visible: false, amount: 0, months: [] });
      setReportRef('');
      setSelectedMonths({ ...selectedMonths, [reportModal.enrollmentId!]: [] });
      refreshData();
    } catch (e) {
      console.error("Report Payment Error:", e);
      showAlert('Error', 'Failed to report payment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!memberData) return null;

  const maxStreakData = memberData.enrollments.reduce((acc: any, curr: any) => {
    return {
      current_streak: Math.max(acc.current_streak, curr.current_streak || 0),
      longest_streak: Math.max(acc.longest_streak, curr.longest_streak || 0),
      streak_at_risk: acc.streak_at_risk || curr.streak_at_risk || false,
      timeline: curr.recent_timeline || acc.timeline
    };
  }, { current_streak: 0, longest_streak: 0, streak_at_risk: false, timeline: [] });

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={[styles.headerCard, { backgroundColor: theme.primary }]}>
        <View style={styles.headerTop}>
          <View>
            <ThemedText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' }}>WELCOME BACK</ThemedText>
            <ThemedText style={{ color: 'white', fontSize: 24, fontWeight: '900' }}>{member.full_name}</ThemedText>
            <ThemedText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginTop: 2 }}>{member.member_id}</ThemedText>
          </View>
          <View style={styles.logoContainer}>
             <Image 
               source={require('../../assets/logo.png')} 
               style={{ width: 64, height: 64, borderRadius: 20 }}
               resizeMode="contain"
             />
          </View>
        </View>
        
        <View style={styles.headerStats}>
           <View style={styles.headerStatItem}>
              <ThemedText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800' }}>TOTAL OWED</ThemedText>
              <ThemedText style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>
                {memberData.enrollments.reduce((acc: number, curr: any) => acc + curr.unpaid_amount, 0)} ETB
              </ThemedText>
           </View>
           <View style={[styles.headerStatItem, { alignItems: 'flex-end' }]}>
              <ThemedText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800' }}>STATUS</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: theme.secondary }]}>
                <ThemedText style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{member.status.toUpperCase()}</ThemedText>
              </View>
           </View>
        </View>
      </View>

      {announcement && (
         <View style={{ marginBottom: 24 }}>
           <AnnouncementCard announcement={announcement} />
         </View>
      )}

      <TouchableOpacity
        onPress={() => setShowReceiptVerifier(true)}
        style={[styles.verifyButton, { backgroundColor: theme.primary + '12', borderColor: theme.primary }]}
      >
        <Ionicons name="scan-outline" size={20} color={theme.primary} />
        <ThemedText style={{ color: theme.primary, fontWeight: '800', marginLeft: 10 }}>Verify Receipt & Auto-Pay</ThemedText>
        <Ionicons name="arrow-forward" size={18} color={theme.primary} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <View style={{ marginBottom: 24 }}>
         <StreakWidget 
            currentStreak={maxStreakData.current_streak} 
            atRisk={maxStreakData.streak_at_risk} 
            timeline={maxStreakData.timeline} 
            memberName={member.full_name?.split(' ')[0]}
         />
      </View>

      <StreakLeaderboard currentMemberId={member.id} category={member.category} />

      <MilestoneBadges longestStreak={maxStreakData.longest_streak} />

      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle">Your Enrollments</ThemedText>
      </View>

      {memberData.enrollments.map((env: any, idx: number) => (
        <EnrollmentCard 
          key={idx} 
          enrollment={env} 
          selectedMonths={selectedMonths[env.enrollment_id] || []}
          onSelectMonth={(m, y) => toggleMonth(env.enrollment_id, m, y)}
          onReport={() => openReportModal(env.enrollment_id, env.monthly_fee)}
        />
      ))}

      {memberData.paymentMethods && memberData.paymentMethods.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Payment Methods</ThemedText>
          </View>

          <View style={styles.paymentMethods}>
            {memberData.paymentMethods.map((method: any, idx: number) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.methodCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={async () => {
                   await Clipboard.setStringAsync(method.account_number);
                   showAlert('Copied', `${method.name} number copied to clipboard:\n${method.account_number}`, 'success');
                }}
              >
                <View style={[styles.methodIcon, { backgroundColor: method.type === 'bank' ? '#2563EB15' : '#22C55E15' }]}>
                  <Ionicons name={method.type === 'bank' ? "business" : "phone-portrait"} size={20} color={method.type === 'bank' ? "#2563EB" : "#22C55E"} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="bold" style={{ fontSize: 14 }}>{method.name}</ThemedText>
                  {method.account_holder_name && (
                    <ThemedText style={{ fontSize: 11, color: theme.textMuted }}>{method.account_holder_name}</ThemedText>
                  )}
                  <ThemedText type="caption">{method.account_number}</ThemedText>
                </View>
                <Ionicons name="copy-outline" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Charity Donate Card */}
      <View style={{ marginTop: 24, marginBottom: 24 }}>
        <CharityDonateCard paymentMethods={memberData.paymentMethods || []} />
      </View>

      {/* Report Modal */}
      <Modal visible={reportModal.visible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
           <TouchableOpacity style={{ flex: 1 }} onPress={() => setReportModal({ ...reportModal, visible: false, months: [] })} />
           <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
              <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Declare Payment</ThemedText>
              <ThemedText type="caption" style={{ marginBottom: 20 }}>
                Submit transaction details for {reportModal.months.length} month(s).
              </ThemedText>

              <View style={[styles.modalSummary, { backgroundColor: theme.surfaceElevated }]}>
                <View style={styles.summaryItem}>
                   <ThemedText type="caption">Total Amount</ThemedText>
                   <ThemedText type="bold" style={{ fontSize: 24 }}>{reportModal.amount} ETB</ThemedText>
                </View>
                <View style={[styles.summaryItem, { alignItems: 'flex-end' }]}>
                   <ThemedText type="caption">Method</ThemedText>
                   <View style={styles.methodToggle}>
                      {(memberData.paymentMethods || []).map((method: any, idx: number) => (
                        <TouchableOpacity 
                          key={idx}
                          onPress={() => setReportMethod(method.name)}
                          style={[styles.methodOption, reportMethod === method.name && { backgroundColor: theme.primary }]}
                        >
                          <ThemedText style={{ 
                            fontSize: 10, 
                            fontWeight: '800', 
                            color: reportMethod === method.name ? 'white' : theme.textMuted 
                          }}>
                            {method.name.split(' ')[0].toUpperCase()}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                   </View>
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <ThemedText type="caption" style={{ marginBottom: 8, marginLeft: 4 }}>Transaction Ref / ID</ThemedText>
                <View style={[styles.modalInput, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                   <TextInput 
                     value={reportRef}
                     onChangeText={v => setReportRef(v.toUpperCase())}
                     placeholder="e.g. FT23..."
                     placeholderTextColor={theme.textMuted}
                     autoFocus
                     style={{ flex: 1, color: theme.text, fontWeight: '900', fontSize: 18, letterSpacing: 2 }}
                   />
                </View>
              </View>

              <TouchableOpacity 
                disabled={submitting}
                onPress={handleReportPayment}
                style={[styles.submitButton, { backgroundColor: theme.primary }]}
              >
                {submitting ? <ActivityIndicator color="white" /> : (
                  <>
                    <ThemedText style={{ color: 'white', fontWeight: '900' }}>Submit Declaration</ThemedText>
                    <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      <ReceiptVerifier
        visible={showReceiptVerifier}
        onClose={() => setShowReceiptVerifier(false)}
        memberId={member.id}
        memberName={member.full_name}
        enrollments={memberData.enrollments}
        onSuccess={refreshData}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 20,
  },
  headerStatItem: {
    flex: 1,
  },
  statusBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  paymentMethods: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalSummary: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 2,
    marginTop: 4,
  },
  methodOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  modalInput: {
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  submitButton: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 24,
  },
});
