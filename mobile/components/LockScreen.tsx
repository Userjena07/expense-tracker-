import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ShieldCheck, Fingerprint, Lock, LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { useAuthStore } from '../store/authStore';
import { Button } from './Button';

export const LockScreen: React.FC = () => {
  const { colors, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, setLocked, logout } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(true);

  const authenticate = async () => {
    try {
      setIsAuthenticating(true);
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setHasBiometrics(false);
        // Fallback: allow passcode / unlock
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Expense Tracker',
          fallbackLabel: 'Use Passcode',
          disableDeviceFallback: false,
        });

        if (result.success) {
          setLocked(false);
        }
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Expense Tracker',
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setLocked(false);
      }
    } catch (err: any) {
      console.error('Biometric authentication error', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    // Prompt immediately on mount
    authenticate();
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Expense Tracker?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: colors.card,
              borderColor: colors.accent,
              borderRadius: radius.full,
            },
          ]}
        >
          <ShieldCheck size={56} color={colors.accent} />
        </View>

        <Text style={[styles.title, { color: colors.text, fontSize: typography.xxl }]}>
          Expense<Text style={{ color: colors.accent }}>Tracker</Text> Locked
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.base }]}>
          Biometric security is active for {user?.fullName || 'your account'}.
        </Text>

        <TouchableOpacity
          onPress={authenticate}
          activeOpacity={0.8}
          style={[
            styles.biometricBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              borderRadius: radius.xl,
            },
          ]}
        >
          <Fingerprint size={64} color={colors.accent} />
          <Text style={[styles.tapToUnlock, { color: colors.textSecondary, fontSize: typography.sm }]}>
            Tap to scan fingerprint / Face ID
          </Text>
        </TouchableOpacity>

        <Button
          title="Unlock App"
          onPress={authenticate}
          loading={isAuthenticating}
          icon={<Lock size={18} color="#FFFFFF" />}
          style={styles.unlockBtn}
        />
      </View>

      <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} style={styles.logoutBtn}>
        <LogOut size={16} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger, fontSize: typography.sm }]}>
          Log Out of Account
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 104,
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 24,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 36,
    paddingHorizontal: 16,
  },
  biometricBtn: {
    width: '100%',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 24,
    gap: 12,
  },
  tapToUnlock: {
    fontWeight: '600',
  },
  unlockBtn: {
    width: '100%',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontWeight: '700',
  },
});
