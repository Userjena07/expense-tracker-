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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyRound, ArrowRight, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { authService } from '../../services/authService';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export default function RestoreAccountScreen() {
  const router = useRouter();
  const { colors, typography, radius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { setCurrency, setTheme } = useSettingsStore();

  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRestore = async () => {
    if (!secretKey.trim()) {
      setError('Please enter your Secret Recovery Key');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await authService.restoreAccountWithSecret(secretKey.trim());

      if (res.success && res.data) {
        const { user, accessToken, refreshToken } = res.data;
        if (user.currencyCode) {
          setCurrency(user.currencyCode);
        }
        await setAuth(user, accessToken, refreshToken, secretKey.trim().toUpperCase());
        router.replace('/(tabs)');
      } else {
        setError(res.message || 'Invalid Secret Key. Please check and try again.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Unable to restore account. Please check network.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, 12),
        },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topRow}>
            <Text style={[styles.brandName, { color: colors.accent, fontSize: typography.lg }]}>
              Expense<Text style={{ color: colors.text }}>Tracker</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setTheme(isDark ? 'light' : 'dark')}
              activeOpacity={0.7}
              style={[
                styles.themeToggleBtn,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              {isDark ? <Sun size={18} color={colors.accent} /> : <Moon size={18} color={colors.accent} />}
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Text style={[styles.welcomeTitle, { color: colors.text, fontSize: typography.title }]}>
              Restore Account 🔑
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.base }]}>
              Enter your Secret Recovery Key to instantly recover your data, transactions, and categories.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Secret Recovery Key"
              placeholder="e.g. EXP-ABCD-1234-EFGH"
              value={secretKey}
              error={error}
              onChangeText={(t) => {
                setSecretKey(t.toUpperCase());
                setError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              icon={<KeyRound size={20} color={colors.textSecondary} />}
            />

            <Card style={[styles.hintBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.hintText, { color: colors.textSecondary, fontSize: typography.xs }]}>
                💡 Your Secret Key was shown when you first installed ExpenseTracker. It can also be found in Settings on your previous device.
              </Text>
            </Card>

            <Button
              title="Restore My Data"
              onPress={handleRestore}
              loading={loading}
              icon={<ArrowRight size={18} color="#FFFFFF" />}
              style={styles.loginBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary, fontSize: typography.sm }]}>
              New to ExpenseTracker?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
              <Text style={[styles.signUpLink, { color: colors.accent, fontSize: typography.sm }]}>
                Create New Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 8,
  },
  themeToggleBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    marginBottom: 24,
  },
  brandName: {
    fontWeight: '900',
    marginBottom: 0,
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
  hintBox: {
    padding: 12,
    marginBottom: 16,
  },
  hintText: {
    lineHeight: 18,
  },
  loginBtn: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontWeight: '500',
  },
  signUpLink: {
    fontWeight: '700',
  },
});
