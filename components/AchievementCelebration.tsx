import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  Animated, 
  Dimensions, 
  TouchableOpacity,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from './ThemedText';
import { MILESTONES } from './MilestoneBadges';

interface Props {
  visible: boolean;
  onClose: () => void;
  milestoneLevel: number; // months: 3, 6, 9, 12, 18, 24
}

const { width, height } = Dimensions.get('window');

export function AchievementCelebration({ visible, onClose, milestoneLevel }: Props) {
  const { theme } = useTheme();
  const milestone = MILESTONES.find(m => m.months === milestoneLevel);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(Array.from({ length: 20 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      confettiAnims.forEach(anim => anim.setValue(0));

      // Main badge animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        })
      ]).start();

      // Confetti burst
      const animations = confettiAnims.map((anim, i) => {
        return Animated.sequence([
          Animated.delay(i * 50),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          })
        ]);
      });
      Animated.parallel(animations).start();
    }
  }, [visible]);

  if (!milestone) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg']
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backgroundGlow, { 
          backgroundColor: milestone.color,
          opacity: opacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] }) 
        }]} />

        {/* Confetti Elements */}
        {confettiAnims.map((anim, i) => {
          const translateX = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, (Math.random() - 0.5) * width * 1.5]
          });
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -height * 0.5 - Math.random() * height * 0.5]
          });
          const confettiOpacity = anim.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 1, 1, 0]
          });

          return (
            <Animated.View 
              key={i} 
              style={[
                styles.confetti, 
                { 
                  transform: [{ translateX }, { translateY }], 
                  opacity: confettiOpacity,
                  backgroundColor: milestone.color 
                }
              ]} 
            />
          );
        })}

        <Animated.View style={[
          styles.container, 
          { 
            backgroundColor: theme.surface, 
            borderColor: theme.border,
            transform: [{ scale: scaleAnim }, { rotate }],
            opacity: opacityAnim
          }
        ]}>
          <View style={[styles.badgeIcon, { backgroundColor: milestone.color + '20' }]}>
            <Ionicons name={milestone.icon} size={80} color={milestone.color} />
          </View>
          
          <ThemedText type="title" style={styles.congratsText}>Congratulations!</ThemedText>
          <ThemedText style={styles.milestoneText}>
            You've reached the <ThemedText type="bold" style={{ color: milestone.color }}>{milestone.name}</ThemedText> milestone!
          </ThemedText>
          
          <ThemedText type="subtitle" style={styles.streakCount}>
            {milestone.months} Months Streak
          </ThemedText>
          
          <ThemedText style={styles.description}>
            Your commitment to Merahe Tsidk is inspiring. Keep the flame alive!
          </ThemedText>

          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <ThemedText style={styles.closeButtonText}>AWESOME!</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backgroundGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  container: {
    width: '100%',
    padding: 32,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  badgeIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  congratsText: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  milestoneText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  streakCount: {
    fontSize: 24,
    marginBottom: 24,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    opacity: 0.6,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '900',
    letterSpacing: 1.5,
  }
});
