import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  enrollment: any;
  onSelectMonth: (month: number, year: number) => void;
  selectedMonths: { month: number, year: number }[];
  onReport: () => void;
}

export function EnrollmentCard({ enrollment, onSelectMonth, selectedMonths, onReport }: Props) {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View>
          <ThemedText type="subtitle">{enrollment.category}</ThemedText>
          <ThemedText type="caption" style={{ marginTop: 2 }}>{enrollment.status}</ThemedText>
        </View>
        <View style={[styles.statusIcon, { 
          backgroundColor: enrollment.unpaid_amount > 0 ? theme.error + '15' : theme.success + '15' 
        }]}>
          <Ionicons 
            name={enrollment.unpaid_amount > 0 ? "alert-circle" : "checkmark-circle"} 
            size={24} 
            color={enrollment.unpaid_amount > 0 ? theme.error : theme.success} 
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <ThemedText type="caption">Monthly Fee</ThemedText>
          <ThemedText type="bold">{enrollment.monthly_fee} ETB</ThemedText>
        </View>
        <View style={[styles.stat, { alignItems: 'flex-end' }]}>
          <ThemedText type="caption">Balance</ThemedText>
          <ThemedText style={[styles.amount, { 
            color: enrollment.unpaid_amount > 0 ? theme.error : theme.success 
          }]}>
            {enrollment.unpaid_amount} ETB
          </ThemedText>
        </View>
      </View>

      {enrollment.unpaid_months_details && enrollment.unpaid_months_details.length > 0 && (
        <View style={[styles.unpaidSection, { borderTopColor: theme.border }]}>
          <ThemedText type="caption" style={{ marginBottom: 12 }}>Unpaid Months (Select to Report)</ThemedText>
          <View style={styles.monthList}>
            {enrollment.unpaid_months_details.map((m: any, idx: number) => {
              const isSelected = selectedMonths.some(sm => sm.month === m.month && sm.year === m.year);
              return (
                <TouchableOpacity 
                  key={idx}
                  onPress={() => onSelectMonth(m.month, m.year)}
                  style={[styles.monthBadge, { 
                    backgroundColor: isSelected ? theme.primary : theme.surfaceElevated,
                    borderColor: isSelected ? theme.primary : theme.border
                  }]}
                >
                  <ThemedText style={[styles.monthText, { color: isSelected ? 'white' : theme.text }]}>
                    {m.month}/{m.year % 100}
                  </ThemedText>
                  {isSelected && <Ionicons name="checkmark" size={12} color="white" style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {enrollment.future_payable_months && enrollment.future_payable_months.length > 0 && (
        <View style={[styles.unpaidSection, { borderTopColor: theme.border, marginTop: 16 }]}>
          <ThemedText type="caption" style={{ marginBottom: 12 }}>Prepay Future Months (Optional)</ThemedText>
          <View style={styles.monthList}>
            {enrollment.future_payable_months.map((m: any, idx: number) => {
              const isSelected = selectedMonths.some(sm => sm.month === m.month && sm.year === m.year);
              return (
                <TouchableOpacity 
                  key={idx}
                  onPress={() => onSelectMonth(m.month, m.year)}
                  style={[styles.monthBadge, { 
                    backgroundColor: isSelected ? theme.secondary : theme.surfaceElevated,
                    borderColor: isSelected ? theme.secondary : theme.border
                  }]}
                >
                  <ThemedText style={[styles.monthText, { color: isSelected ? 'white' : theme.text }]}>
                    {m.month}/{m.year % 100}
                  </ThemedText>
                  {isSelected && <Ionicons name="checkmark" size={12} color="white" style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {selectedMonths.length > 0 && (
        <TouchableOpacity 
          onPress={onReport}
          style={[styles.reportButton, { backgroundColor: theme.primary, marginTop: 24 }]}
        >
          <ThemedText style={{ color: 'white', fontWeight: '800' }}>
            Report {selectedMonths.length} Month{selectedMonths.length > 1 ? 's' : ''}
          </ThemedText>
          <Ionicons name="arrow-forward" size={16} color="white" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stat: {
    flex: 1,
  },
  amount: {
    fontSize: 22,
    fontWeight: '900',
  },
  unpaidSection: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  monthList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reportButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
