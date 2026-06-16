import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../../components/ThemedText';
import { DeclarationCard } from '../../components/DeclarationCard';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { theme } = useTheme();
  const { memberData, refreshData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  if (!memberData) return null;

  const declarations = memberData.declarations || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={declarations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DeclarationCard declaration={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
             <ThemedText type="caption">Declaration History</ThemedText>
             <ThemedText type="subtitle" style={{ fontSize: 14, color: theme.textMuted }}>
               Review your reported payments and their verification status.
             </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
             <Ionicons name="document-text-outline" size={64} color={theme.border} />
             <ThemedText type="subtitle" style={{ marginTop: 16, color: theme.textMuted }}>No declarations yet.</ThemedText>
             <ThemedText type="caption" style={{ textAlign: 'center', marginTop: 8 }}>
               Report a payment from the Dashboard to see it here.
             </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  }
});
