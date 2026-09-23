import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Download,
  Trash2,
  Filter,
  X,
} from 'lucide-react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/settingsStore';
import { transactionService } from '../../services/transactionService';
import { formatCurrency } from '../../utils/money';
import { formatTransactionDate, formatTransactionTime } from '../../utils/dates';
import { Card } from '../../components/Card';
import { CategoryIcon } from '../../components/CategoryIcon';
import { EmptyState } from '../../components/EmptyState';
import { Transaction, TransactionType } from '../../types/api';

export default function TransactionsScreen() {
  const { colors, typography, radius } = useTheme();
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<number>(0); // 0: All, 1: Exp, 2: Inc, 3: Trf
  const [exporting, setExporting] = useState(false);

  // Fetch transactions with filters
  const {
    data: transactions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['transactions-list', selectedType, keyword],
    queryFn: () =>
      transactionService.getTransactions({
        transactionType: selectedType > 0 ? selectedType : undefined,
        keyword: keyword.trim() || undefined,
        pageSize: 100,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (encryptedId: string) => transactionService.deleteTransaction(encryptedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions-list'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-list'] });
      queryClient.invalidateQueries({ queryKey: ['category-summary'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    },
  });

  const handleDelete = (txn: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${formatCurrency(txn.amount, 'INR', currencySymbol)} transaction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(txn.encryptedId),
        },
      ]
    );
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const url = await transactionService.exportCsvUrl();
      const filename = `ExpenseTracker_${new Date().toISOString().slice(0, 10)}.csv`;
      const targetFile = new File(Paths.document, filename);

      const downloadedFile = await File.downloadFileAsync(url, targetFile, { idempotent: true });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadedFile.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions CSV',
        });
      } else {
        Alert.alert('Exported', `File saved to ${downloadedFile.uri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export CSV');
    } finally {
      setExporting(false);
    }
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; items: Transaction[]; totalExpense: number }[] = [];

    transactions.forEach((txn) => {
      const dateKey = txn.txnDate.split('T')[0];
      let group = groups.find((g) => g.date === dateKey);
      if (!group) {
        group = { date: dateKey, items: [], totalExpense: 0 };
        groups.push(group);
      }
      group.items.push(txn);
      if (txn.transactionType === TransactionType.Expense) {
        group.totalExpense += txn.amount;
      }
    });

    return groups;
  }, [transactions]);

  const insets = useSafeAreaInsets();

  const typeTabs = [
    { id: 0, label: 'All' },
    { id: 1, label: 'Expenses' },
    { id: 2, label: 'Income' },
    { id: 3, label: 'Transfers' },
  ];

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
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.xl }]}>
            Transaction History
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
            {transactions.length} records found
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.exportBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={handleExportCsv}
          disabled={exporting || transactions.length === 0}
          activeOpacity={0.7}
        >
          <Download size={18} color={colors.accent} />
          <Text style={[styles.exportText, { color: colors.accent, fontSize: typography.xs }]}>
            {exporting ? 'Exporting...' : 'CSV'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchWrapper, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          placeholder="Search by note, category or account..."
          placeholderTextColor={colors.textMuted}
          value={keyword}
          onChangeText={setKeyword}
          style={[styles.searchInput, { color: colors.text, fontSize: typography.sm }]}
        />
        {keyword ? (
          <TouchableOpacity onPress={() => setKeyword('')}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {typeTabs.map((tab) => {
          const isSelected = selectedType === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedType(tab.id)}
              activeOpacity={0.7}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected ? colors.accent : colors.card,
                  borderColor: isSelected ? colors.accent : colors.cardBorder,
                  borderRadius: radius.full,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    fontSize: typography.xs,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={groupedTransactions}
        keyExtractor={(item) => item.date}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="No transactions found"
            description={keyword ? 'Try adjusting your search filter.' : 'Start recording expenses today!'}
          />
        }
        renderItem={({ item: group }) => (
          <View style={styles.dateGroup}>
            {/* Date Group Header */}
            <View style={styles.dateGroupHeader}>
              <Text style={[styles.dateText, { color: colors.text, fontSize: typography.sm }]}>
                {formatTransactionDate(group.date)}
              </Text>
              {group.totalExpense > 0 && (
                <Text style={[styles.dayTotalText, { color: colors.textMuted, fontSize: typography.xs }]}>
                  Spent: {formatCurrency(group.totalExpense, 'INR', currencySymbol)}
                </Text>
              )}
            </View>

            {/* Transactions in Date */}
            {group.items.map((txn) => {
              const isIncome = txn.transactionType === TransactionType.Income;
              const isTransfer = txn.transactionType === TransactionType.Transfer;
              const amountColor = isIncome ? colors.income : isTransfer ? colors.transfer : colors.expense;

              return (
                <Card
                  key={txn.id}
                  style={[styles.txnCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <View style={styles.txnLeft}>
                    <View
                      style={[
                        styles.iconWrapper,
                        { backgroundColor: `${txn.categoryColorHex || colors.accent}20` },
                      ]}
                    >
                      <CategoryIcon
                        name={txn.categoryIcon || 'tag'}
                        size={18}
                        color={txn.categoryColorHex || colors.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.catName, { color: colors.text, fontSize: typography.base }]}>
                        {txn.categoryName || 'General'}
                      </Text>
                      <Text style={[styles.accountDetail, { color: colors.textSecondary, fontSize: typography.xs }]}>
                        {txn.accountName}
                        {isTransfer && txn.targetAccountName ? ` ➔ ${txn.targetAccountName}` : ''}
                        {txn.txnDate ? ` • ${formatTransactionTime(txn.txnDate)}` : ''}
                        {txn.note ? ` • ${txn.note}` : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txnRight}>
                    <Text style={[styles.txnAmount, { color: amountColor, fontSize: typography.base }]}>
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatCurrency(txn.amount, 'INR', currencySymbol)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(txn)}
                      style={styles.deleteBtn}
                      activeOpacity={0.6}
                    >
                      <Trash2 size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 12,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontWeight: '500',
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  exportText: {
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  filterChipText: {},
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dateGroup: {
    marginBottom: 18,
  },
  dateGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dateText: {
    fontWeight: '700',
  },
  dayTotalText: {
    fontWeight: '600',
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    padding: 10,
    borderRadius: 12,
  },
  catName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  accountDetail: {
    fontWeight: '500',
  },
  txnRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txnAmount: {
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 4,
  },
});
