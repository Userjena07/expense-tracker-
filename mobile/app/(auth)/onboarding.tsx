import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, ShieldCheck, PieChart, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/settingsStore';
import { Button } from '../../components/Button';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { colors, typography, radius } = useTheme();
  const setOnboardingSeen = useSettingsStore((s) => s.setOnboardingSeen);

  const slides = [
    {
      icon: <Zap size={48} color="#8B5CF6" />,
      tag: 'FAST & FRICTIONLESS',
      title: 'Log expenses in under 5 seconds',
      description:
        'Tactile number keypad, instant category chips, and zero complex forms. Designed for real life on the go.',
    },
    {
      icon: <PieChart size={48} color="#10B981" />,
      tag: 'DAILY CLARITY',
      title: 'Know exactly what is "Safe to Spend Today"',
      description:
        'Plain language insights tailored to your salary cycle and custom monthly budget. No confusing jargon.',
    },
    {
      icon: <ShieldCheck size={48} color="#38BDF8" />,
      tag: 'PRIVATE & POWERFUL',
      title: 'Pocket Money, Cash & Bank Accounts',
      description:
        'Full control over your money with PIN/Biometric lock, CSV export, and encrypted security.',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setOnboardingSeen(true);
      router.replace('/(auth)/register');
    }
  };

  const handleSkip = () => {
    setOnboardingSeen(true);
    router.replace('/(auth)/login');
  };

  const slide = slides[currentSlide];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.topBar}>
        <Text style={[styles.brandText, { color: colors.accent, fontSize: typography.lg }]}>
          Expense<Text style={{ color: colors.text }}>Tracker</Text>
        </Text>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.textMuted, fontSize: typography.sm }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: colors.card, borderColor: colors.cardBorder, borderRadius: radius.xl },
          ]}
        >
          {slide.icon}
        </View>

        <View style={[styles.tagBadge, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.tagText, { color: colors.accent, fontSize: typography.xs }]}>
            {slide.tag}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text, fontSize: typography.xxl }]}>
          {slide.title}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary, fontSize: typography.base }]}>
          {slide.description}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === currentSlide ? colors.accent : colors.cardBorder,
                  width: idx === currentSlide ? 24 : 8,
                  borderRadius: radius.full,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          icon={<ArrowRight size={18} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  brandText: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  skipText: {
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 28,
  },
  tagBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  tagText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 14,
    lineHeight: 36,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footer: {
    paddingBottom: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
  },
});
