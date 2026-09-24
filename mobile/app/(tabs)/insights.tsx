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
import Svg, { Path, G, Circle, Text as SvgText, Rect } from 'react-native-svg';
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
  '#FF6363', // Coral Red (Apparel / Primary)
  '#F97316', // Vibrant Orange (Food)
  '#FBBF24', // Amber Yellow (Gift)
  '#FACC15', // Bright Yellow (Household)
  '#84CC16', // Lime Green (Social Life)
  '#10B981', // Emerald Green
  '#06B6D4', // Cyan
  '#38BDF8', // Sky Blue
  '#818CF8', // Indigo
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
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

/**
 * Splits text into lines naturally by words for clean SVG multi-line rendering
 */
export function wrapCategoryText(text: string, isSelected: boolean = false, maxCharsPerLine: number = 14): string[] {
  if (!text) return [];
  const clean = text.trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // If selected, allow full text without clipping
  if (isSelected) {
    return lines;
  }

  // If unselected, limit to max 2 lines
  if (lines.length > 2) {
    return [lines[0], lines[1] + '…'];
  }

  return lines;
}

export default function InsightsScreen() {
  const { colors, typography, radius, isDark } = useTheme();
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

  // Prepare Pie Data with accurate percentages and colors
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

  // Chart Geometry & Dynamic Multi-line Leader Line Layout Calculations
  const chartWidth = Math.min(width - 24, 420);
  const chartHeight = 310;
  const cx = chartWidth / 2;
  const cy = chartHeight / 2;
  const pieRadius = 66;

  const slicesWithLayout = useMemo(() => {
    if (pieData.length === 0 || activeTotal === 0) return [];

    let currentAngle = -Math.PI / 2; // start from top (12 o'clock)

    const items = pieData.map((slice, index) => {
      const fraction = Math.max(0, Math.min(1, slice.percentage / 100));
      const angle = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      const midAngle = startAngle + angle / 2;
      currentAngle = endAngle;

      const isSelected = selectedCategoryName === slice.categoryName;
      const isDimmed = selectedCategoryName !== null && !isSelected;

      // Outer edge of the slice
      const edgeX = cx + pieRadius * Math.cos(midAngle);
      const edgeY = cy + pieRadius * Math.sin(midAngle);

      // Radial projection for callout bend
      const outRadius = pieRadius + 18;
      const outX = cx + outRadius * Math.cos(midAngle);
      const outY = cy + outRadius * Math.sin(midAngle);

      const isRight = Math.cos(midAngle) >= 0;

      // Calculate wrapped lines for this category
      const nameLines = wrapCategoryText(slice.categoryName, isSelected, isRight ? 14 : 14);

      return {
        ...slice,
        index,
        fraction,
        angle,
        startAngle,
        endAngle,
        midAngle,
        edgeX,
        edgeY,
        outX,
        outY,
        isRight,
        isSelected,
        isDimmed,
        nameLines,
        targetY: outY,
      };
    });

    // Slices to show callout leader lines for (all valid categories with >= 0.5%)
    const rightItems = items.filter((it) => it.isRight && it.percentage >= 0.5);
    const leftItems = items.filter((it) => !it.isRight && it.percentage >= 0.5);

    // Sort by Y position (top to bottom)
    rightItems.sort((a, b) => a.outY - b.outY);
    leftItems.sort((a, b) => a.outY - b.outY);

    const minY = 26;
    const maxY = chartHeight - 26;

    const adjustVerticalSpacing = (list: typeof items) => {
      if (list.length === 0) return;

      const targets = list.map((it) => it.outY);

      // Downward pass with dynamic gap based on line count
      for (let i = 1; i < targets.length; i++) {
        const prevItem = list[i - 1];
        const dynamicGap = Math.max(32, (prevItem.nameLines.length + 1) * 14 + 10);
        if (targets[i] < targets[i - 1] + dynamicGap) {
          targets[i] = targets[i - 1] + dynamicGap;
        }
      }

      // Upward pass if exceeding bottom
      if (targets[targets.length - 1] > maxY) {
        targets[targets.length - 1] = maxY;
        for (let i = targets.length - 2; i >= 0; i--) {
          const nextItem = list[i + 1];
          const dynamicGap = Math.max(32, (list[i].nameLines.length + 1) * 14 + 10);
          if (targets[i] > targets[i + 1] - dynamicGap) {
            targets[i] = targets[i + 1] - dynamicGap;
          }
        }
      }

      // Clamp all within canvas bounds
      for (let i = 0; i < targets.length; i++) {
        targets[i] = Math.max(minY, Math.min(maxY, targets[i]));
      }

      list.forEach((it, idx) => {
        it.targetY = targets[idx];
      });
    };

    adjustVerticalSpacing(rightItems);
    adjustVerticalSpacing(leftItems);

    return items;
  }, [pieData, activeTotal, selectedCategoryName, cx, cy, pieRadius, chartHeight]);

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
                  color: activeTab === 2 ? (isDark ? '#34D399' : colors.income) : colors.textSecondary,
                  fontWeight: activeTab === 2 ? '700' : '500',
                  fontSize: typography.base,
                },
              ]}
            >
              Income {totalIncome > 0 ? formatCurrency(totalIncome, 'INR', currencySymbol) : ''}
            </Text>
            {activeTab === 2 && (
              <View style={[styles.activeUnderline, { backgroundColor: isDark ? '#34D399' : colors.income }]} />
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
                  color: activeTab === 1 ? (isDark ? '#F87171' : colors.expense) : colors.textSecondary,
                  fontWeight: activeTab === 1 ? '700' : '500',
                  fontSize: typography.base,
                },
              ]}
            >
              Expenses {formatCurrency(totalExpense > 0 ? totalExpense : (activeTab === 1 ? activeTotal : 0), 'INR', currencySymbol)}
            </Text>
            {activeTab === 1 && (
              <View style={[styles.activeUnderline, { backgroundColor: isDark ? '#F87171' : colors.expense }]} />
            )}
          </TouchableOpacity>
        </View>

        {/* Pie Chart Section with Curvy Leader Lines */}
        {slicesWithLayout.length > 0 && activeTotal > 0 ? (
          <View style={styles.chartWrapper}>
            <Svg width={chartWidth} height={chartHeight}>
              {/* Render Solid Pie Slices */}
              <G>
                {slicesWithLayout.length === 1 ? (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={pieRadius}
                    fill={slicesWithLayout[0].color}
                    stroke={colors.bg}
                    strokeWidth={1.5}
                    onPress={() =>
                      setSelectedCategoryName(
                        slicesWithLayout[0].isSelected ? null : slicesWithLayout[0].categoryName
                      )
                    }
                  />
                ) : (
                  slicesWithLayout.map((slice, idx) => {
                    const x1 = cx + pieRadius * Math.cos(slice.startAngle);
                    const y1 = cy + pieRadius * Math.sin(slice.startAngle);
                    const x2 = cx + pieRadius * Math.cos(slice.endAngle);
                    const y2 = cy + pieRadius * Math.sin(slice.endAngle);
                    const largeArc = slice.angle > Math.PI ? 1 : 0;

                    const pathData = [
                      `M ${cx} ${cy}`,
                      `L ${x1} ${y1}`,
                      `A ${pieRadius} ${pieRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
                      'Z',
                    ].join(' ');

                    return (
                      <Path
                        key={slice.categoryId ? `slice-${slice.categoryId}` : `slice-${idx}`}
                        d={pathData}
                        fill={slice.color}
                        opacity={slice.isDimmed ? 0.25 : 1}
                        stroke={colors.bg}
                        strokeWidth={1.5}
                        onPress={() =>
                          setSelectedCategoryName(slice.isSelected ? null : slice.categoryName)
                        }
                      />
                    );
                  })
                )}
              </G>

              {/* Render Curvy Leader Lines & Category Multi-line Labels */}
              <G>
                {slicesWithLayout
                  .filter((it) => it.percentage >= 0.5)
                  .map((it, idx) => {
                    const isRight = it.isRight;
                    const targetY = it.targetY;
                    const isSelected = it.isSelected;

                    // End anchor for leader line
                    const xEnd = isRight
                      ? Math.min(chartWidth - 6, Math.max(cx + pieRadius + 28, it.outX + 16))
                      : Math.max(6, Math.min(cx - pieRadius - 28, it.outX - 16));

                    // Smooth Bezier curve control points
                    const cp1x = (it.edgeX + it.outX) / 2;
                    const cp1y = (it.edgeY + it.outY) / 2;
                    const cp2x = isRight ? xEnd - 10 : xEnd + 10;
                    const cp2y = targetY;

                    const leaderPath = `M ${it.edgeX} ${it.edgeY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xEnd} ${targetY}`;
                    const emoji = getCategoryEmoji(it.categoryName, it.categoryIcon);
                    const nameLines = it.nameLines;
                    const percentText = `${it.percentage.toFixed(1)} %`;

                    const lineHeight = 13;
                    const totalBlockHeight = (nameLines.length + 1) * lineHeight;
                    const startY = targetY - totalBlockHeight / 2 + 10;

                    return (
                      <G
                        key={`leader-${it.categoryId || idx}`}
                        onPress={() =>
                          setSelectedCategoryName(it.isSelected ? null : it.categoryName)
                        }
                      >
                        {/* Slice Edge Anchor Dot */}
                        <Circle
                          cx={it.edgeX}
                          cy={it.edgeY}
                          r={isSelected ? 3.5 : 2.5}
                          fill={it.color}
                          opacity={it.isDimmed ? 0.25 : 1}
                        />

                        {/* Smooth Curvy Leader Line */}
                        <Path
                          d={leaderPath}
                          stroke={it.color}
                          strokeWidth={isSelected ? 2.2 : 1.5}
                          fill="none"
                          opacity={it.isDimmed ? 0.25 : 0.9}
                        />

                        {/* Multi-line Category Name */}
                        {nameLines.map((lineText, lIdx) => {
                          const lineY = startY + lIdx * lineHeight;
                          return (
                            <SvgText
                              key={`nl-${lIdx}`}
                              x={isRight ? xEnd + 5 : xEnd - 5}
                              y={lineY}
                              fill={isSelected ? it.color : colors.text}
                              fontSize={isSelected ? 11.5 : 10.5}
                              fontWeight={isSelected ? '800' : '700'}
                              textAnchor={isRight ? 'start' : 'end'}
                            >
                              {lIdx === 0 ? `${emoji} ${lineText}` : lineText}
                            </SvgText>
                          );
                        })}

                        {/* Percentage and formatted amount when selected */}
                        <SvgText
                          x={isRight ? xEnd + 5 : xEnd - 5}
                          y={startY + nameLines.length * lineHeight + 1}
                          fill={
                            isSelected
                              ? it.color
                              : isDark
                              ? '#9CA3AF'
                              : colors.textSecondary
                          }
                          fontSize={isSelected ? 10.5 : 9.5}
                          fontWeight={isSelected ? '800' : '600'}
                          textAnchor={isRight ? 'start' : 'end'}
                        >
                          {isSelected
                            ? `${percentText} • ${formatCurrency(it.totalAmount, 'INR', currencySymbol).replace('.00', '')}`
                            : percentText}
                        </SvgText>
                      </G>
                    );
                  })}
              </G>
            </Svg>
          </View>
        ) : (
          /* Clean Non-overlapping Empty State Card */
          <Card
            style={[
              styles.emptyChartCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={[styles.emptyChartIconCircle, { backgroundColor: `${colors.accent}15` }]}>
              <PieIcon size={38} color={colors.accent} />
            </View>
            <Text style={[styles.emptyChartTitle, { color: colors.text, fontSize: typography.md }]}>
              No {activeTab === 1 ? 'expenses' : 'income'} this period
            </Text>
            <Text
              style={[
                styles.emptyChartSub,
                { color: colors.textSecondary, fontSize: typography.sm },
              ]}
            >
              Tap the + button below to log your {activeTab === 1 ? 'expense' : 'income'} transactions.
            </Text>
          </Card>
        )}

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
          {pieData.length === 0 ? null : (
            pieData.map((cat, idx) => {
              const isSelected = selectedCategoryName === cat.categoryName;
              const emoji = getCategoryEmoji(cat.categoryName, cat.categoryIcon);
              const percentDisplay = cat.percentage < 1 ? '<1%' : `${cat.percentage.toFixed(0)}%`;

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

                    {/* Center: Emoji + Full Name + Txn Count */}
                    <View style={styles.categoryInfoCenter}>
                      <Text style={styles.categoryEmoji}>{emoji}</Text>
                      <View style={styles.categoryNameColumn}>
                        <Text
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
                const heightPercent =
                  maxDailyExpense > 0
                    ? Math.max(8, Math.round((item.expenseTotal / maxDailyExpense) * 100))
                    : 8;
                const isPeak = maxDailyExpense > 0 && item.expenseTotal === maxDailyExpense;

                return (
                  <View key={idx} style={styles.barColumn}>
                    <Text
                      style={[
                        styles.barAmountTop,
                        { color: isPeak ? colors.accent : colors.textMuted, fontSize: 9 },
                      ]}
                    >
                      {item.expenseTotal > 0
                        ? formatCurrency(item.expenseTotal, 'INR', currencySymbol).replace('.00', '')
                        : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: isPeak
                              ? colors.accent
                              : item.expenseTotal > 0
                              ? `${colors.accent}70`
                              : colors.inputBg,
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
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  emptyChartCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  emptyChartIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyChartTitle: {
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyChartSub: {
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
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
    minWidth: 44,
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
    flexWrap: 'wrap',
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
