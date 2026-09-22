import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';
import { CategoryIcon } from './CategoryIcon';

interface CategoryChipProps {
  name: string;
  icon: string;
  colorHex?: string;
  selected?: boolean;
  onPress: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  name,
  icon,
  colorHex,
  selected = false,
  onPress,
}) => {
  const { colors, radius, typography } = useTheme();
  const chipColor = colorHex || colors.accent;

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? `${chipColor}25` : colors.card,
          borderColor: selected ? chipColor : colors.cardBorder,
          borderRadius: radius.md,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: selected ? chipColor : `${chipColor}20`,
            borderRadius: radius.sm,
          },
        ]}
      >
        <CategoryIcon name={icon} size={16} color={selected ? '#FFFFFF' : chipColor} />
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: selected ? colors.text : colors.textSecondary,
            fontSize: typography.sm,
            fontWeight: selected ? '700' : '500',
          },
        ]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
  },
  iconContainer: {
    padding: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {},
});
