import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Delete } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';

interface AmountKeypadProps {
  value: string;
  onChange: (val: string) => void;
  currencySymbol?: string;
  onDone?: () => void;
}

export const AmountKeypad: React.FC<AmountKeypadProps> = ({
  value,
  onChange,
  currencySymbol = '₹',
}) => {
  const { colors, radius, typography } = useTheme();

  const handlePress = (key: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (key === 'back') {
      if (value.length <= 1) {
        onChange('0');
      } else {
        onChange(value.slice(0, -1));
      }
      return;
    }

    if (key === '.') {
      if (!value.includes('.')) {
        onChange(value + '.');
      }
      return;
    }

    // Limit decimal to 2 places
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length >= 2) {
        return;
      }
    }

    // Max 8 digits before decimal
    if (value.replace('.', '').length >= 9) {
      return;
    }

    if (value === '0') {
      onChange(key);
    } else {
      onChange(value + key);
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'back'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.amountDisplay}>
        <Text style={[styles.currencyPrefix, { color: colors.accent, fontSize: typography.xxl }]}>
          {currencySymbol}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.amountText, { color: colors.text, fontSize: typography.hero }]}
        >
          {value || '0'}
        </Text>
      </View>

      <View style={styles.keypadGrid}>
        {keys.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((k) => (
              <TouchableOpacity
                key={k}
                activeOpacity={0.6}
                onPress={() => handlePress(k)}
                style={[
                  styles.keyButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    borderRadius: radius.md,
                  },
                ]}
              >
                {k === 'back' ? (
                  <Delete size={24} color={colors.text} />
                ) : (
                  <Text style={[styles.keyText, { color: colors.text, fontSize: typography.xl }]}>
                    {k}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 18,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontWeight: '700',
    marginRight: 6,
  },
  amountText: {
    fontWeight: '800',
    letterSpacing: -1,
  },
  keypadGrid: {
    width: '100%',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  keyButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  keyText: {
    fontWeight: '600',
  },
});
