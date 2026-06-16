import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { getEthiopianMonthName } from '../lib/ethiopian-date';
import { useRouter } from 'expo-router';

interface TimelineItem {
  month: number;
  year: number;
  status: 'paid' | 'missed' | 'pending' | 'future' | 'not_enrolled' | 'pagume';
  in_streak?: boolean;
  is_current?: boolean;
}

interface Props {
  currentStreak: number;
  atRisk: boolean;
  timeline?: TimelineItem[];
  memberName?: string;
}

const MILESTONES = [
  { months: 3, name: 'Bronze', color: '#CD7F32', icon: 'medal' as const },
  { months: 6, name: 'Silver', color: '#C0C0C0', icon: 'shield-checkmark' as const },
  { months: 12, name: 'Gold', color: '#FFD700', icon: 'trophy' as const },
  { months: 24, name: 'Diamond', color: '#00FFFF', icon: 'diamond' as const },
];

export function StreakWidget({ currentStreak, atRisk, timeline = [], memberName = 'Member' }: Props) {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Choose background color based on risk/streak. Mockups used vibrant orange/purple.
  let bgColor = '#F97316'; // Orange default
  if (currentStreak === 0) bgColor = '#EF4444'; 
  else if (currentStreak > 6) bgColor = '#6366F1';

  // Compute current achievement
  let currentAchievement = null;
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (currentStreak >= MILESTONES[i].months) {
      currentAchievement = MILESTONES[i];
      break;
    }
  }

  // Float animation for the main huge icon
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      
      {/* Background Watermark for Current Achievement */}
      {currentAchievement && (
        <View style={styles.watermarkContainer}>
          <Ionicons name={currentAchievement.icon} size={180} color="rgba(255,255,255,0.08)" />
          <ThemedText style={styles.watermarkText}>{currentAchievement.name}</ThemedText>
        </View>
      )}

      {/* Top Glossy Highlight (Simulating specular light) */}
      <View style={styles.glossHighlight} />

      {/* Main Glowing Icon */}
      <Animated.View style={[styles.mainIconContainer, { transform: [{ translateY: floatAnim }] }]}>
         <Ionicons 
           name={currentStreak === 0 ? "flame-outline" : "flame"} 
           size={80} 
           color="rgba(255,255,255,0.95)" 
         />
      </Animated.View>

      {/* Title & Subtitle */}
      <ThemedText style={[styles.streakTitle, { fontSize: 24 }]}>
        {currentStreak === 0 ? "No Streak" : `${currentStreak} Month${currentStreak > 1 ? 's' : ''} Streak`}
      </ThemedText>
      
      <ThemedText style={styles.streakSubtitle}>
        {currentStreak === 0 
          ? "Start building your streak today!" 
          : `You're doing really great, on fire, ${memberName}!`}
      </ThemedText>

      {/* The Pill Timeline */}
      {timeline.length > 0 && (
        <View style={styles.pillContainer}>
          <View style={styles.timelineRow}>
             {timeline.slice(0, 7).map((item, idx) => {
               const isFutureOrEmpty = item.status === 'future' || item.status === 'not_enrolled';
               const isPending = item.status === 'pending';
               const isPaid = item.status === 'paid';
               const isMissed = item.status === 'missed';
               const isInStreak = !!item.in_streak;
               const isCurrent = !!item.is_current;

               return (
                 <View key={idx} style={styles.timelineItem}>
                    
                    {/* Circle / Icon */}
                    <View style={[
                      styles.circleBase,
                      (isFutureOrEmpty || item.status === 'pagume') && styles.circleFuture,
                      (isPending || (isCurrent && isPaid && isInStreak)) && styles.circlePending,
                      (isPaid && isInStreak && !isCurrent) && styles.circlePaid,
                      (isPaid && !isInStreak) && styles.circlePaidHistory,
                      isMissed && styles.circleMissed
                    ]}>
                      {/* Streak months: fire background + checkmark */}
                      {isPaid && isInStreak && !isCurrent && (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="flame" size={20} color="rgba(255,255,255,0.4)" style={{ position: 'absolute' }} />
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                      {/* Current month: pulsing flame */}
                      {(isPending || (isCurrent && isPaid && isInStreak)) && <Ionicons name="flame" size={20} color="#F97316" />}
                      {/* Paid but not in streak: simple checkmark */}
                      {isPaid && !isInStreak && <Ionicons name="checkmark" size={14} color="white" />}
                      {/* Pagume: small dash */}
                      {item.status === 'pagume' && (
                        <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
                      )}
                    </View>

                    {/* Month Label */}
                    <ThemedText style={styles.timelineMonth}>
                      {getEthiopianMonthName(item.month, 'am').substring(0, 2)}
                    </ThemedText>

                 </View>
               );
            })}
          </View>
        </View>
      )}

      {/* Bottom Button */}
      <TouchableOpacity 
        style={styles.detailsButton} 
        onPress={() => router.push('/profile')}
      >
        <ThemedText style={styles.detailsText}>See Streak Calendar &gt;</ThemedText>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 36,
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  glossHighlight: {
    position: 'absolute',
    top: -60,
    width: 250,
    height: 120,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ scaleX: 1.5 }],
  },
  mainIconContainer: {
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  streakSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  pillContainer: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 24,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  timelineItem: {
    alignItems: 'center',
    width: 32,
  },
  circleBase: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleFuture: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  circlePending: {
    backgroundColor: 'white',
    transform: [{ scale: 1.2 }],
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  circlePaid: {
    backgroundColor: '#3B82F6',
  },
  circlePaidHistory: {
    backgroundColor: '#FF8C00',
    opacity: 0.7,
  },
  circleMissed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  timelineMonth: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  detailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  detailsText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
  },
  watermarkContainer: {
    position: 'absolute',
    top: '15%',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    pointerEvents: 'none',
  },
  watermarkText: {
    fontSize: 36,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.08)',
    textTransform: 'uppercase',
    marginTop: -20,
    letterSpacing: 4,
  }
});

