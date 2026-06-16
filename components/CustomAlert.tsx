import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '../context/ThemeContext';

export type AlertType = 'success' | 'error' | 'info' | 'confirm';

export interface CustomAlertOptions {
  confirmText?: string;
  cancelText?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
  showInput?: boolean;
  inputPlaceholder?: string;
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  options?: CustomAlertOptions;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type,
  options,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const [inputValue, setInputValue] = React.useState('');

  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  // Reset input when closing
  useEffect(() => {
    if (!visible) {
      setInputValue('');
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 140, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 20, duration: 140, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle' as const, color: theme.success };
      case 'error':
        return { name: 'alert-circle' as const, color: theme.error };
      case 'confirm':
        return { name: 'help-circle' as const, color: theme.primary };
      default:
        return { name: 'information-circle' as const, color: theme.primary };
    }
  };

  const icon = getIcon();

  const handleConfirm = () => {
    options?.onConfirm?.(options.showInput ? inputValue : undefined);
    onClose();
  };

  const handleCancel = () => {
    options?.onCancel?.();
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
        >
          <View style={[
            StyleSheet.absoluteFill, 
            { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.55)' }
          ]} />
        </Pressable>

        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
              <Ionicons name={icon.name} size={46} color={icon.color} />
            </View>

            {/* Title & Message */}
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={[styles.message, { color: theme.textMuted }]}>
              {message}
            </ThemedText>

            {/* Input Field */}
            {options?.showInput && (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                  },
                ]}
                placeholder={options.inputPlaceholder || 'Type here...'}
                placeholderTextColor={theme.textMuted}
                value={inputValue}
                onChangeText={setInputValue}
                autoFocus
                returnKeyType="done"
              />
            )}
          </View>

          {/* Footer Buttons */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            {type === 'confirm' ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.buttonText, { color: theme.textMuted }]}>
                    {options?.cancelText || 'Cancel'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.primary }]}
                  onPress={handleConfirm}
                  activeOpacity={0.85}
                >
                  <ThemedText style={[styles.buttonText, { color: '#ffffff' }]}>
                    {options?.confirmText || 'Confirm'}
                  </ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.fullButton, { backgroundColor: icon.color }]}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <ThemedText style={[styles.buttonText, { color: '#ffffff' }]}>
                  {options?.confirmText || 'OK'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    width: Math.min(width * 0.88, 420),
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 25,
  },
  content: {
    padding: 36,
    alignItems: 'center',
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  message: {
    textAlign: 'center',
    fontSize: 15.5,
    lineHeight: 23,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    marginTop: 24,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});