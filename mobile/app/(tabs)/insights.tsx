import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path, G, Circle } from 'react-native-svg';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BarChart3,
  PieChart as PieIcon,
  Layers,
} from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/settingsStore';
import { summaryService } from '../../services/summaryService';
import { formatCurrency } from '../../utils/money';
import { getCurrentMonthName, formatShortDate } from '../../utils/dates';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';

const { width } = Dimensions.get('window');

const SLICE_COLORS = [
  '#8B5CF6', // Purple / Accent
  '#FF5A78', // Coral Red / Pink
  '#FB923C', // Warm Orange
  '#10B981', // Emerald Green
  '#38BDF8', // Sky Blue
  '#FBBF24', // Amber Gold
  '#EC4899', // Fuchsia
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F43F5E', // Rose
  '#A855F7', // Violet
  '#06B6D4', // Cyan
];

export function getCategoryEmoji(categoryName: string, iconName?: string): string {
  const name = (categoryName || '').toLowerCase().trim();
  const icon = (iconName || '').toLowerCase().trim();

  if (name.includes('apparel') || name.includes('cloth') || name.includes('dress') || name.includes('shopping') || icon === 'shopping-bag') return '👘';
  if (name.includes('food') || name.includes('dining') || name.includes('restaurant') || name.includes('lunch') || name.includes('dinner') || name.includes('grocery') || name.includes('groceries') || icon === 'utensils') return '🍜';
  if (name.includes('gift') || name.includes('allowance') || name.includes('pocket') || icon === 'gift') return '🎁';
  if (name.includes('house') || name.includes('home') || name.includes('furniture') || name.includes('rent')) return '🪑';
  if (name.includes('social') || name.includes('friend') || name.includes('party')) return '🧑‍🤝‍🧑';
  if (name.includes('bill') || name.includes('utilit') || name.includes('electric') || name.includes('water') || name.includes('wifi') || name.includes('internet') || icon === 'receipt') return '⚡';
  if (name.includes('entertain') || name.includes('game') || name.includes('movie') || name.includes('netflix') || icon === 'gamepad' || icon === 'film') return '🎮';
  if (name.includes('health') || name.includes('fit') || name.includes('gym') || name.includes('medical') || name.includes('medicine') || icon === 'heart') return '❤️';
  if (name.includes('transport') || name.includes('car') || name.includes('commute') || name.includes('fuel') || name.includes('petrol') || name.includes('taxi') || name.includes('uber') || icon === 'car') return '🚗';
  if (name.includes('gadget') || name.includes('tech') || name.includes('phone') || icon === 'smartphone') return '📱';
  if (name.includes('salary') || name.includes('paycheck') || name.includes('job') || icon === 'briefcase') return '💼';
  if (name.includes('freelance') || name.includes('gig') || name.includes('side') || icon === 'laptop') return '💻';
  if (name.includes('invest') || name.includes('stock') || name.includes('crypto') || name.includes('dividend') || icon === 'trending-up') return '📈';
  if (name.includes('education') || name.includes('book') || name.includes('school') || name.includes('course')) return '📚';
  if (name.includes('beauty') || name.includes('salon') || name.includes('hair') || name.includes('spa')) return '💄';
  if (name.includes('travel') || name.includes('flight') || name.includes('vacation') || name.includes('hotel')) return '✈️';
  if (name.includes('pet') || name.includes('dog') || name.includes('cat')) return '🐾';
  if (name.includes('personal') || name.includes('self')) return '✨';
  return '🏷️';
}

