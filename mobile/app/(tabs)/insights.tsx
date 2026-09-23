import React, { useState } from 'react';
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
import Svg, { Path, G, Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BarChart3,
  PieChart as PieIcon,
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
  '#FF5A78', // Coral Red (Apparel/Primary)
  '#FB923C', // Warm Orange (Food)
  '#FBBF24', // Gold (Gift)
  '#FACC15', // Yellow (Household)
  '#4ADE80', // Green (Social Life)
  '#38BDF8', // Cyan (Transport)
  '#818CF8', // Indigo (Entertainment)
  '#C084FC', // Purple (Education)
  '#F472B6', // Pink (Health)
];

export function getCategoryEmoji(categoryName: string, iconName?: string): string {
  const name = (categoryName || '').toLowerCase().trim();
  const icon = (iconName || '').toLowerCase().trim();

  if (name.includes('apparel') || name.includes('cloth') || name.includes('dress') || name.includes('shopping') || icon === 'shopping-bag') return '👘';
  if (name.includes('food') || name.includes('dining') || name.includes('restaurant') || name.includes('lunch') || name.includes('dinner') || icon === 'utensils') return '🍜';
  if (name.includes('gift') || name.includes('allowance') || name.includes('pocket') || icon === 'gift') return '🎁';
  if (name.includes('house') || name.includes('home') || name.includes('furniture') || name.includes('rent')) return '🪑';
  if (name.includes('social') || name.includes('friend') || name.includes('party')) return '🧑‍🤝‍🧑';
  if (name.includes('bill') || name.includes('utilit') || name.includes('electric') || name.includes('water') || icon === 'receipt') return '⚡';
  if (name.includes('entertain') || name.includes('game') || name.includes('movie') || icon === 'gamepad' || icon === 'film') return '🎮';
  if (name.includes('health') || name.includes('fit') || name.includes('gym') || name.includes('medical') || icon === 'heart') return '❤️';
  if (name.includes('transport') || name.includes('car') || name.includes('commute') || name.includes('fuel') || icon === 'car') return '🚗';
  if (name.includes('gadget') || name.includes('tech') || name.includes('phone') || icon === 'smartphone') return '📱';
  if (name.includes('salary') || name.includes('paycheck') || name.includes('job') || icon === 'briefcase') return '💼';
  if (name.includes('freelance') || name.includes('gig') || name.includes('laptop') || icon === 'laptop') return '💻';
  if (name.includes('invest') || name.includes('dividend') || icon === 'trending-up') return '📈';
  if (name.includes('education') || name.includes('book') || name.includes('course')) return '📚';
  if (name.includes('beauty') || name.includes('salon')) return '💄';
  if (name.includes('travel') || name.includes('flight') || name.includes('vacation')) return '✈️';
  if (name.includes('pet') || name.includes('dog') || name.includes('cat')) return '🐾';
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

  const totalExpense = monthlySummary?.totalExpense ?? 0;
  const totalIncome = monthlySummary?.totalIncome ?? 0;
  const totalActiveAmount = activeTab === 1 ? totalExpense : totalIncome;

  const maxDailyExpense = dailyBreakdown.reduce((max, d) => Math.max(max, d.expenseTotal), 0);

  // Prepare Pie Chart Slices
  const pieData = categoryBreakdown.map((item, index) => {
    const color = item.categoryColorHex || SLICE_COLORS[index % SLICE_COLORS.length];
    return {
      ...item,
      color,
    };
  });

  const chartSize = Math.min(width - 20, 340);
  const center = chartSize / 2;
  const radiusVal = Math.round(chartSize * 0.26);

  // Build SVG Pie Paths
  const renderPieSlices = () => {
    if (pieData.length === 0 || totalActiveAmount === 0) {
      return (
        <Circle
          cx={center}
          cy={center}
          r={radiusVal}
          fill="none"
          stroke={colors.cardBorder}
          strokeWidth={3}
          strokeDasharray="6,6"
        />
      );
    }

    if (pieData.length === 1) {
      const slice = pieData[0];
      return (
        <G>
          <Circle
            cx={center}
            cy={center}
            r={radiusVal}
            fill={slice.color}
            opacity={selectedCategoryName && selectedCategoryName !== slice.categoryName ? 0.4 : 1}
          />
          <SvgText
            x={center}
            y={center - 6}
            fill="#FFFFFF"
            fontSize="14"
            fontWeight="700"
            textAnchor="middle"
          >
            {slice.categoryName}
          </SvgText>
          <SvgText
            x={center}
            y={center + 14}
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="800"
            textAnchor="middle"
          >
            100%
          </SvgText>
        </G>
      );
    }

    let startAngle = -Math.PI / 2;
    return pieData.map((slice, idx) => {
      const angle = (slice.percentage / 100) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const midAngle = startAngle + angle / 2;

      const x1 = center + radiusVal * Math.cos(startAngle);
      const y1 = center + radiusVal * Math.sin(startAngle);
      const x2 = center + radiusVal * Math.cos(endAngle);
      const y2 = center + radiusVal * Math.sin(endAngle);

      const largeArc = angle > Math.PI ? 1 : 0;
      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radiusVal} ${radiusVal} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      // Callout Line & Label calculation
      const shouldDrawCallout = slice.percentage >= 1.5 && idx < 6;

      const innerLineX = center + (radiusVal - 2) * Math.cos(midAngle);
      const innerLineY = center + (radiusVal - 2) * Math.sin(midAngle);

      const isRight = Math.cos(midAngle) >= 0;
      const elbowDist = radiusVal + 28 + (idx % 2 === 1 ? 16 : 0);
      const elbowX = center + elbowDist * Math.cos(midAngle);
      const elbowY = center + elbowDist * Math.sin(midAngle);
      const tipX = isRight ? elbowX + 22 : elbowX - 22;
      const tipY = elbowY;

      const textAnchor = isRight ? 'start' : 'end';
      const textX = isRight ? tipX + 5 : tipX - 5;
      const catName = slice.categoryName || 'General';
      const displayName = catName.length > 15 ? `${catName.slice(0, 14)}…` : catName;

      const isSelected = selectedCategoryName === slice.categoryName;
      const isDimmed = selectedCategoryName !== null && !isSelected;

      startAngle = endAngle;

      return (
        <G key={slice.categoryId || idx}>
          <Path
            d={pathData}
            fill={slice.color}
            opacity={isDimmed ? 0.35 : 1}
            stroke={colors.bg}
            strokeWidth={1.5}
            onPress={() => {
              setSelectedCategoryName(isSelected ? null : slice.categoryName);
            }}
          />
          {shouldDrawCallout && (
            <G opacity={isDimmed ? 0.3 : 1}>
              <Polyline
                points={`${innerLineX},${innerLineY} ${elbowX},${elbowY} ${tipX},${tipY}`}
                fill="none"
                stroke={slice.color}
                strokeWidth={1.4}
              />
              <SvgText
                x={textX}
                y={tipY - 3}
                fill={colors.text}
                fontSize="11"
                fontWeight="700"
                textAnchor={textAnchor}
              >
                {displayName}
              </SvgText>
              <SvgText
                x={textX}
                y={tipY + 11}
                fill={colors.textSecondary}
                fontSize="10"
                fontWeight="600"
                textAnchor={textAnchor}
              >
                {slice.percentage.toFixed(1)} %
              </SvgText>
            </G>
          )}
        </G>
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
              Expenses {formatCurrency(totalExpense, 'INR', currencySymbol)}
            </Text>
            {activeTab === 1 && (
              <View style={[styles.activeUnderline, { backgroundColor: colors.expense }]} />
            )}
          </TouchableOpacity>
        </View>

        {/* Center Pie Chart Area */}
        <View style={styles.chartContainer}>
          <Svg width={chartSize} height={chartSize}>
            {renderPieSlices()}
          </Svg>

          {pieData.length === 0 && (
            <View style={styles.emptyPieOverlay}>
              <PieIcon size={32} color={colors.textMuted} />
              <Text style={[styles.emptyPieText, { color: colors.textMuted, fontSize: typography.xs }]}>
                No {activeTab === 1 ? 'expenses' : 'income'} recorded
              </Text>
            </View>
          )}
        </View>

        {/* Selected Category Highlight Banner */}
        {selectedCategoryName && (
          <View style={[styles.selectedBanner, { backgroundColor: colors.card, borderColor: colors.accent }]}>
            <Text style={[styles.selectedBannerText, { color: colors.text, fontSize: typography.sm }]}>
              Filtered: <Text style={{ fontWeight: '800', color: colors.accent }}>{selectedCategoryName}</Text>
            </Text>
            <TouchableOpacity onPress={() => setSelectedCategoryName(null)}>
              <Text style={[styles.clearFilterText, { color: colors.accent, fontSize: typography.xs }]}>
                Show All
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Breakdown List (Exact match with screenshot) */}
        <View style={styles.categoriesListContainer}>
          {pieData.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                title={`No ${activeTab === 1 ? 'expenses' : 'income'} this period`}
                description="Tap the + button below to log your transactions."
              />
            </Card>
          ) : (
            pieData.map((cat) => {
              const isSelected = selectedCategoryName === cat.categoryName;
              const emoji = getCategoryEmoji(cat.categoryName, cat.categoryIcon);
              return (
                <TouchableOpacity
                  key={cat.categoryId}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategoryName(isSelected ? null : cat.categoryName)}
                  style={[
                    styles.categoryRowItem,
                    {
                      backgroundColor: isSelected ? `${cat.color}20` : colors.card,
                      borderColor: isSelected ? cat.color : colors.cardBorder,
                    },
                  ]}
                >
                  {/* Left: Solid Colored Percentage Badge */}
                  <View style={[styles.percentBadge, { backgroundColor: cat.color, borderRadius: radius.sm }]}>
                    <Text style={styles.percentBadgeText}>
                      {cat.percentage < 1 ? '<1%' : `${Math.round(cat.percentage)}%`}
                    </Text>
                  </View>

                  {/* Center: Category Emoji + Name */}
                  <View style={styles.categoryInfoCenter}>
                    <Text style={styles.categoryEmoji}>{emoji}</Text>
                    <Text style={[styles.categoryNameText, { color: colors.text, fontSize: typography.base }]}>
                      {cat.categoryName}
                    </Text>
                  </View>

                  {/* Right: Formatted Total Amount */}
                  <Text style={[styles.categoryAmountText, { color: colors.text, fontSize: typography.base }]}>
                    {formatCurrency(cat.totalAmount, 'INR', currencySymbol)}
                  </Text>
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
    marginVertical: 12,
    position: 'relative',
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
    marginBottom: 12,
  },
  selectedBannerText: {},
  clearFilterText: {
    fontWeight: '700',
  },
  categoriesListContainer: {
    gap: 10,
    marginBottom: 20,
  },
  categoryRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  percentBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  percentBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  categoryInfoCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  categoryNameText: {
    fontWeight: '700',
  },
  categoryAmountText: {
    fontWeight: '800',
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
