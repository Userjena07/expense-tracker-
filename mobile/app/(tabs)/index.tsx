import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { summaryService } from '../../services/summaryService';
import { accountService } from '../../services/accountService';
import { transactionService } from '../../services/transactionService';
import { formatCurrency } from '../../utils/money';
import { formatShortDate } from '../../utils/dates';
import { Card } from '../../components/Card';
import { CategoryIcon } from '../../components/CategoryIcon';
import { EmptyState } from '../../components/EmptyState';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, typography, radius } = useTheme();
  const user = useAuthStore((s) => s.user);
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);
  const queryClient = useQueryClient();

  // Queries
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['monthly-summary'],
    queryFn: () => summaryService.getMonthlySummary(),
  });

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ['accounts-list'],
    queryFn: () => accountService.getAccounts(),
  });

  const {
    data: recentTransactions = [],
    isLoading: txnLoading,
    refetch: refetchTxn,
  } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => transactionService.getTransactions({ pageSize: 5 }),
  });

  const isRefreshing = summaryLoading || accountsLoading || txnLoading;

  const onRefresh = async () => {
    await Promise.all([refetchSummary(), refetchAccounts(), refetchTxn()]);
  };

  const safeToSpend = summary?.safeToSpendToday ?? 0;
  const totalBalance = summary?.totalAccountBalance ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const daysLeft = summary?.daysRemainingInCycle ?? 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.greetingText, { color: colors.textSecondary, fontSize: typography.sm }]}>
              Hello, {user?.fullName?.split(' ')[0] || 'Friend'} 👋
            </Text>
            <Text style={[styles.titleText, { color: colors.text, fontSize: typography.xl }]}>
              Financial Overview
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.avatarBadge, { backgroundColor: colors.accentLight, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.7}
          >
            <Text style={[styles.avatarInitials, { color: colors.accent, fontSize: typography.base }]}>
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card: Safe to Spend Today */}
        <Card style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.safeToSpendHeader}>
            <View style={[styles.sparkleBadge, { backgroundColor: colors.accentLight }]}>
              <Sparkles size={16} color={colors.accent} />
              <Text style={[styles.sparkleText, { color: colors.accent, fontSize: typography.xs }]}>
                DAILY ALLOWANCE
              </Text>
            </View>
            <Text style={[styles.daysLeftText, { color: colors.textMuted, fontSize: typography.xs }]}>
              {daysLeft} days left in cycle
            </Text>
          </View>

          <Text style={[styles.safeToSpendAmount, { color: colors.text, fontSize: typography.hero }]}>
            {formatCurrency(safeToSpend, 'INR', currencySymbol)}
          </Text>
          <Text style={[styles.safeToSpendLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
            Safe to spend today without breaking your budget
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          {/* Secondary stats inside hero */}
          <View style={styles.heroStatsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
                TOTAL BALANCE
              </Text>
              <Text style={[styles.statValue, { color: colors.text, fontSize: typography.md }]}>
                {formatCurrency(totalBalance, 'INR', currencySymbol)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
                SAVINGS THIS MONTH
              </Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: summary?.netSavings && summary.netSavings >= 0 ? colors.income : colors.expense,
                    fontSize: typography.md,
                  },
                ]}
              >
                {formatCurrency(summary?.netSavings ?? 0, 'INR', currencySymbol)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Income & Expense Quick Cards */}
        <View style={styles.incomeExpenseRow}>
          <Card style={[styles.flowCard, { borderColor: colors.cardBorder }]}>
            <View style={styles.flowHeader}>
              <View style={[styles.flowIconBadge, { backgroundColor: colors.incomeBg }]}>
                <ArrowDownLeft size={18} color={colors.income} />
              </View>
              <Text style={[styles.flowLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
                INCOME
              </Text>
            </View>
            <Text style={[styles.flowAmount, { color: colors.income, fontSize: typography.lg }]}>
              {formatCurrency(totalIncome, 'INR', currencySymbol)}
            </Text>
          </Card>

          <Card style={[styles.flowCard, { borderColor: colors.cardBorder }]}>
            <View style={styles.flowHeader}>
              <View style={[styles.flowIconBadge, { backgroundColor: colors.expenseBg }]}>
                <ArrowUpRight size={18} color={colors.expense} />
              </View>
              <Text style={[styles.flowLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
                EXPENSE
              </Text>
            </View>
            <Text style={[styles.flowAmount, { color: colors.expense, fontSize: typography.lg }]}>
              {formatCurrency(totalExpense, 'INR', currencySymbol)}
            </Text>
          </Card>
        </View>

        {/* Accounts Overview */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.lg }]}>
            Accounts & Wallets
          </Text>
          <TouchableOpacity onPress={() => router.push('/account-management')} activeOpacity={0.7}>
            <Text style={[styles.seeAllText, { color: colors.accent, fontSize: typography.sm }]}>
              Manage
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
          {accounts.map((acc) => (
            <Card
              key={acc.id}
              style={[
                styles.accountCard,
                { borderColor: colors.cardBorder, backgroundColor: colors.card },
              ]}
            >
              <View style={styles.accountTop}>
                <View
                  style={[
                    styles.accountIconWrapper,
                    { backgroundColor: `${acc.colorHex || colors.accent}25` },
                  ]}
                >
                  <CategoryIcon name={acc.icon || 'wallet'} size={18} color={acc.colorHex || colors.accent} />
                </View>
                <Text style={[styles.accountTypeBadge, { color: colors.textMuted, fontSize: typography.xs }]}>
                  {acc.accountType === 5 ? 'ALLOWANCE' : acc.accountType === 1 ? 'CASH' : 'BANK'}
                </Text>
              </View>
              <Text style={[styles.accountName, { color: colors.text, fontSize: typography.base }]}>
                {acc.name}
              </Text>
              <Text style={[styles.accountBalance, { color: colors.text, fontSize: typography.md }]}>
                {formatCurrency(acc.currentBalance, 'INR', currencySymbol)}
              </Text>
            </Card>
          ))}
        </ScrollView>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.lg }]}>
            Recent Transactions
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')} activeOpacity={0.7}>
            <Text style={[styles.seeAllText, { color: colors.accent, fontSize: typography.sm }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No transactions yet"
              description="Tap below to log your first expense in 3 taps!"
              actionTitle="+ Add First Expense"
              onAction={() => router.push('/add-transaction')}
            />
          </Card>
        ) : (
          <View style={styles.transactionsList}>
            {recentTransactions.map((txn) => {
              const isIncome = txn.transactionType === 2;
              const isTransfer = txn.transactionType === 3;
              const color = isIncome ? colors.income : isTransfer ? colors.transfer : colors.expense;

              return (
                <Card
                  key={txn.id}
                  style={[
                    styles.txnCard,
                    { borderColor: colors.cardBorder, backgroundColor: colors.card },
                  ]}
                  onPress={() => router.push('/(tabs)/transactions')}
                >
                  <View style={styles.txnLeft}>
                    <View
                      style={[
                        styles.txnIconWrapper,
                        { backgroundColor: `${txn.categoryColorHex || colors.accent}20` },
                      ]}
                    >
                      <CategoryIcon
                        name={txn.categoryIcon || 'tag'}
                        size={20}
                        color={txn.categoryColorHex || colors.accent}
                      />
                    </View>
                    <View>
                      <Text style={[styles.txnTitle, { color: colors.text, fontSize: typography.base }]}>
                        {txn.categoryName || 'General'}
                      </Text>
                      <Text style={[styles.txnSubtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
                        {txn.accountName} • {formatShortDate(txn.txnDate)}
                        {txn.note ? ` • ${txn.note}` : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.txnAmount, { color, fontSize: typography.base }]}>
                    {isIncome ? '+' : isTransfer ? '' : '-'}
                    {formatCurrency(txn.amount, 'INR', currencySymbol)}
                  </Text>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button for Quick Add */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent,
            borderRadius: radius.full,
            shadowColor: colors.accent,
          },
        ]}
        activeOpacity={0.85}
        onPress={() => router.push('/add-transaction')}
      >
        <Plus size={26} color="#FFFFFF" />
        <Text style={[styles.fabText, { fontSize: typography.sm }]}>Add Expense</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    fontWeight: '600',
    marginBottom: 2,
  },
  titleText: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontWeight: '800',
  },
  heroCard: {
    padding: 18,
    marginBottom: 16,
  },
  safeToSpendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  sparkleText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  daysLeftText: {
    fontWeight: '600',
  },
  safeToSpendAmount: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  safeToSpendLabel: {
    marginTop: 4,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#262F48',
    marginHorizontal: 12,
  },
  statLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '700',
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  flowCard: {
    flex: 1,
    padding: 14,
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  flowIconBadge: {
    padding: 6,
    borderRadius: 8,
  },
  flowLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  flowAmount: {
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontWeight: '700',
  },
  accountsScroll: {
    marginBottom: 20,
  },
  accountCard: {
    width: 150,
    padding: 14,
    marginRight: 12,
  },
  accountTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountIconWrapper: {
    padding: 8,
    borderRadius: 10,
  },
  accountTypeBadge: {
    fontWeight: '700',
  },
  accountName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  accountBalance: {
    fontWeight: '800',
  },
  emptyCard: {
    marginBottom: 20,
  },
  transactionsList: {
    gap: 10,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txnIconWrapper: {
    padding: 10,
    borderRadius: 12,
  },
  txnTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  txnSubtitle: {
    fontWeight: '500',
  },
  txnAmount: {
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
