import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberApi, SystemAnnouncement } from '../lib/member-api';
import { formatEthiopianDate } from '../lib/ethiopian-date';
import { useAuth } from '../context/AuthContext';



interface AnnouncementPopupProps {
  visible: boolean;
  onClose: () => void;
  announcement: SystemAnnouncement | null;
}

export const AnnouncementCard = ({ announcement }: { announcement: SystemAnnouncement }) => {
  const { member } = useAuth();
  const storageSuffix = member?.id ? `_${member.id}` : '_anon';
  
  const [likes, setLikes] = React.useState(announcement.likes_count || 0);
  const [views, setViews] = React.useState(announcement.views_count || 0);
  const [hasLiked, setHasLiked] = React.useState(false);

  React.useEffect(() => {
    const trackView = async () => {
      try {
        const viewedKey = `@announcement_viewed_${announcement.id}${storageSuffix}`;
        const hasViewed = await AsyncStorage.getItem(viewedKey);
        
        if (!hasViewed) {
          const success = await memberApi.incrementAnnouncementMetric(announcement.id, 'view');
          if (success) {
            await AsyncStorage.setItem(viewedKey, 'true');
            setViews(v => v + 1);
          }
        }
        
        // Also check if we liked it previously
        const likedKey = `@announcement_liked_${announcement.id}${storageSuffix}`;
        const previouslyLiked = await AsyncStorage.getItem(likedKey);
        setHasLiked(!!previouslyLiked);
      } catch (e) {
        console.error("Error tracking view:", e);
      }
    };
    if (announcement.id) trackView();
  }, [announcement.id, storageSuffix]);

  const handleLike = async () => {
    if (hasLiked || !announcement.id) return;
    
    // Optimistic update
    setLikes(l => l + 1);
    setHasLiked(true);
    
    try {
      const success = await memberApi.incrementAnnouncementMetric(announcement.id, 'like');
      if (success) {
        await AsyncStorage.setItem(`@announcement_liked_${announcement.id}${storageSuffix}`, 'true');
      } else {
        throw new Error('RPC Failed');
      }
    } catch (e) {
      // Revert optimism if failed
      setLikes(l => l - 1);
      setHasLiked(false);
      console.error("Error liking announcement:", e);
    }
  };

  const formattedDate = announcement.created_at ? formatEthiopianDate(new Date(announcement.created_at), 'am') : formatEthiopianDate(new Date(), 'am');

  return (
    <View style={styles.modalContainer}>
      {/* Header Gradient Area */}
      <View style={styles.imageContainer}>
        <LinearGradient
            colors={
              announcement.type === 'warning' ? ['#92400E', '#F59E0B'] : 
              announcement.type === 'success' ? ['#065F46', '#10B981'] : 
              ['#1E40AF', '#3B82F6']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerImage}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {announcement.type === 'warning' ? 'Alert' : announcement.type === 'success' ? 'Good News' : 'Updates'}
          </Text>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentPadding}>
        <Text style={styles.title}>
            {announcement.title}
        </Text>
        
        <Text style={styles.content}>
            {announcement.content}
        </Text>

        {/* Footer Metrics Area */}
        <View style={styles.metricsRow}>
            <View style={styles.metricsLeft}>
              <TouchableOpacity activeOpacity={0.7} onPress={handleLike} style={styles.metricItem}>
                  <Ionicons name={hasLiked ? "thumbs-up" : "thumbs-up-outline"} size={18} color={hasLiked ? "#A3E635" : "#9CA3AF"} />
                  <Text style={[styles.metricText, hasLiked && { color: "#A3E635", fontWeight: '700' }]}>{likes}</Text>
              </TouchableOpacity>
              <View style={[styles.metricItem, { marginLeft: 16 }]}>
                  <Ionicons name="eye-outline" size={18} color="#9CA3AF" />
                  <Text style={styles.metricText}>{views}</Text>
              </View>
            </View>
            
            <Text style={styles.dateText}>
              {formattedDate}
            </Text>
        </View>
      </View>
    </View>
  );
};


export const AnnouncementPopup = ({ visible, onClose, announcement }: AnnouncementPopupProps) => {
  if (!announcement) return null;

  const screenHeight = Dimensions.get('window').height;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Floating close button */}
        <TouchableOpacity 
           onPress={onClose}
           style={styles.floatingCloseBtn}
        >
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={{ width: '100%', maxHeight: screenHeight * 0.8 }}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
             <AnnouncementCard announcement={announcement} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  floatingCloseBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  scrollContent: {
    flexGrow: 0,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#A3E635', 
    position: 'relative'
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(60, 56, 80, 0.9)', 
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contentPadding: {
    padding: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: '#9CA3AF',
    fontWeight: '400',
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  metricsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '400',
  }
});
