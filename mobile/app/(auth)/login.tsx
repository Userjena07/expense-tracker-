import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await authService.login({
        email: email.trim(),
        password,
      });

      if (res.success && res.data) {
        const { user, accessToken, refreshToken } = res.data;
        await setAuth(user, accessToken, refreshToken);
        router.replace('/(tabs)');
      } else {
        setError(res.message || 'Invalid email or password');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Login failed. Please check your network.';
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
              Welcome back! 👋
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.base }]}>
              Sign in to manage your money and check your daily budget.
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
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError('');
              }}
              isPassword
              icon={<Lock size={20} color={colors.textSecondary} />}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              icon={<LogIn size={18} color="#FFFFFF" />}
              style={styles.loginBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary, fontSize: typography.sm }]}>
              Don't have an account yet?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
              <Text style={[styles.signUpLink, { color: colors.accent, fontSize: typography.sm }]}>
                Create Account
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
    marginBottom: 28,
  },
  brandName: {
    fontWeight: '900',
    marginBottom: 12,
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
