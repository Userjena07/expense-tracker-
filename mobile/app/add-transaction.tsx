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
import { X, Check, ArrowRightLeft, Clock } from 'lucide-react-native';
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
import { formatTransactionTime } from '../utils/dates';

export default function AddTransactionModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);

  const [txnType, setTxnType] = useState<TransactionType>(TransactionType.Expense);
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [dateOption, setDateOption] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Time state (defaults to current local time)
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const [customTime, setCustomTime] = useState(() => `${pad(now.getHours())}:${pad(now.getMinutes())}`);
  const [showTimeEdit, setShowTimeEdit] = useState(false);

  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Calculate actual transaction date & time
  const getSelectedTxnDate = () => {
    const [hours, minutes] = (customTime || '').split(':').map((v) => parseInt(v, 10) || 0);
    const targetDate = new Date();

    if (dateOption === 'yesterday') {
      targetDate.setDate(targetDate.getDate() - 1);
    } else if (dateOption === 'custom' && customDate) {
      const parts = customDate.split('-');
      if (parts.length === 3) {
        targetDate.setFullYear(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }

    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate.toISOString();
  };

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
    if (categories.length > 0 && !selectedCategoryId && selectedCategoryId !== '__OTHER__') {
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

  const handleSave = async () => {
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
    if (selectedCategoryId === '__OTHER__' && !customCategoryName.trim()) {
      setError('Please enter a name for the custom category');
      return;
    }
    if (txnType === TransactionType.Transfer) {
      if (!targetAccountId || targetAccountId === selectedAccountId) {
        setError('Please select a different destination account for transfer');
        return;
      }
    }

    setError('');

    let catId = selectedCategoryId;

    // Handle saving custom category on the fly if "Other" was selected
    if (selectedCategoryId === '__OTHER__') {
      try {
        const savedList = await categoryService.saveCategory({
          name: customCategoryName.trim(),
          icon: 'tag',
          colorHex: '#8B5CF6',
          categoryType: txnType === TransactionType.Income ? 2 : 1,
        });
        queryClient.invalidateQueries({ queryKey: ['categories-list'] });
        const created = savedList.find(
          (c) => c.name?.toLowerCase() === customCategoryName.trim().toLowerCase()
        );
        catId = created?.encryptedId || savedList[0]?.encryptedId || '';
      } catch (catErr: any) {
        setError('Failed to create custom category');
        return;
      }
    }

    saveMutation.mutate({
      encryptedAccountId: selectedAccountId,
      encryptedCategoryId: txnType === TransactionType.Transfer ? categories[0]?.encryptedId : catId,
      encryptedTargetAccountId: txnType === TransactionType.Transfer ? targetAccountId : undefined,
      amount: numAmount,
      transactionType: txnType,
      txnDate: getSelectedTxnDate(),
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

        {/* Big Amount Keypad */}
        <AmountKeypad value={amountStr} onChange={setAmountStr} currencySymbol={currencySymbol} />

        {/* Date & Time Selector */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.xs, marginTop: 0, marginBottom: 0 }]}>
            TRANSACTION DATE & TIME
          </Text>
          <TouchableOpacity
            onPress={() => setShowTimeEdit(!showTimeEdit)}
            activeOpacity={0.7}
            style={[
              styles.timeBadge,
              {
                backgroundColor: showTimeEdit ? `${colors.accent}20` : colors.card,
                borderColor: showTimeEdit ? colors.accent : colors.cardBorder,
                borderRadius: radius.full,
              },
            ]}
          >
            <Clock size={13} color={colors.accent} />
            <Text style={[styles.timeBadgeText, { color: colors.accent, fontSize: typography.xs }]}>
              {formatTransactionTime(getSelectedTxnDate()) || customTime}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateSelectorRow}>
          <TouchableOpacity
            style={[
              styles.dateChip,
              {
                backgroundColor: dateOption === 'today' ? `${colors.accent}25` : colors.card,
                borderColor: dateOption === 'today' ? colors.accent : colors.cardBorder,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setDateOption('today')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dateChipText,
                { color: dateOption === 'today' ? colors.accent : colors.text, fontWeight: dateOption === 'today' ? '700' : '500' },
              ]}
            >
              📅 Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dateChip,
              {
                backgroundColor: dateOption === 'yesterday' ? `${colors.accent}25` : colors.card,
                borderColor: dateOption === 'yesterday' ? colors.accent : colors.cardBorder,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setDateOption('yesterday')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dateChipText,
                { color: dateOption === 'yesterday' ? colors.accent : colors.text, fontWeight: dateOption === 'yesterday' ? '700' : '500' },
              ]}
            >
              Yesterday
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dateChip,
              {
                backgroundColor: dateOption === 'custom' ? `${colors.accent}25` : colors.card,
                borderColor: dateOption === 'custom' ? colors.accent : colors.cardBorder,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setDateOption('custom')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dateChipText,
                { color: dateOption === 'custom' ? colors.accent : colors.text, fontWeight: dateOption === 'custom' ? '700' : '500' },
              ]}
            >
              Custom Date
            </Text>
          </TouchableOpacity>
        </View>

        {dateOption === 'custom' && (
          <TextInput
            placeholder="YYYY-MM-DD (e.g. 2026-09-20)"
            placeholderTextColor={colors.textMuted}
            value={customDate}
            onChangeText={setCustomDate}
            style={[
              styles.customDateInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.cardBorder,
                borderRadius: radius.md,
              },
            ]}
          />
        )}

        {showTimeEdit && (
          <View
            style={[
              styles.timeEditorBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderRadius: radius.md,
              },
            ]}
          >
            <View style={styles.timeEditorHeader}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.xs, fontWeight: '700' }}>
                CUSTOM TIME (HH:mm)
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const cur = new Date();
                  setCustomTime(`${pad(cur.getHours())}:${pad(cur.getMinutes())}`);
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.accent, fontSize: typography.xs, fontWeight: '700' }}>
                  Set to Now 🕒
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="e.g. 14:30 or 09:15"
              placeholderTextColor={colors.textMuted}
              value={customTime}
              onChangeText={setCustomTime}
              style={[
                styles.customDateInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.accent,
                  borderRadius: radius.md,
                  marginBottom: 0,
                },
              ]}
            />
          </View>
        )}

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
                  onPress={() => {
                    setSelectedCategoryId(cat.encryptedId);
                    setCustomCategoryName('');
                  }}
                />
              ))}

              {/* "+ Other" Custom Category Chip */}
              <CategoryChip
                name="+ Other / Custom"
                icon="plus"
                colorHex="#8B5CF6"
                selected={selectedCategoryId === '__OTHER__'}
                onPress={() => setSelectedCategoryId('__OTHER__')}
              />
            </View>

            {/* Custom Category Input if "Other" selected */}
            {selectedCategoryId === '__OTHER__' && (
              <View style={styles.otherCategoryBox}>
                <Text style={[styles.subLabel, { color: colors.accent, fontSize: typography.xs }]}>
                  ENTER CUSTOM CATEGORY NAME
                </Text>
                <TextInput
                  placeholder="e.g. Books, Gifts, Pet Care, Repairs"
                  placeholderTextColor={colors.textMuted}
                  value={customCategoryName}
                  onChangeText={setCustomCategoryName}
                  autoFocus
                  style={[
                    styles.noteInput,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.accent,
                      borderRadius: radius.md,
                      marginTop: 6,
                    },
                  ]}
                />
              </View>
            )}
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

        {error ? (
          <Text style={[styles.errorText, { color: colors.danger, fontSize: typography.sm }]}>
            * {error}
          </Text>
        ) : null}

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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  timeBadgeText: {
    fontWeight: '700',
  },
  timeEditorBox: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  timeEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dateChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  dateChipText: {
    fontSize: 13,
  },
  customDateInput: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    fontSize: 14,
    marginBottom: 8,
  },
  otherCategoryBox: {
    width: '100%',
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF640',
    backgroundColor: '#8B5CF610',
  },
  subLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  noteInput: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    fontSize: 14,
    marginBottom: 20,
  },
  errorText: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  saveBtn: {
    marginTop: 8,
  },
});
