import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from './ThemedText';
import { getEthiopianMonthName } from '../lib/ethiopian-date';
import { Ionicons } from '@expo/vector-icons';

interface TimelineItem {
  month: number;
  year: number;
  status: 'paid' | 'missed' | 'pending' | 'future' | 'not_enrolled' | 'empty' | 'pagume';
  in_streak?: boolean;
}

interface Props {
  timeline?: TimelineItem[];
  onMonthPress?: (item: TimelineItem) => void;
}

export function StreakCalendar({ timeline = [], onMonthPress }: Props) {
  const { theme } = useTheme();

  const groupedByYear = useMemo(() => {
    const map: Record<number, TimelineItem[]> = {};

    timeline.forEach(item => {
      if (!map[item.year]) {
        map[item.year] = Array.from({ length: 13 }, (_, i) => ({
          month: i + 1,
          year: item.year,
          status: 'empty' as const,
          in_streak: false,
        }));
      }
      map[item.year][item.month - 1] = item;
    });

    return Object.keys(map)
      .map(Number)
      .sort((a, b) => b - a)
      .map(year => ({
        year,
        months: map[year],
      }));
  }, [timeline]);

  if (!timeline?.length) return null;

  const renderMonth = (m: TimelineItem, prev?: TimelineItem, next?: TimelineItem, isCurrentMonth?: boolean) => {
    const isInStreak = !!m.in_streak;
    const isPaid = m.status === 'paid';
    const isMissed = m.status === 'missed';
    const isPending = m.status === 'pending';
    const isPagume = m.status === 'pagume';

    const connectLeft = isInStreak && prev?.in_streak;
    const connectRight = isInStreak && next?.in_streak;

    return (
      <TouchableOpacity
        key={`${m.year}-${m.month}`}
        style={styles.cellContainer}
        onPress={() => onMonthPress?.(m)}
        activeOpacity={0.7}
      >
        {/* Streak Bridge */}
        {isInStreak && (connectLeft || connectRight) && (
          <View style={[
            styles.streakBridge,
            { backgroundColor: theme.secondary + '40' },
            connectLeft && styles.bridgeLeft,
            connectRight && styles.bridgeRight,
          ]} />
        )}

        {/* Main Circle */}
        <View style={[
          styles.circle,
          isInStreak && { backgroundColor: theme.secondary },
          isPaid && !isInStreak && { backgroundColor: theme.success },
          isMissed && { backgroundColor: theme.error + '15', borderWidth: 1.5, borderColor: theme.error },
          isPending && { borderWidth: 2, borderColor: theme.secondary, borderStyle: 'dashed' },
          isPagume && { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
          m.status === 'empty' && { backgroundColor: theme.border + '25' },
          isCurrentMonth && { borderWidth: 2.5, borderColor: theme.primary },
        ]}>
          {isInStreak ? (
            <View style={styles.streakContent}>
              <Ionicons name="flame" size={20} color="white" />
            </View>
          ) : isPaid ? (
            <Ionicons name="checkmark-circle" size={18} color="white" />
          ) : isMissed ? (
            <Ionicons name="close" size={16} color={theme.error} />
          ) : isPagume ? (
            <View style={[styles.pagumeLine, { backgroundColor: theme.textMuted }]} />
          ) : null}
        </View>

        {/* Month Label */}
        <ThemedText
          style={[
            styles.monthLabel,
            { color: isCurrentMonth ? theme.primary : theme.textMuted }
          ]}
        >
          {getEthiopianMonthName(m.month, 'am').substring(0, 3)}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Payment Continuity</ThemedText>

        <View style={styles.legend}>
          <View style={[styles.legendItem]}>
            <View style={[styles.legendDot, { backgroundColor: theme.secondary }]} />
            <ThemedText type="caption">Streak</ThemedText>
          </View>
          <View style={[styles.legendItem]}>
            <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
            <ThemedText type="caption">Paid</ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {groupedByYear.map((group) => (
          <View
            key={group.year}
            style={[
              styles.yearCard,
              { backgroundColor: theme.surface, borderColor: theme.border }
            ]}
          >
            <View style={styles.yearHeader}>
              <Ionicons name="calendar" size={18} color={theme.primary} />
              <ThemedText type="bold" style={styles.yearTitle}>
                {group.year} ዓ.ም
              </ThemedText>
            </View>

            <View style={styles.grid}>
              {group.months.map((m, idx) => {
                const prev = idx > 0 ? group.months[idx - 1] : undefined;
                const next = idx < group.months.length - 1 ? group.months[idx + 1] : undefined;
                return renderMonth(m, prev, next);
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  yearCard: {
    width: 268,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
  },
  yearTitle: {
    fontSize: 17,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  cellContainer: {
    width: 42,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  streakBridge: {
    position: 'absolute',
    height: 6,
    top: 13,
    zIndex: 1,
    borderRadius: 3,
  },
  bridgeLeft: {
    left: -12,
    right: 18,
  },
  bridgeRight: {
    right: -12,
    left: 18,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  streakContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagumeLine: {
    width: 18,
    height: 2.5,
    borderRadius: 2,
  },
  monthLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
});