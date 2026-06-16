import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  longestStreak: number;
}

export const MILESTONES = [
  { months: 3, name: 'Bronze', color: '#CD7F32', colors: ['#A0522D', '#CD7F32', '#8B4513'] as const, icon: 'medal' as const },
  { months: 6, name: 'Silver', color: '#C0C0C0', colors: ['#708090', '#C0C0C0', '#4F4F4F'] as const, icon: 'shield-checkmark' as const },
  { months: 9, name: 'Elite', color: '#B08D57', colors: ['#5F4B32', '#B08D57', '#3D2F1D'] as const, icon: 'star' as const },
  { months: 12, name: 'Gold', color: '#FFD700', colors: ['#B8860B', '#FFD700', '#7A5C00'] as const, icon: 'trophy' as const },
  { months: 18, name: 'Ambassador', color: '#E5E4E2', colors: ['#64748B', '#E5E4E2', '#334155'] as const, icon: 'ribbon' as const },
  { months: 24, name: 'Diamond', color: '#00FFFF', colors: ['#0891B2', '#00FFFF', '#155E75'] as const, icon: 'diamond' as const },
];

export function MilestoneBadges({ longestStreak }: Props) {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>Achievement Badges</ThemedText>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {MILESTONES.map((milestone, idx) => {
          const isUnlocked = longestStreak >= milestone.months;
          
          return (
            <View key={idx} style={styles.badgeWrapper}>
              <View style={[
                styles.medalContainer,
                { shadowColor: isUnlocked ? milestone.color : '#000' }
              ]}>
                {isUnlocked ? (
                  <LinearGradient
                    colors={milestone.colors}
                    style={styles.medalGradient}
                  >
                    <View style={styles.innerGlass}>
                       <Ionicons name={milestone.icon} size={32} color="#FFF" />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.medalLocked, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                    <Ionicons name="lock-closed" size={24} color={theme.textMuted} />
                  </View>
                )}
              </View>
              
              <View style={styles.infoContainer}>
                <ThemedText type="bold" style={[
                  styles.badgeName,
                  { color: isUnlocked ? theme.text : theme.textMuted }
                ]}>
                  {milestone.name}
                </ThemedText>
                <ThemedText style={styles.monthLabel}>
                  {milestone.months} Months
                </ThemedText>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  badgeWrapper: {
    alignItems: 'center',
    width: 100,
  },
  medalContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  medalGradient: {
    flex: 1,
    borderRadius: 37,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerGlass: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  medalLocked: {
    flex: 1,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  infoContainer: {
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 2,
  },
  monthLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  }
});
