import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { memberApi } from '../lib/member-api';

interface LeaderboardEntry {
  id: string;
  name: string;
  streak: number;
  is_current_user?: boolean;
}

interface Props {
  currentMemberId?: string;
  category?: string;
}

export function StreakLeaderboard({ currentMemberId, category }: Props) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [myRankInfo, setMyRankInfo] = useState<{ rank: number; streak: number } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await memberApi.getLeaderboard(category, currentMemberId);
        
        setData(result.top10.map(item => ({
          ...item,
          is_current_user: item.id === currentMemberId,
        })));

        if (result.myRank > 0) {
          setMyRankInfo({ rank: result.myRank, streak: result.myStreak });
        }
      } catch (e) {
        console.error("Leaderboard Error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentMemberId, category]);

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const userInTop10 = data.some(d => d.is_current_user);

  const getRankIcon = (index: number) => {
    const medalConfig = [
      { name: 'medal', color: '#FFD700', size: 26 }, // Gold
      { name: 'medal', color: '#E5E7EB', size: 24 }, // Silver
      { name: 'medal', color: '#CD7F32', size: 22 }, // Bronze
    ];
    return index < 3 ? medalConfig[index] : null;
  };

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.surface, 
        borderColor: theme.border,
        shadowColor: isDark ? '#000000' : '#000000',
        shadowOpacity: isDark ? 0.4 : 0.08,
      }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '12' }]}>
          <Ionicons name="trophy" size={22} color={theme.primary} />
        </View>
        <View>
          <ThemedText style={[styles.title, { color: theme.text }]}>Streak Leaderboard</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
            {category ? `Top in ${category}` : 'Top 10 most consistent members'}
          </ThemedText>
        </View>
      </View>

      {/* Leaderboard List */}
      <View style={styles.list}>
        {data.map((entry, index) => {
          const rankIcon = getRankIcon(index);
          const isCurrentUser = entry.is_current_user;

          return (
            <View 
              key={entry.id} 
              style={[
                styles.row, 
                { borderColor: theme.border },
                isCurrentUser && [
                  styles.currentUserRow, 
                  { 
                    backgroundColor: theme.primary + (isDark ? '18' : '10'), 
                    borderColor: theme.primary + (isDark ? '40' : '25') 
                  }
                ]
              ]}
            >
              {/* Rank */}
              <View style={styles.rankContainer}>
                {rankIcon ? (
                  <Ionicons 
                    name={rankIcon.name as any} 
                    size={rankIcon.size} 
                    color={rankIcon.color} 
                  />
                ) : (
                  <ThemedText style={[styles.rankText, { color: theme.textMuted }]}>
                    {index + 1}
                  </ThemedText>
                )}
              </View>

              {/* Name */}
              <View style={styles.nameContainer}>
                <ThemedText 
                  style={[
                    styles.nameText, 
                    { color: isCurrentUser ? theme.primary : theme.text },
                    isCurrentUser && { fontWeight: '800' }
                  ]}
                >
                  {entry.name}
                  {isCurrentUser && " (You)"}
                </ThemedText>
              </View>

              {/* Streak */}
              <View style={[
                styles.streakContainer, 
                { backgroundColor: theme.primary + (isDark ? '20' : '12') }
              ]}>
                <ThemedText style={[styles.streakText, { color: theme.primary }]}>
                  {entry.streak}
                </ThemedText>
                <Ionicons name="flame" size={16} color={theme.primary} />
              </View>
            </View>
          );
        })}

        {/* Current user outside top 10 */}
        {!userInTop10 && myRankInfo && (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View 
              style={[
                styles.row, 
                styles.currentUserRow, 
                { 
                  backgroundColor: theme.primary + (isDark ? '18' : '10'), 
                  borderColor: theme.primary + (isDark ? '40' : '25') 
                }
              ]}
            >
              <View style={styles.rankContainer}>
                <ThemedText style={[styles.rankText, { color: theme.primary }]}>
                  {myRankInfo.rank}
                </ThemedText>
              </View>

              <View style={styles.nameContainer}>
                <ThemedText style={[styles.nameText, { color: theme.primary, fontWeight: '800' }]}>
                  You
                </ThemedText>
              </View>

              <View style={[
                styles.streakContainer, 
                { backgroundColor: theme.primary + (isDark ? '20' : '12') }
              ]}>
                <ThemedText style={[styles.streakText, { color: theme.primary }]}>
                  {myRankInfo.streak}
                </ThemedText>
                <Ionicons name="flame" size={16} color={theme.primary} />
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  list: {
    gap: 10,
  },
  divider: {
    height: 1,
    marginVertical: 14,
    marginHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 14,
    borderWidth: 1,
  },
  currentUserRow: {
    borderWidth: 1.5,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 15,
    fontWeight: '800',
  },
  nameContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '900',
  },
});