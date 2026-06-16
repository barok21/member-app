import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from '../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memberApi } from '../lib/member-api';
import { useAlert } from '../context/AlertContext';

export default function RegisterScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [categoryName, setCategoryName] = useState('');

  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step === 1 ? 0.5 : 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await memberApi.getCategories();
        setCategories(cats);
        if (cats.length > 0 && !categoryName) {
          setCategoryName(cats[0].name);
        }
      } catch (e) {
        console.error('Error loading categories:', e);
      }
    };
    loadCategories();
  }, []);

  const handleNext = () => {
    if (!fullName.trim() || !phone.trim()) {
      showAlert('Error', 'Please fill in your name and phone number.', 'error');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!categoryName) {
      showAlert('Error', 'Please select a membership category.', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await memberApi.registerMember({
        fullName: fullName.trim(),
        gender,
        phone: phone.trim(),
        categoryName,
      });

      if (result.success) {
        showAlert(
          'Registration Successful!',
          `Your Member ID is: **${result.memberId}**\n\nYou can now log in using this ID and your phone number.`,
          'success',
          {
            confirmText: 'Go to Login',
            onConfirm: () => router.replace('/login'),
          }
        );
      }
    } catch (e: any) {
      showAlert(
        'Registration Failed',
        e.message || 'This phone number may already be registered.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <ThemedText type="bold" style={styles.headerTitle}>
          New Member Registration
        </ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Improved Stepper */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperTrack}>
            <Animated.View
              style={[
                styles.stepperProgress,
                {
                  backgroundColor: theme.primary,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['50%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.steps}>
            {[1, 2].map((s, index) => (
              <View key={s} style={styles.stepWrapper}>
                <TouchableOpacity
                  disabled={s > step}
                  onPress={() => s < step && setStep(s)}
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: step >= s ? theme.primary : theme.surfaceElevated,
                      borderColor: step >= s ? theme.primary : theme.border,
                      borderWidth: step >= s ? 0 : 1.5,
                    },
                  ]}
                >
                  {step > s ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : (
                    <ThemedText
                      style={{
                        color: step >= s ? '#fff' : theme.textMuted,
                        fontWeight: '900',
                        fontSize: 15,
                      }}
                    >
                      {s}
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <ThemedText
                  style={[
                    styles.stepLabel,
                    { color: step >= s ? theme.text : theme.textMuted },
                  ]}
                >
                  {s === 1 ? 'Personal Info' : 'Category'}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <View style={styles.formSection}>
            <ThemedText type="bold" style={styles.sectionTitle}>
              Personal Details
            </ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
              Let's start with your basic information
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText type="caption" style={styles.label}>
                Full Name
              </ThemedText>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, color: theme.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="caption" style={styles.label}>
                Phone Number
              </ThemedText>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="0912345678"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                style={[styles.input, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, color: theme.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="caption" style={styles.label}>
                Gender
              </ThemedText>
              <View style={styles.genderToggle}>
                {(['Male', 'Female'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      styles.genderOption,
                      {
                        backgroundColor: gender === g ? theme.primary : theme.surfaceElevated,
                        borderColor: gender === g ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        color: gender === g ? '#fff' : theme.text,
                        fontWeight: '800',
                      }}
                    >
                      {g}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.buttonText}>Continue</ThemedText>
              <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Category Selection */}
        {step === 2 && (
          <View style={styles.formSection}>
            <ThemedText type="bold" style={styles.sectionTitle}>
              Choose Membership Category
            </ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
              Select the type of membership you want
            </ThemedText>

            <View style={styles.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id || cat.name}
                  onPress={() => setCategoryName(cat.name)}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: categoryName === cat.name ? theme.primary + (isDark ? '20' : '10') : theme.surface,
                      borderColor: categoryName === cat.name ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={categoryName === cat.name ? 'checkmark-circle' : 'radio-button-off'}
                    size={26}
                    color={categoryName === cat.name ? theme.primary : theme.textMuted}
                  />
                  <ThemedText type="bold" style={{ flex: 1, marginLeft: 16 }}>
                    {cat.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={[styles.secondaryButton, { borderColor: theme.border }]}
              >
                <ThemedText type="bold" style={{ color: theme.text }}>
                  Back
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={loading || !categoryName}
                onPress={handleRegister}
                style={[styles.primaryButton, { backgroundColor: theme.primary, flex: 1.6 }]}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <ThemedText style={styles.buttonText}>Complete Registration</ThemedText>
                    <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 20,
    flexGrow: 1,
  },
  stepperContainer: {
    marginBottom: 40,
  },
  stepperTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  stepperProgress: {
    height: '100%',
    borderRadius: 999,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  stepWrapper: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  formSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 15,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    marginLeft: 6,
    fontWeight: '600',
  },
  input: {
    height: 62,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    fontSize: 16.5,
    fontWeight: '600',
  },
  genderToggle: {
    flexDirection: 'row',
    gap: 14,
  },
  genderOption: {
    flex: 1,
    height: 62,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryList: {
    gap: 14,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 78,
    paddingHorizontal: 22,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 48,
  },
  primaryButton: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16.5,
    fontWeight: '900',
  },
});