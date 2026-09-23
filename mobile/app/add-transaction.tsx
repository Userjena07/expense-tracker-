import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, ArrowRightLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';
import { useSettingsStore } from '../store/settingsStore';
import { categoryService } from '../services/categoryService';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { AmountKeypad } from '../components/AmountKeypad';
import { CategoryChip } from '../components/CategoryChip';
import { Button } from '../components/Button';
import { TransactionType } from '../types/api';

export default function AddTransactionModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);

  const [txnType, setTxnType] = useState<TransactionType>(TransactionType.Expense);
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Fetch accounts & categories
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-list'],
    queryFn: () => accountService.getAccounts(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-list', txnType],
    queryFn: () => categoryService.getCategories(txnType === TransactionType.Income ? 2 : 1),
  });

  // Set initial selected account and category
  React.useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].encryptedId);
    }
  }, [accounts]);

  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].encryptedId);
    }
  }, [categories]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => transactionService.saveTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-list'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-list'] });
      queryClient.invalidateQueries({ queryKey: ['category-summary'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-list'] });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      router.back();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to save transaction';
      setError(msg);
    },
  });

  const handleSave = () => {
    const numAmount = parseFloat(amountStr);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!selectedAccountId) {
      setError('Please select an account');
      return;
    }
    if (txnType !== TransactionType.Transfer && !selectedCategoryId) {
      setError('Please select a category');
      return;
    }
    if (txnType === TransactionType.Transfer) {
      if (!targetAccountId || targetAccountId === selectedAccountId) {
        setError('Please select a different destination account for transfer');
        return;
      }
    }

    setError('');
    saveMutation.mutate({
      encryptedAccountId: selectedAccountId,
      encryptedCategoryId: txnType === TransactionType.Transfer ? categories[0]?.encryptedId : selectedCategoryId,
      encryptedTargetAccountId: txnType === TransactionType.Transfer ? targetAccountId : undefined,
      amount: numAmount,
      transactionType: txnType,
      txnDate: new Date().toISOString().split('T')[0],
      note: note.trim() || undefined,
    });
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
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          activeOpacity={0.7}
        >
          <X size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.lg }]}>
          Add Transaction
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 28) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type Toggle: Expense / Income / Transfer */}
        <View style={[styles.typeToggleWrapper, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.typeTab,
              txnType === TransactionType.Expense && { backgroundColor: colors.expense, borderRadius: radius.md },
            ]}
            onPress={() => {
              setTxnType(TransactionType.Expense);
              setSelectedCategoryId('');
            }}
          >
            <Text
              style={[
                styles.typeTabText,
                { color: txnType === TransactionType.Expense ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeTab,
              txnType === TransactionType.Income && { backgroundColor: colors.income, borderRadius: radius.md },
            ]}
            onPress={() => {
              setTxnType(TransactionType.Income);
              setSelectedCategoryId('');
            }}
          >
            <Text
              style={[
                styles.typeTabText,
                { color: txnType === TransactionType.Income ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeTab,
              txnType === TransactionType.Transfer && { backgroundColor: colors.transfer, borderRadius: radius.md },
            ]}
            onPress={() => setTxnType(TransactionType.Transfer)}
          >
            <Text
              style={[
                styles.typeTabText,
                { color: txnType === TransactionType.Transfer ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Transfer
            </Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: `${colors.danger}20`, borderColor: colors.danger }]}>
            <Text style={[styles.errorText, { color: colors.danger, fontSize: typography.xs }]}>{error}</Text>
          </View>
        ) : null}

        {/* Big Amount Keypad */}
        <AmountKeypad value={amountStr} onChange={setAmountStr} currencySymbol={currencySymbol} />

        {/* Account Selector Chips */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
          {txnType === TransactionType.Transfer ? 'FROM ACCOUNT' : 'PAY FROM / DEPOSIT TO'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {accounts.map((acc) => {
            const isSelected = selectedAccountId === acc.encryptedId;
            return (
              <TouchableOpacity
                key={acc.id}
                onPress={() => setSelectedAccountId(acc.encryptedId)}
                activeOpacity={0.7}
                style={[
                  styles.accountChip,
                  {
                    backgroundColor: isSelected ? `${colors.accent}25` : colors.card,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.accountChipText,
                    { color: isSelected ? colors.accent : colors.text, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {acc.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Destination Account (If Transfer) */}
        {txnType === TransactionType.Transfer && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
              TO ACCOUNT
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {accounts.map((acc) => {
                const isSelected = targetAccountId === acc.encryptedId;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setTargetAccountId(acc.encryptedId)}
                    activeOpacity={0.7}
                    style={[
                      styles.accountChip,
                      {
                        backgroundColor: isSelected ? `${colors.transfer}25` : colors.card,
                        borderColor: isSelected ? colors.transfer : colors.cardBorder,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.accountChipText,
                        { color: isSelected ? colors.transfer : colors.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Category Chips (If Expense / Income) */}
        {txnType !== TransactionType.Transfer && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
              CATEGORY
            </Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  name={cat.name}
                  icon={cat.icon}
                  colorHex={cat.colorHex}
                  selected={selectedCategoryId === cat.encryptedId}
                  onPress={() => setSelectedCategoryId(cat.encryptedId)}
                />
              ))}
            </View>
          </>
        )}

        {/* Optional Note */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
          NOTE (OPTIONAL)
        </Text>
        <TextInput
          placeholder="e.g. Lunch with friends, Grocery, Movie ticket"
          placeholderTextColor={colors.textMuted}
          value={note}
          onChangeText={setNote}
          style={[
            styles.noteInput,
            {
              backgroundColor: colors.inputBg,
              color: colors.text,
              borderColor: colors.cardBorder,
              borderRadius: radius.md,
            },
          ]}
        />

        {/* Save Button */}
        <Button
          title={`Save ${txnType === TransactionType.Income ? 'Income' : txnType === TransactionType.Transfer ? 'Transfer' : 'Expense'}`}
          onPress={handleSave}
          loading={saveMutation.isPending}
          icon={<Check size={20} color="#FFFFFF" />}
          style={styles.saveBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerTitle: {
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  typeToggleWrapper: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTabText: {
    fontWeight: '700',
    fontSize: 14,
  },
  errorBanner: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 8,
  },
  errorText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  chipsScroll: {
    marginBottom: 8,
  },
  accountChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    marginRight: 8,
  },
  accountChipText: {
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noteInput: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    fontSize: 14,
    marginBottom: 20,
  },
  saveBtn: {
    marginTop: 8,
  },
});
