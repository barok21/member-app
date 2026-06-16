import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { ThemedText } from '../../components/ThemedText';
import { MilestoneBadges } from '../../components/MilestoneBadges';
import { StreakCalendar } from '../../components/StreakCalendar';
import { Ionicons } from '@expo/vector-icons';
import { Palettes } from '../../constants/palettes';
import { ThemeMode } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const { theme, isDark, setThemeMode, themeMode, paletteName, setPaletteName } = useTheme();
  const { member, memberData, logout } = useAuth();
  const { showAlert } = useAlert();

  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are you sure you want to log out?',
      'confirm',
      { 
        confirmText: 'Logout',
        onConfirm: logout 
      }
    );
  };

  const maxLongestStreak = memberData?.enrollments?.reduce((acc: number, curr: any) => {
    return Math.max(acc, curr.longest_streak || 0);
  }, 0) || 0;

  const activeEnrollment = [...(memberData?.enrollments || [])].sort((a: any, b: any) => (b.longest_streak || 0) - (a.longest_streak || 0))[0];
  const fullTimeline = activeEnrollment?.full_timeline || [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
           <Ionicons name="person" size={40} color={theme.primary} />
        </View>
        <ThemedText type="subtitle" style={{ fontSize: 24 }}>{member?.full_name}</ThemedText>
        <ThemedText type="caption">{member?.member_id}</ThemedText>
      </View>

      <MilestoneBadges longestStreak={maxLongestStreak} />
      
      <StreakCalendar timeline={fullTimeline} />

      <View style={styles.section}>
        <ThemedText type="caption" style={styles.sectionTitle}>Account Details</ThemedText>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
           <View style={styles.infoRow}>
              <ThemedText type="caption">Phone</ThemedText>
              <ThemedText type="bold">{member?.phone}</ThemedText>
           </View>
           <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <ThemedText type="caption">Category</ThemedText>
              <ThemedText type="bold">{member?.category}</ThemedText>
           </View>
           <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <ThemedText type="caption">Longest Streak</ThemedText>
              <ThemedText type="bold" style={{ color: theme.primary }}>{maxLongestStreak} Months</ThemedText>
           </View>
           <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <ThemedText type="caption">Member Since</ThemedText>
              <ThemedText type="bold">{new Date(member?.enrollment_date).toLocaleDateString()}</ThemedText>
           </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="caption" style={styles.sectionTitle}>Appearance</ThemedText>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Mode Selector */}
            <View style={styles.themeGroup}>
              <ThemedText style={styles.groupLabel}>Theme Mode</ThemedText>
              <View style={[styles.modeSelector, { backgroundColor: theme.surfaceElevated }]}>
                {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setThemeMode(mode)}
                    style={[
                      styles.modeOption,
                      themeMode === mode && { backgroundColor: theme.primary }
                    ]}
                  >
                    <ThemedText style={[
                      styles.modeOptionText,
                      themeMode === mode && { color: 'white', fontWeight: '800' }
                    ]}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Palette Selector */}
            <View style={[styles.themeGroup, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16 }]}>
              <ThemedText style={styles.groupLabel}>Color Palette</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteList}>
                {Object.keys(Palettes).map((pName) => {
                  const pColor = Palettes[pName].light.primary;
                  const isSelected = paletteName === pName;
                  return (
                    <TouchableOpacity
                      key={pName}
                      onPress={() => setPaletteName(pName)}
                      style={styles.paletteOption}
                    >
                      <View style={[
                        styles.colorCircle, 
                        { backgroundColor: pColor },
                        isSelected && { borderWidth: 3, borderColor: theme.text }
                      ]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                      <ThemedText style={[
                        styles.paletteName,
                        isSelected && { color: theme.primary, fontWeight: '700' }
                      ]}>
                        {pName}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
        </View>
      </View>

      <TouchableOpacity 
        onPress={handleLogout}
        style={[styles.logoutButton, { borderColor: theme.error }]}
      >
        <Ionicons name="log-out-outline" size={20} color={theme.error} />
        <ThemedText style={{ color: theme.error, fontWeight: '800', marginLeft: 8 }}>Logout</ThemedText>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeGroup: {
    padding: 20,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.8,
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  paletteList: {
    gap: 16,
    paddingBottom: 4,
  },
  paletteOption: {
    alignItems: 'center',
    gap: 8,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteName: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  }
});
