import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User as UserIcon, KeyRound, Copy, Check, ArrowRight, Sparkles, Sun, Moon } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { authService } from '../../services/authService';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, typography, radius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { currency, setCurrency, setTheme } = useSettingsStore();

  const [fullName, setFullName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(currency || 'INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // One-time Secret Key modal state
  const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currencies = [
    { code: 'INR', symbol: '₹', label: 'INR (₹)' },
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'EUR', symbol: '€', label: 'EUR (€)' },
    { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  ];

  const handleCreateAccount = async () => {
    if (!fullName.trim()) {
      setError('Please enter your name to continue');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { secretKey, response } = await authService.createAccountWithSecret(
        fullName.trim(),
        selectedCurrency
      );

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        setCurrency(selectedCurrency);
        await setAuth(user, accessToken, refreshToken, secretKey);
        setCreatedSecretKey(secretKey);
      } else {
        setError(response.message || 'Account creation failed');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Connection error. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (!createdSecretKey) return;
    await Clipboard.setStringAsync(createdSecretKey);
    setCopied(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setTimeout(() => setCopied(false), 3000);
  };

  const handleProceedToApp = () => {
    router.replace('/(tabs)');
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
              Welcome! What's your name? 👋
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.base }]}>
              Zero passwords or emails. Fast, private, and secured by your phone's screen lock.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Your Name"
              placeholder="e.g. John"
              value={fullName}
              error={error}
              onChangeText={(t) => {
                setFullName(t);
                setError('');
              }}
              autoFocus
              icon={<UserIcon size={20} color={colors.textSecondary} />}
            />

            <Text style={[styles.currencyLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
              PRIMARY CURRENCY
            </Text>
            <View style={styles.currencyRow}>
              {currencies.map((curr) => {
                const isSelected = selectedCurrency === curr.code;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    onPress={() => setSelectedCurrency(curr.code)}
                    activeOpacity={0.7}
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
                          fontWeight: isSelected ? '700' : '500',
                          fontSize: typography.sm,
                        },
                      ]}
                    >
                      {curr.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title="Get Started"
              onPress={handleCreateAccount}
              loading={loading}
              icon={<ArrowRight size={18} color="#FFFFFF" />}
              style={styles.registerBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary, fontSize: typography.sm }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
              <Text style={[styles.signUpLink, { color: colors.accent, fontSize: typography.sm }]}>
                Restore with Secret Key
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ONE-TIME SECRET KEY PRESENTATION MODAL */}
      <Modal visible={!!createdSecretKey} animationType="slide" transparent={false}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.bg,
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalBadge,
                  { backgroundColor: `${colors.accent}20`, borderColor: colors.accent, borderRadius: radius.full },
                ]}
              >
                <KeyRound size={40} color={colors.accent} />
              </View>

              <Text style={[styles.modalTitle, { color: colors.text, fontSize: typography.xl }]}>
                Your Secret Recovery Key 🔑
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontSize: typography.sm }]}>
                Please copy and save this key before opening your dashboard.
              </Text>
            </View>

            {/* Why Headline & Explanation */}
            <Card style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.infoRow}>
                <Sparkles size={18} color={colors.accent} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoTitle, { color: colors.text, fontSize: typography.sm }]}>
                    Why are we showing you this?
                  </Text>
                  <Text style={[styles.infoDesc, { color: colors.textSecondary, fontSize: typography.xs }]}>
                    • <Text style={{ fontWeight: '700', color: colors.text }}>Zero Passwords Needed:</Text> You log in instantly with your phone's fingerprint/screen lock.
                  </Text>
                  <Text style={[styles.infoDesc, { color: colors.textSecondary, fontSize: typography.xs, marginTop: 4 }]}>
                    • <Text style={{ fontWeight: '700', color: colors.text }}>Switching Phones / Reinstall:</Text> If you ever switch devices, entering this unique Secret Key will instantly restore all your expense records and accounts.
                  </Text>
                  <Text style={[styles.infoDesc, { color: colors.textSecondary, fontSize: typography.xs, marginTop: 4 }]}>
                    • <Text style={{ fontWeight: '700', color: colors.text }}>One-Time Setup:</Text> Save it in your Notes or a safe place now!
                  </Text>
                </View>
              </View>
            </Card>

            {/* Secret Key Card */}
            <View style={[styles.keyBox, { backgroundColor: colors.inputBg, borderColor: colors.accent, borderRadius: radius.lg }]}>
              <Text style={[styles.keyLabel, { color: colors.accent, fontSize: typography.xs }]}>
                YOUR PERSONAL SECRET KEY
              </Text>
              <Text selectable style={[styles.keyText, { color: colors.text, fontSize: typography.lg }]}>
                {createdSecretKey}
              </Text>

              <TouchableOpacity
                onPress={handleCopyKey}
                activeOpacity={0.8}
                style={[
                  styles.copyBtn,
                  {
                    backgroundColor: copied ? colors.income : colors.accent,
                    borderRadius: radius.md,
                  },
                ]}
              >
                {copied ? <Check size={18} color="#FFFFFF" /> : <Copy size={18} color="#FFFFFF" />}
                <Text style={styles.copyBtnText}>{copied ? 'Copied to Clipboard! ✓' : 'Copy Secret Key'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.settingsHint, { color: colors.textMuted, fontSize: typography.xs }]}>
              💡 Tip: You can also view or copy your recovery key anytime from Settings.
            </Text>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="I Saved My Key — Open Dashboard 🚀"
              onPress={handleProceedToApp}
              style={styles.openDashboardBtn}
            />
          </View>
        </View>
      </Modal>
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
    marginBottom: 20,
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
  currencyLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  currencyBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  currencyText: {},
  registerBtn: {
    marginTop: 8,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  modalScrollContent: {
    paddingTop: 10,
    paddingBottom: 24,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalBadge: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  infoBox: {
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  infoDesc: {
    lineHeight: 18,
  },
  keyBox: {
    width: '100%',
    padding: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 16,
  },
  keyLabel: {
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  keyText: {
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  settingsHint: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  modalFooter: {
    paddingTop: 12,
    paddingBottom: 6,
    width: '100%',
  },
  openDashboardBtn: {
    width: '100%',
  },
});
