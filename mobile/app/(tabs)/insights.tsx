import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, PieChart, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/settingsStore';
import { summaryService } from '../../services/summaryService';
import { formatCurrency } from '../../utils/money';
import { getCurrentMonthName, formatShortDate } from '../../utils/dates';
import { Card } from '../../components/Card';
import { CategoryIcon } from '../../components/CategoryIcon';
import { EmptyState } from '../../components/EmptyState';

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
  const { colors, typography, radius } = useTheme();
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const {
    data: categoryBreakdown = [],
    isLoading: catLoading,
    refetch: refetchCat,
  } = useQuery({
    queryKey: ['category-summary', currentMonth, currentYear],
    queryFn: () => summaryService.getCategorySummary(currentMonth, currentYear, 1),
  });

  const {
    data: dailyBreakdown = [],
    isLoading: dailyLoading,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: ['daily-summary', currentMonth, currentYear],
    queryFn: () => summaryService.getDailySummary(currentMonth, currentYear),
  });

  const {
    data: monthlySummary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['monthly-summary', currentMonth, currentYear],
    queryFn: () => summaryService.getMonthlySummary(currentMonth, currentYear),
  });

  const isLoading = catLoading || dailyLoading || summaryLoading;

  const onRefresh = async () => {
    await Promise.all([refetchCat(), refetchDaily(), refetchSummary()]);
  };

  const totalSpent = monthlySummary?.totalExpense ?? 0;
  const maxDailyExpense = dailyBreakdown.reduce((max, d) => Math.max(max, d.expenseTotal), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.xl }]}>
            Spending Insights
          </Text>

          {/* Month Selector */}
          <View style={[styles.monthPicker, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7} style={styles.monthNavBtn}>
              <ChevronLeft size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.text, fontSize: typography.xs }]}>
              {getCurrentMonthName(currentMonth).slice(0, 3)} {currentYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7} style={styles.monthNavBtn}>
              <ChevronRight size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Spent Headline Card */}
        <Card style={[styles.spentCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.spentLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
            TOTAL SPENT THIS PERIOD
          </Text>
          <Text style={[styles.spentAmount, { color: colors.text, fontSize: typography.hero }]}>
            {formatCurrency(totalSpent, 'INR', currencySymbol)}
          </Text>
          <Text style={[styles.spentSubtitle, { color: colors.textMuted, fontSize: typography.xs }]}>
            Income: {formatCurrency(monthlySummary?.totalIncome ?? 0, 'INR', currencySymbol)} • Net:{' '}
            {formatCurrency(monthlySummary?.netSavings ?? 0, 'INR', currencySymbol)}
          </Text>
        </Card>

        {/* Daily Spending Trend Chart */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.lg }]}>
            Daily Activity
          </Text>
        </View>

        {dailyBreakdown.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState title="No daily activity" description="Expenses logged this month will show up here." />
          </Card>
        ) : (
          <Card style={[styles.dailyChartCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartBarsRow}>
              {dailyBreakdown.map((item, idx) => {
                const heightPercent = maxDailyExpense > 0 ? Math.max(8, Math.round((item.expenseTotal / maxDailyExpense) * 100)) : 8;
                const isPeak = maxDailyExpense > 0 && item.expenseTotal === maxDailyExpense;

                return (
                  <View key={idx} style={styles.barColumn}>
                    <Text
                      style={[
                        styles.barAmountTop,
                        { color: isPeak ? colors.accent : colors.textMuted, fontSize: 9 },
                      ]}
                    >
                      {item.expenseTotal > 0 ? formatCurrency(item.expenseTotal, 'INR', currencySymbol).replace('.00', '') : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: isPeak ? colors.accent : item.expenseTotal > 0 ? `${colors.accent}70` : colors.inputBg,
                            borderRadius: radius.sm,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barDateLabel, { color: colors.textSecondary, fontSize: 10 }]}>
                      {formatShortDate(item.txnDate).split(' ')[0]}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </Card>
        )}

        {/* Category Breakdown */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.lg }]}>
            Categories Breakdown
          </Text>
        </View>

        {categoryBreakdown.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState title="No category expenses" description="You haven't spent in any category yet this month." />
          </Card>
        ) : (
          <View style={styles.categoriesList}>
            {categoryBreakdown.map((cat) => (
              <Card
                key={cat.categoryId}
                style={[styles.catBreakdownCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={styles.catBreakdownTop}>
                  <View style={styles.catBreakdownLeft}>
                    <View style={[styles.catIconWrapper, { backgroundColor: `${cat.categoryColorHex || colors.accent}20` }]}>
                      <CategoryIcon name={cat.categoryIcon || 'tag'} size={18} color={cat.categoryColorHex || colors.accent} />
                    </View>
                    <View>
                      <Text style={[styles.catName, { color: colors.text, fontSize: typography.base }]}>
                        {cat.categoryName}
                      </Text>
                      <Text style={[styles.catTxnCount, { color: colors.textSecondary, fontSize: typography.xs }]}>
                        {cat.transactionCount} transactions
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.catAmount, { color: colors.text, fontSize: typography.base }]}>
                      {formatCurrency(cat.totalAmount, 'INR', currencySymbol)}
                    </Text>
                    <Text style={[styles.catPercent, { color: cat.categoryColorHex || colors.accent, fontSize: typography.xs }]}>
                      {cat.percentage}% of total
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={[styles.progressTrack, { backgroundColor: colors.inputBg, borderRadius: radius.full }]}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.categoryColorHex || colors.accent,
                        borderRadius: radius.full,
                      },
                    ]}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  monthNavBtn: {
    padding: 6,
  },
  monthLabel: {
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  spentCard: {
    padding: 18,
    marginBottom: 20,
  },
  spentLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  spentAmount: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  spentSubtitle: {
    marginTop: 6,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '800',
  },
  emptyCard: {
    marginBottom: 20,
  },
  dailyChartCard: {
    padding: 16,
    marginBottom: 20,
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    height: 140,
    paddingTop: 16,
  },
  barColumn: {
    alignItems: 'center',
    width: 32,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barAmountTop: {
    marginBottom: 4,
    fontWeight: '600',
  },
  barTrack: {
    width: 14,
    height: 90,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
  },
  barDateLabel: {
    marginTop: 6,
    fontWeight: '600',
  },
  categoriesList: {
    gap: 10,
  },
  catBreakdownCard: {
    padding: 14,
  },
  catBreakdownTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  catBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catIconWrapper: {
    padding: 8,
    borderRadius: 10,
  },
  catName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  catTxnCount: {
    fontWeight: '500',
  },
  catAmount: {
    fontWeight: '800',
  },
  catPercent: {
    fontWeight: '700',
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});
