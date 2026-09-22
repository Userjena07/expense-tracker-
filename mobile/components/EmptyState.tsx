import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onAction,
  icon,
}) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight }]}>
        {icon || <Inbox size={36} color={colors.accent} />}
      </View>
      <Text style={[styles.title, { color: colors.text, fontSize: typography.lg }]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.desc, { color: colors.textSecondary, fontSize: typography.sm }]}>
          {description}
        </Text>
      )}
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="sm"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconWrapper: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 14,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  desc: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionBtn: {
    width: 'auto',
    paddingHorizontal: 20,
  },
});