export default function InsightsScreen() {
  const { colors, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<1 | 2>(1); // 1 = Expense, 2 = Income
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [periodMode, setPeriodMode] = useState<'Monthly' | 'Weekly' | 'Yearly'>('Monthly');
  const [showDailyActivity, setShowDailyActivity] = useState(false);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedCategoryName(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedCategoryName(null);
  };

  const {
    data: categoryBreakdown = [],
    isLoading: catLoading,
    refetch: refetchCat,
  } = useQuery({
    queryKey: ['category-summary', currentMonth, currentYear, activeTab],
    queryFn: () => summaryService.getCategorySummary(currentMonth, currentYear, activeTab),
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

  // Safe Total Calculations
  const totalExpense = monthlySummary?.totalExpense ?? 0;
  const totalIncome = monthlySummary?.totalIncome ?? 0;
  
  const totalCategoriesAmount = useMemo(() => {
    return categoryBreakdown.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
  }, [categoryBreakdown]);

  const activeTotal = totalCategoriesAmount > 0 
    ? totalCategoriesAmount 
    : (activeTab === 1 ? totalExpense : totalIncome);

  const maxDailyExpense = dailyBreakdown.reduce((max, d) => Math.max(max, d.expenseTotal), 0);

  // Prepare Pie / Donut Data with accurate percentages
  const pieData = useMemo(() => {
    return categoryBreakdown.map((item, index) => {
      const catAmount = Number(item.totalAmount) || 0;
      const computedPercent = totalCategoriesAmount > 0
        ? (catAmount / totalCategoriesAmount) * 100
        : (Number(item.percentage) || 0);

      const color = item.categoryColorHex && item.categoryColorHex.startsWith('#')
        ? item.categoryColorHex
        : SLICE_COLORS[index % SLICE_COLORS.length];

      return {
        ...item,
        totalAmount: catAmount,
        percentage: computedPercent,
        color,
      };
    });
  }, [categoryBreakdown, totalCategoriesAmount]);

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryName) return null;
    return pieData.find((p) => p.categoryName === selectedCategoryName) || null;
  }, [pieData, selectedCategoryName]);

  // Chart Dimensions
  const chartSize = Math.min(width - 32, 280);
  const center = chartSize / 2;
  const outerRadius = chartSize * 0.44;
  const innerRadius = chartSize * 0.29;
  const strokeWidth = outerRadius - innerRadius;
  const ringRadius = (outerRadius + innerRadius) / 2;

  // Build SVG Donut Ring Arcs
  const renderDonutSlices = () => {
    if (pieData.length === 0 || activeTotal === 0) {
      return (
        <Circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke={colors.cardBorder}
          strokeWidth={strokeWidth}
          strokeDasharray="6,6"
        />
      );
    }

    if (pieData.length === 1) {
      const slice = pieData[0];
      return (
        <Circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke={slice.color}
          strokeWidth={strokeWidth}
          opacity={selectedCategoryName && selectedCategoryName !== slice.categoryName ? 0.35 : 1}
        />
      );
    }

    let currentAngle = -Math.PI / 2;
    const circumference = 2 * Math.PI * ringRadius;

    return pieData.map((slice, idx) => {
      const fraction = Math.max(0, Math.min(1, slice.percentage / 100));
      if (fraction <= 0) return null;

      const angle = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      // Donut slice path with inner and outer radii
      const x1Outer = center + outerRadius * Math.cos(startAngle);
      const y1Outer = center + outerRadius * Math.sin(startAngle);
      const x2Outer = center + outerRadius * Math.cos(endAngle);
      const y2Outer = center + outerRadius * Math.sin(endAngle);

      const x1Inner = center + innerRadius * Math.cos(endAngle);
      const y1Inner = center + innerRadius * Math.sin(endAngle);
      const x2Inner = center + innerRadius * Math.cos(startAngle);
      const y2Inner = center + innerRadius * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;
      const isSelected = selectedCategoryName === slice.categoryName;
      const isDimmed = selectedCategoryName !== null && !isSelected;

      const pathData = [
        `M ${x1Outer} ${y1Outer}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
        `L ${x1Inner} ${y1Inner}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
        'Z',
      ].join(' ');

      return (
        <Path
          key={slice.categoryId ? `slice-${slice.categoryId}` : `slice-${idx}`}
          d={pathData}
          fill={slice.color}
          opacity={isDimmed ? 0.25 : 1}
          stroke={colors.bg}
          strokeWidth={2}
          onPress={() => {
            setSelectedCategoryName(isSelected ? null : slice.categoryName);
          }}
        />
      );
    });
  };

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
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header with Month Navigator and Period Badge */}
        <View style={styles.topHeader}>
          <View style={styles.monthNavigator}>
            <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7} style={styles.monthArrowBtn}>
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.monthTitleText, { color: colors.text, fontSize: typography.md }]}>
              {getCurrentMonthName(currentMonth).slice(0, 3)} {currentYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7} style={styles.monthArrowBtn}>
              <ChevronRight size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Period Dropdown Button */}
          <TouchableOpacity
            onPress={() => {
              const modes: ('Monthly' | 'Weekly' | 'Yearly')[] = ['Monthly', 'Weekly', 'Yearly'];
              const next = modes[(modes.indexOf(periodMode) + 1) % modes.length];
              setPeriodMode(next);
            }}
            activeOpacity={0.7}
            style={[styles.periodBadge, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.periodBadgeText, { color: colors.text, fontSize: typography.xs }]}>
              {periodMode}
            </Text>
            <ChevronDown size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Segmented Tabs: Income | Expenses */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.cardBorder }]}>
          {/* Income Tab */}
          <TouchableOpacity
            style={styles.tabBtn}
            activeOpacity={0.7}
            onPress={() => {
              setActiveTab(2);
              setSelectedCategoryName(null);
            }}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === 2 ? colors.income : colors.textSecondary,
                  fontWeight: activeTab === 2 ? '700' : '500',
                  fontSize: typography.base,
                },
              ]}
            >
              Income {totalIncome > 0 ? formatCurrency(totalIncome, 'INR', currencySymbol) : ''}
            </Text>
            {activeTab === 2 && (
              <View style={[styles.activeUnderline, { backgroundColor: colors.income }]} />
            )}
          </TouchableOpacity>

          {/* Expenses Tab */}
          <TouchableOpacity
            style={styles.tabBtn}
            activeOpacity={0.7}
            onPress={() => {
              setActiveTab(1);
              setSelectedCategoryName(null);
            }}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === 1 ? colors.expense : colors.textSecondary,
                  fontWeight: activeTab === 1 ? '700' : '500',
                  fontSize: typography.base,
                },
              ]}
            >
              Expenses {formatCurrency(totalExpense > 0 ? totalExpense : activeTotal, 'INR', currencySymbol)}
            </Text>
            {activeTab === 1 && (
              <View style={[styles.activeUnderline, { backgroundColor: colors.expense }]} />
            )}
          </TouchableOpacity>
        </View>

        {/* Center Donut Chart Area with Interactive Center Details */}
        <View style={styles.chartContainer}>
          <Svg width={chartSize} height={chartSize}>
            <G>{renderDonutSlices()}</G>
          </Svg>

          {/* Center Cutout Info Overlay */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedCategoryName(null)}
            style={[
              styles.centerInfoContainer,
              {
                width: innerRadius * 2 - 8,
                height: innerRadius * 2 - 8,
                borderRadius: innerRadius,
                backgroundColor: colors.card,
              },
            ]}
          >
            {selectedCategory ? (
              <View style={styles.centerTextWrapper}>
                <Text style={styles.centerEmoji}>
                  {getCategoryEmoji(selectedCategory.categoryName, selectedCategory.categoryIcon)}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.centerCategoryName, { color: colors.text, fontSize: typography.sm }]}
                >
                  {selectedCategory.categoryName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.centerAmount, { color: selectedCategory.color, fontSize: typography.base }]}
                >
                  {formatCurrency(selectedCategory.totalAmount, 'INR', currencySymbol)}
                </Text>
                <View style={[styles.centerPill, { backgroundColor: `${selectedCategory.color}20` }]}>
                  <Text style={[styles.centerPillText, { color: selectedCategory.color }]}>
                    {selectedCategory.percentage < 1 ? '<1%' : `${selectedCategory.percentage.toFixed(1)}%`}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.centerTextWrapper}>
                <Text style={[styles.centerSubLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
                  {activeTab === 1 ? 'Total Expense' : 'Total Income'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.centerGrandTotal, { color: colors.text, fontSize: typography.md }]}
                >
                  {formatCurrency(activeTotal, 'INR', currencySymbol)}
                </Text>
                <Text style={[styles.centerCatCount, { color: colors.textMuted, fontSize: 11 }]}>
                  {pieData.length} {pieData.length === 1 ? 'Category' : 'Categories'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {pieData.length === 0 && (
            <View style={styles.emptyPieOverlay}>
              <PieIcon size={30} color={colors.textMuted} />
              <Text style={[styles.emptyPieText, { color: colors.textMuted, fontSize: typography.xs }]}>
                No {activeTab === 1 ? 'expenses' : 'income'} recorded
              </Text>
            </View>
          )}
        </View>

        {/* Selected Category Filter Banner */}
        {selectedCategoryName && (
          <View style={[styles.selectedBanner, { backgroundColor: colors.card, borderColor: colors.accent }]}>
            <View style={styles.bannerLeft}>
              <Layers size={16} color={colors.accent} />
              <Text style={[styles.selectedBannerText, { color: colors.text, fontSize: typography.sm }]}>
                Filtered: <Text style={{ fontWeight: '800', color: colors.accent }}>{selectedCategoryName}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedCategoryName(null)} style={styles.clearFilterBtn}>
              <Text style={[styles.clearFilterText, { color: colors.accent, fontSize: typography.xs }]}>
                Show All
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Breakdown List */}
        <View style={styles.categoriesListContainer}>
          {pieData.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                title={`No ${activeTab === 1 ? 'expenses' : 'income'} this period`}
                description="Tap the + button below to log your transactions."
              />
            </Card>
          ) : (
            pieData.map((cat, idx) => {
              const isSelected = selectedCategoryName === cat.categoryName;
              const emoji = getCategoryEmoji(cat.categoryName, cat.categoryIcon);
              const percentDisplay = cat.percentage < 1 ? '<1%' : `${cat.percentage.toFixed(1)}%`;

              return (
                <TouchableOpacity
                  key={cat.categoryId ? `cat-row-${cat.categoryId}` : `cat-row-${cat.categoryName}-${idx}`}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategoryName(isSelected ? null : cat.categoryName)}
                  style={[
                    styles.categoryCardItem,
                    {
                      backgroundColor: isSelected ? `${cat.color}15` : colors.card,
                      borderColor: isSelected ? cat.color : colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.categoryCardTop}>
                    {/* Left: Percentage Badge */}
                    <View style={[styles.percentBadge, { backgroundColor: cat.color, borderRadius: radius.sm }]}>
                      <Text style={styles.percentBadgeText}>{percentDisplay}</Text>
                    </View>

                    {/* Center: Emoji + Name + Txn Count */}
                    <View style={styles.categoryInfoCenter}>
                      <Text style={styles.categoryEmoji}>{emoji}</Text>
                      <View style={styles.categoryNameColumn}>
                        <Text
                          numberOfLines={1}
                          style={[styles.categoryNameText, { color: colors.text, fontSize: typography.base }]}
                        >
                          {cat.categoryName || 'General'}
                        </Text>
                        <Text style={[styles.categorySubCount, { color: colors.textMuted, fontSize: typography.xs }]}>
                          {cat.transactionCount} {cat.transactionCount === 1 ? 'transaction' : 'transactions'}
                        </Text>
                      </View>
                    </View>

                    {/* Right: Total Amount */}
                    <Text style={[styles.categoryAmountText, { color: colors.text, fontSize: typography.base }]}>
                      {formatCurrency(cat.totalAmount, 'INR', currencySymbol)}
                    </Text>
                  </View>

                  {/* Horizontal Progress Fill Bar */}
                  <View style={[styles.progressBarTrack, { backgroundColor: colors.bgSecondary }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: cat.color,
                          width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Expandable Daily Activity Bar Chart */}
        <TouchableOpacity
          style={[styles.toggleDailyBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          activeOpacity={0.7}
          onPress={() => setShowDailyActivity(!showDailyActivity)}
        >
          <View style={styles.toggleDailyLeft}>
            <BarChart3 size={18} color={colors.accent} />
            <Text style={[styles.toggleDailyTitle, { color: colors.text, fontSize: typography.sm }]}>
              {showDailyActivity ? 'Hide Daily Activity Trend' : 'View Daily Activity Trend'}
            </Text>
          </View>
          <ChevronDown
            size={18}
            color={colors.textSecondary}
            style={{ transform: [{ rotate: showDailyActivity ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {showDailyActivity && (
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthArrowBtn: {
    padding: 6,
  },
  monthTitleText: {
    fontWeight: '800',
    letterSpacing: -0.3,
    minWidth: 90,
    textAlign: 'center',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  periodBadgeText: {
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabLabel: {
    letterSpacing: -0.2,
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 3,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  centerInfoContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  centerTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  centerEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  centerCategoryName: {
    fontWeight: '700',
    maxWidth: 120,
    textAlign: 'center',
  },
  centerAmount: {
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  centerPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  centerPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  centerSubLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerGrandTotal: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  centerCatCount: {
    fontWeight: '600',
  },
  emptyPieOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyPieText: {
    fontWeight: '600',
  },
  selectedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedBannerText: {},
  clearFilterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearFilterText: {
    fontWeight: '700',
  },
  categoriesListContainer: {
    gap: 10,
    marginBottom: 20,
  },
  categoryCardItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  categoryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percentBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  percentBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  categoryInfoCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 2,
  },
  categoryNameColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryNameText: {
    fontWeight: '700',
  },
  categorySubCount: {
    marginTop: 1,
    fontWeight: '500',
  },
  categoryAmountText: {
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyCard: {
    marginBottom: 20,
  },
  toggleDailyBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  toggleDailyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleDailyTitle: {
    fontWeight: '700',
  },
  dailyChartCard: {
    padding: 16,
    marginBottom: 20,
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    height: 130,
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
    height: 80,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
  },
  barDateLabel: {
    marginTop: 6,
    fontWeight: '600',
  },
});
