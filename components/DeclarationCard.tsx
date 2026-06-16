import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from './ThemedText';
import { getEthiopianMonthName } from '../lib/ethiopian-date';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  declaration: any;
}

export function DeclarationCard({ declaration }: Props) {
  const { theme, isDark } = useTheme();

  const statusColors = {
    approved: theme.success,
    rejected: theme.error,
    pending: theme.secondary, // Use brand orange/gold for pending
  };

  const isCharity = declaration.type === 'charity';
  const status = declaration.status as 'approved' | 'rejected' | 'pending';

  return (
    <View style={[
      styles.card, 
      { backgroundColor: theme.surface, borderColor: theme.border },
      isCharity && { borderColor: '#FF6B6B', backgroundColor: isDark ? '#FF6B6B10' : '#FFF5F5' }
    ]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {isCharity && <Ionicons name="heart" size={14} color="#FF6B6B" />}
            <ThemedText type="caption" style={[{ letterSpacing: 2 }, isCharity && { color: '#FF6B6B' }]}>
              {declaration.payment_method.toUpperCase()} {isCharity && '• DONATION'}
            </ThemedText>
          </View>
          
          <ThemedText type="bold" style={[{ fontSize: 20 }, isCharity && { color: '#FF6B6B' }]}>
            {declaration.amount} ETB
          </ThemedText>
          
          {isCharity ? (
            <ThemedText type="caption" style={{ marginTop: 6, textTransform: 'none', color: theme.textMuted, fontStyle: 'italic' }}>
              "{declaration.charity_note || 'General Donation'}"
            </ThemedText>
          ) : (
            <ThemedText type="caption" style={{ marginTop: 6, textTransform: 'none', color: theme.textMuted }}>
              For {getEthiopianMonthName(declaration.payment_for_month)} {declaration.payment_for_year}
            </ThemedText>
          )}
        </View>
        
        <View style={[styles.statusBadge, { 
          backgroundColor: statusColors[status] + '10',
          borderColor: statusColors[status] + '30'
        }]}>
          <ThemedText style={{ color: statusColors[status], fontSize: 10, fontWeight: '900' }}>
            {status.toUpperCase()}
          </ThemedText>
        </View>
      </View>
      
      <View style={[styles.footer, { borderTopColor: theme.background }]}>
        <ThemedText type="caption" style={{ fontSize: 9, opacity: 0.7 }}>
          REF: {declaration.reference_number} • {new Date(declaration.created_at).toLocaleDateString()}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
  }
});
