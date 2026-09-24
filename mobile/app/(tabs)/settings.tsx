import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Moon,
  Sun,
  Coins,
  Layers,
  Tag,
  ShieldCheck,
  FileSpreadsheet,
  LogOut,
  ChevronRight,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Updates from 'expo-updates';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { authService } from '../../services/authService';
import { transactionService } from '../../services/transactionService';
import { Card } from '../../components/Card';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, typography, radius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, secretKey, logout, updateUser } = useAuthStore();
  const { theme, setTheme, currency, setCurrency } = useSettingsStore();

  const [biometricEnabled, setBiometricEnabled] = useState(user?.isBiometricOn ?? false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (user?.isBiometricOn !== undefined) {
      setBiometricEnabled(user.isBiometricOn);
    }
  }, [user?.isBiometricOn]);

  const handleCopySecretKey = async () => {
    if (!secretKey) return;
    await Clipboard.setStringAsync(secretKey);
    setCopiedKey(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Biometric Unavailable', 'Your device does not have biometric authentication set up.');
        return;
      }

      const authRes = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric lock',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (!authRes.success) {
        return;
      }
    }

    setBiometricEnabled(value);
    if (user) {
      const updatedUser = { ...user, isBiometricOn: value };
      updateUser(updatedUser);
      authService.updateProfile(updatedUser).catch(console.error);
    }
  };

  const handleCurrencyChange = (curr: string) => {
    setCurrency(curr);
    if (user) {
      const updatedUser = { ...user, currencyCode: curr };
      updateUser(updatedUser);
      authService.updateProfile(updatedUser).catch(console.error);
    }
  };

  const handleExportCsv = async () => {
    try {
      const url = await transactionService.exportCsvUrl();
      const filename = `ExpenseTracker_Export_${new Date().toISOString().slice(0, 10)}.csv`;
      const targetFile = new File(Paths.document, filename);

      const downloadedFile = await File.downloadFileAsync(url, targetFile, { idempotent: true });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadedFile.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions CSV',
        });
      } else {
        Alert.alert('Export Complete', `Saved to ${downloadedFile.uri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export CSV');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out from Expense Tracker?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logout();
          } catch {}
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleCheckForUpdates = async () => {
    if (__DEV__) {
      Alert.alert('Development Mode', 'Over-the-air updates are only checked in preview/production builds.');
      return;
    }
    try {
      setCheckingUpdate(true);
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert('Update Found', 'Downloading the latest updates...', [], { cancelable: false });
        await Updates.fetchUpdateAsync();
        Alert.alert(
          'Update Ready',
          'The update has been downloaded. Would you like to restart the app now?',
          [
            { text: 'Restart Now', onPress: async () => await Updates.reloadAsync() },
            { text: 'Later', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('App Up to Date', 'You are currently running the latest available update.');
      }
    } catch (err: any) {
      Alert.alert('Update Check Failed', err.message || 'Could not connect to update servers. Check your internet connection.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, 10),
        },
      ]}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.xl }]}>
            Settings & Profile
          </Text>
        </View>

        {/* User Card */}
        <Card style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.avatarText, { color: colors.accent, fontSize: typography.xl }]}>
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text, fontSize: typography.lg }]}>
              {user?.fullName || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {user?.email || 'email@example.com'}
            </Text>
          </View>
        </Card>

        {/* Preferences Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: typography.xs }]}>
          PREFERENCES
        </Text>

        <Card style={[styles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Dark Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.accent}20` }]}>
                {isDark ? <Moon size={18} color={colors.accent} /> : <Sun size={18} color={colors.accent} />}
              </View>
              <Text style={[styles.settingLabel, { color: colors.text, fontSize: typography.base }]}>
                Dark Theme
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ false: colors.cardBorder, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          {/* Primary Currency */}
          <View style={styles.settingColumn}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.income}20` }]}>
                <Coins size={18} color={colors.income} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text, fontSize: typography.base }]}>
                Currency ({currency})
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
              {currencies.map((curr) => {
                const isSelected = currency === curr;
                return (
                  <TouchableOpacity
                    key={curr}
                    onPress={() => handleCurrencyChange(curr)}
                    style={[
                      styles.currencyPill,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.inputBg,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: typography.xs,
                      }}
                    >
                      {curr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          {/* Biometric Lock */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.transfer}20` }]}>
                <ShieldCheck size={18} color={colors.transfer} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text, fontSize: typography.base }]}>
                Biometric / App Lock
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: colors.cardBorder, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Secret Key Recovery Section */}
        {secretKey ? (
          <>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: typography.xs }]}>
              ACCOUNT RECOVERY & BACKUP
            </Text>
            <Card style={[styles.keyRecoveryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.keyRecoveryHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: `${colors.accent}20` }]}>
                  <KeyRound size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.text, fontSize: typography.base }]}>
                    Secret Recovery Key
                  </Text>
                  <Text style={[styles.keyHintText, { color: colors.textSecondary, fontSize: typography.xs }]}>
                    Use this key to restore your account on a new phone.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowSecretKey(!showSecretKey)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  {showSecretKey ? (
                    <EyeOff size={18} color={colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={[styles.keyDisplayRow, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
                <Text
                  selectable
                  style={[
                    styles.keyDisplayValue,
                    {
                      color: colors.text,
                      fontSize: typography.sm,
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    },
                  ]}
                >
                  {showSecretKey
                    ? secretKey
                    : `${secretKey.slice(0, 4)}-••••-••••-${secretKey.slice(-4)}`}
                </Text>

                <TouchableOpacity
                  onPress={handleCopySecretKey}
                  style={[
                    styles.copyKeyPill,
                    { backgroundColor: copiedKey ? colors.income : colors.accent },
                  ]}
                  activeOpacity={0.8}
                >
                  {copiedKey ? <Check size={14} color="#FFFFFF" /> : <Copy size={14} color="#FFFFFF" />}
                  <Text style={styles.copyKeyPillText}>
                    {copiedKey ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
        ) : null}

        {/* Data & Management Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: typography.xs }]}>
          DATA & MANAGEMENT
        </Text>

        <Card style={[styles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Manage Accounts */}
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => router.push('/account-management')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.warning}20` }]}>
                <Layers size={18} color={colors.warning} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text, fontSize: typography.base }]}>
                Accounts & Wallets
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          {/* Manage Categories */}
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => router.push('/category-management')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.accent}20` }]}>
                <Tag size={18} color={colors.accent} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text, fontSize: typography.base }]}>
                Categories & Tags
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          {/* Export CSV */}
          <TouchableOpacity style={styles.navRow} onPress={handleExportCsv} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.income}20` }]}>
                <FileSpreadsheet size={18} color={colors.income} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text, fontSize: typography.base }]}>
                Export All Transactions (CSV)
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          {/* Check for Updates */}
          <TouchableOpacity
            style={styles.navRow}
            onPress={handleCheckForUpdates}
            activeOpacity={0.7}
            disabled={checkingUpdate}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.accent}20` }]}>
                {checkingUpdate ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <RefreshCw size={18} color={colors.accent} />
                )}
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text, fontSize: typography.base }]}>
                  Check for Updates (OTA)
                </Text>
                <Text style={[styles.keyHintText, { color: colors.textSecondary, fontSize: typography.xs }]}>
                  {checkingUpdate ? 'Connecting to update server...' : 'Tap to fetch latest updates directly'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Log Out */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}40` }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger, fontSize: typography.base }]}>
            Log Out
          </Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textMuted, fontSize: typography.xs }]}>
          Expense Tracker v1.0.0 • React Native & ASP.NET Core
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topHeader: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontWeight: '500',
  },
  sectionHeading: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingsGroup: {
    padding: 12,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingColumn: {
    paddingVertical: 8,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    padding: 8,
    borderRadius: 10,
  },
  settingLabel: {
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  currencyScroll: {
    marginTop: 10,
  },
  currencyPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  logoutText: {
    fontWeight: '700',
  },
  keyRecoveryCard: {
    padding: 14,
    marginBottom: 20,
  },
  keyRecoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  keyHintText: {
    marginTop: 2,
    lineHeight: 16,
  },
  eyeBtn: {
    padding: 6,
  },
  keyDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  keyDisplayValue: {
    fontWeight: '700',
    letterSpacing: 1,
    flex: 1,
  },
  copyKeyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyKeyPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  versionText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});
