import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User as UserIcon, Mail, Lock, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { authService } from '../../services/authService';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, typography, radius } = useTheme();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { currency, setCurrency } = useSettingsStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(currency || 'INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currencies = [
    { code: 'INR', symbol: '₹', label: 'INR (₹)' },
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'EUR', symbol: '€', label: 'EUR (€)' },
    { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  ];

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await authService.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        currencyCode: selectedCurrency,
        monthStartDay: 1,
        theme: 'dark',
      });

      if (res.success && res.data) {
        const { user, accessToken, refreshToken } = res.data;
        setCurrency(selectedCurrency);
        await setAuth(user, accessToken, refreshToken);
        router.replace('/(tabs)');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Registration failed. Please check network.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.brandName, { color: colors.accent, fontSize: typography.lg }]}>
              Expense<Text style={{ color: colors.text }}>Tracker</Text>
            </Text>
            <Text style={[styles.welcomeTitle, { color: colors.text, fontSize: typography.title }]}>
              Create your account 🚀
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.base }]}>
              Get defaults for Cash, Pocket Money & top categories in one tap.
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: `${colors.danger}20`, borderColor: colors.danger }]}>
                <Text style={[styles.errorText, { color: colors.danger, fontSize: typography.sm }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Input
              label="Your Name"
              placeholder="e.g. John Doe"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                setError('');
              }}
              icon={<UserIcon size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Password (min 6 characters)"
              placeholder="••••••••"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError('');
              }}
              isPassword
              icon={<Lock size={20} color={colors.textSecondary} />}
            />

            <Text style={[styles.currencyLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
              Primary Currency
            </Text>
            <View style={styles.currencyRow}>
              {currencies.map((c) => {
                const isSelected = selectedCurrency === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    activeOpacity={0.7}
                    onPress={() => setSelectedCurrency(c.code)}
                    style={[
                      styles.currencyBtn,
                      {
                        backgroundColor: isSelected ? `${colors.accent}25` : colors.card,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        {
                          color: isSelected ? colors.accent : colors.text,
                          fontSize: typography.sm,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              icon={<Sparkles size={18} color="#FFFFFF" />}
              style={styles.registerBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary, fontSize: typography.sm }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
              <Text style={[styles.signUpLink, { color: colors.accent, fontSize: typography.sm }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    paddingTop: 16,
    marginBottom: 20,
  },
  brandName: {
    fontWeight: '900',
    marginBottom: 8,
  },
  welcomeTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  currencyLabel: {
    fontWeight: '500',
    marginBottom: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  currencyBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  currencyText: {},
  registerBtn: {
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontWeight: '500',
  },
  signUpLink: {
    fontWeight: '700',
  },
});
