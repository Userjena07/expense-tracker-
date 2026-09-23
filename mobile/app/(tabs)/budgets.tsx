import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PiggyBank, AlertTriangle, CheckCircle2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/settingsStore';
import { budgetService } from '../../services/budgetService';
import { categoryService } from '../../services/categoryService';
import { summaryService } from '../../services/summaryService';
import { formatCurrency } from '../../utils/money';
import { getCurrentMonthName } from '../../utils/dates';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CategoryIcon } from '../../components/CategoryIcon';
import { EmptyState } from '../../components/EmptyState';
import { Budget } from '../../types/api';

export default function BudgetsScreen() {
  const { colors, typography, radius } = useTheme();
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);
  const queryClient = useQueryClient();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [modalVisible, setModalVisible] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null); // null = overall monthly budget

  const {
    data: budgets = [],
    isLoading: budgetsLoading,
    refetch: refetchBudgets,
  } = useQuery({
    queryKey: ['budgets-list', currentMonth, currentYear],
    queryFn: () => budgetService.getBudgets(currentMonth, currentYear),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-list', 1],
    queryFn: () => categoryService.getCategories(1),
  });

  const { data: summary } = useQuery({
    queryKey: ['monthly-summary'],
    queryFn: () => summaryService.getMonthlySummary(),
  });

  const saveBudgetMutation = useMutation({
    mutationFn: (data: any) => budgetService.saveBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets-list'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      setModalVisible(false);
      setBudgetAmount('');
      setSelectedCatId(null);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    },
  });

  const overallBudget = budgets.find((b) => !b.categoryId);
  const categoryBudgets = budgets.filter((b) => b.categoryId);

  const totalBudgetAmt = overallBudget?.budgetAmount ?? 0;
  const spentSoFar = summary?.totalExpense ?? 0;
  const progressPercent = totalBudgetAmt > 0 ? Math.min(100, Math.round((spentSoFar / totalBudgetAmt) * 100)) : 0;
  const isOverBudget = totalBudgetAmt > 0 && spentSoFar > totalBudgetAmt;

  const handleSaveBudget = () => {
    const amt = parseFloat(budgetAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than 0');
      return;
    }

    saveBudgetMutation.mutate({
      encryptedCategoryId: selectedCatId || undefined,
      budgetAmount: amt,
      month: currentMonth,
      year: currentYear,
    });
  };

  const insets = useSafeAreaInsets();

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
        refreshControl={<RefreshControl refreshing={budgetsLoading} onRefresh={refetchBudgets} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.title, { color: colors.text, fontSize: typography.xl }]}>
              Monthly Budget
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {getCurrentMonthName(currentMonth)} {currentYear}
            </Text>
          </View>

          <Button
            title="+ Set Limit"
            size="sm"
            onPress={() => {
              setSelectedCatId(null);
              setBudgetAmount(overallBudget?.budgetAmount ? overallBudget.budgetAmount.toString() : '');
              setModalVisible(true);
            }}
            style={styles.setBudgetBtn}
          />
        </View>

        {/* Overall Budget Hero Card */}
        <Card style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroTopLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight }]}>
                <PiggyBank size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.heroTitle, { color: colors.text, fontSize: typography.base }]}>
                  Total Monthly Limit
                </Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
                  {totalBudgetAmt > 0
                    ? `${progressPercent}% spent of ${formatCurrency(totalBudgetAmt, 'INR', currencySymbol)}`
                    : 'No overall monthly budget set'}
                </Text>
              </View>
            </View>

            {isOverBudget ? (
              <View style={[styles.alertBadge, { backgroundColor: colors.expenseBg }]}>
                <AlertTriangle size={14} color={colors.expense} />
                <Text style={[styles.alertText, { color: colors.expense, fontSize: typography.xs }]}>Over</Text>
              </View>
            ) : totalBudgetAmt > 0 ? (
              <View style={[styles.alertBadge, { backgroundColor: colors.incomeBg }]}>
                <CheckCircle2 size={14} color={colors.income} />
                <Text style={[styles.alertText, { color: colors.income, fontSize: typography.xs }]}>On track</Text>
              </View>
            ) : null}
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.inputBg, borderRadius: radius.full }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: isOverBudget ? colors.expense : progressPercent > 80 ? colors.warning : colors.income,
                  borderRadius: radius.full,
                },
              ]}
            />
          </View>

          {/* Stats Row */}
          <View style={styles.heroStatsRow}>
            <View>
              <Text style={[styles.statLabel, { color: colors.textMuted, fontSize: typography.xs }]}>SPENT</Text>
              <Text style={[styles.statAmount, { color: colors.text, fontSize: typography.base }]}>
                {formatCurrency(spentSoFar, 'INR', currencySymbol)}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.statLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
                {isOverBudget ? 'OVERSPENT BY' : 'LEFT TO SPEND'}
              </Text>
              <Text
                style={[
                  styles.statAmount,
                  {
                    color: isOverBudget ? colors.expense : colors.income,
                    fontSize: typography.base,
                  },
                ]}
              >
                {formatCurrency(Math.abs(totalBudgetAmt - spentSoFar), 'INR', currencySymbol)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Category Limits Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.lg }]}>
            Category Limits
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (categories.length > 0) {
                setSelectedCatId(categories[0].encryptedId);
                setBudgetAmount('');
                setModalVisible(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.addCatText, { color: colors.accent, fontSize: typography.sm }]}>
              + Add Category
            </Text>
          </TouchableOpacity>
        </View>

        {categoryBudgets.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No category budgets"
              description="Set specific limits on Food, Shopping, or Gaming to stay in control."
              actionTitle="+ Set Category Limit"
              onAction={() => {
                if (categories.length > 0) {
                  setSelectedCatId(categories[0].encryptedId);
                  setBudgetAmount('');
                  setModalVisible(true);
                }
              }}
            />
          </Card>
        ) : (
          <View style={styles.categoryBudgetsList}>
            {categoryBudgets.map((b) => {
              const catPercent = b.budgetAmount > 0 ? Math.min(100, Math.round((b.spentAmount / b.budgetAmount) * 100)) : 0;
              const catOver = b.spentAmount > b.budgetAmount;

              return (
                <Card
                  key={b.id}
                  style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <View style={styles.catTopRow}>
                    <View style={styles.catLeft}>
                      <View style={[styles.catIconWrapper, { backgroundColor: `${b.categoryColorHex || colors.accent}20` }]}>
                        <CategoryIcon name={b.categoryIcon || 'tag'} size={18} color={b.categoryColorHex || colors.accent} />
                      </View>
                      <View>
                        <Text style={[styles.catTitle, { color: colors.text, fontSize: typography.base }]}>
                          {b.categoryName}
                        </Text>
                        <Text style={[styles.catSpentText, { color: colors.textSecondary, fontSize: typography.xs }]}>
                          {formatCurrency(b.spentAmount, 'INR', currencySymbol)} of {formatCurrency(b.budgetAmount, 'INR', currencySymbol)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.catPercentText,
                        { color: catOver ? colors.expense : colors.textSecondary, fontSize: typography.sm },
                      ]}
                    >
                      {catPercent}%
                    </Text>
                  </View>

                  <View style={[styles.catProgressTrack, { backgroundColor: colors.inputBg, borderRadius: radius.full }]}>
                    <View
                      style={[
                        styles.catProgressBar,
                        {
                          width: `${catPercent}%`,
                          backgroundColor: catOver ? colors.expense : b.categoryColorHex || colors.accent,
                          borderRadius: radius.full,
                        },
                      ]}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Set Budget Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: typography.lg }]}>
                {selectedCatId ? 'Set Category Budget' : 'Set Overall Monthly Budget'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Scope Tabs: Overall or Category */}
            <View style={[styles.scopeToggle, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
              <TouchableOpacity
                style={[
                  styles.scopeTab,
                  !selectedCatId && { backgroundColor: colors.accent, borderRadius: radius.sm },
                ]}
                onPress={() => setSelectedCatId(null)}
              >
                <Text style={{ color: !selectedCatId ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' }}>
                  Total Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scopeTab,
                  selectedCatId !== null && { backgroundColor: colors.accent, borderRadius: radius.sm },
                ]}
                onPress={() => {
                  if (categories.length > 0 && !selectedCatId) {
                    setSelectedCatId(categories[0].encryptedId);
                  }
                }}
              >
                <Text style={{ color: selectedCatId ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' }}>
                  By Category
                </Text>
              </TouchableOpacity>
            </View>

            {/* If Category chosen, show chips */}
            {selectedCatId !== null && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalChipsScroll}>
                {categories.map((c) => {
                  const isSelected = selectedCatId === c.encryptedId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCatId(c.encryptedId)}
                      style={[
                        styles.catSelectChip,
                        {
                          backgroundColor: isSelected ? `${c.colorHex}25` : colors.inputBg,
                          borderColor: isSelected ? c.colorHex : colors.cardBorder,
                          borderRadius: radius.md,
                        },
                      ]}
                    >
                      <Text style={{ color: isSelected ? c.colorHex : colors.text, fontWeight: isSelected ? '700' : '500' }}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
              LIMIT AMOUNT ({currencySymbol})
            </Text>
            <TextInput
              placeholder="e.g. 25000"
              placeholderTextColor={colors.textMuted}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              keyboardType="numeric"
              style={[
                styles.amountInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                  borderRadius: radius.md,
                },
              ]}
            />

            <Button
              title="Save Budget"
              onPress={handleSaveBudget}
              loading={saveBudgetMutation.isPending}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
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
  subtitle: {
    fontWeight: '600',
    marginTop: 2,
  },
  setBudgetBtn: {
    width: 'auto',
    paddingHorizontal: 16,
  },
  heroCard: {
    padding: 16,
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    padding: 10,
    borderRadius: 12,
  },
  heroTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontWeight: '500',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  alertText: {
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBar: {
    height: '100%',
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statAmount: {
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
  },
  addCatText: {
    fontWeight: '700',
  },
  emptyCard: {
    marginBottom: 20,
  },
  categoryBudgetsList: {
    gap: 10,
  },
  catCard: {
    padding: 14,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catIconWrapper: {
    padding: 8,
    borderRadius: 10,
  },
  catTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  catSpentText: {
    fontWeight: '500',
  },
  catPercentText: {
    fontWeight: '700',
  },
  catProgressTrack: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  catProgressBar: {
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '800',
  },
  scopeToggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  scopeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalChipsScroll: {
    marginBottom: 14,
  },
  catSelectChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  inputLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  amountInput: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
});
