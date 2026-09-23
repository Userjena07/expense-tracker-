import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';
import { categoryService } from '../services/categoryService';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CategoryIcon } from '../components/CategoryIcon';
import { Category, CategoryType } from '../types/api';

export default function CategoryManagementScreen() {
  const { colors, typography, radius } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<CategoryType>(CategoryType.Expense);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tag');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-list', activeTab],
    queryFn: () => categoryService.getCategories(activeTab),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => categoryService.saveCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-list'] });
      setModalVisible(false);
      resetForm();
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (encryptedId: string) => categoryService.deleteCategory(encryptedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-list'] });
    },
  });

  const resetForm = () => {
    setName('');
    setSelectedIcon('tag');
    setSelectedColor('#8B5CF6');
    setEditingCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedIcon(cat.icon || 'tag');
    setSelectedColor(cat.colorHex || '#8B5CF6');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a category name');
      return;
    }

    saveMutation.mutate({
      encryptedId: editingCategory ? editingCategory.encryptedId : undefined,
      name: name.trim(),
      icon: selectedIcon,
      colorHex: selectedColor,
      categoryType: activeTab,
    });
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('Delete Category', `Are you sure you want to delete ${cat.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(cat.encryptedId),
      },
    ]);
  };

  const iconOptions = [
    'utensils',
    'shopping-bag',
    'car',
    'film',
    'gamepad',
    'receipt',
    'smartphone',
    'heart',
    'briefcase',
    'gift',
    'laptop',
    'trending-up',
    'tag',
  ];

  const colorPalette = ['#8B5CF6', '#10B981', '#FF5A78', '#38BDF8', '#F59E0B', '#EC4899', '#14B8A6'];

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
      <Header
        title="Categories"
        subtitle="Customize your expense and income tags"
        showBack
        rightAction={
          <Button
            title="+ Add"
            size="sm"
            onPress={openAddModal}
            style={{ width: 'auto', paddingHorizontal: 16 }}
          />
        }
      />

      {/* Expense / Income Tabs */}
      <View style={[styles.tabToggle, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === CategoryType.Expense && { backgroundColor: colors.accent, borderRadius: radius.sm },
          ]}
          onPress={() => setActiveTab(CategoryType.Expense)}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === CategoryType.Expense ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Expense Categories
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === CategoryType.Income && { backgroundColor: colors.accent, borderRadius: radius.sm },
          ]}
          onPress={() => setActiveTab(CategoryType.Income)}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === CategoryType.Income ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Income Categories
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {categories.map((cat) => (
            <Card
              key={cat.id}
              style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => openEditModal(cat)}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.iconWrapper, { backgroundColor: `${cat.colorHex || colors.accent}20` }]}>
                  <CategoryIcon name={cat.icon} size={20} color={cat.colorHex || colors.accent} />
                </View>
                <View>
                  <Text style={[styles.catName, { color: colors.text, fontSize: typography.base }]}>
                    {cat.name}
                  </Text>
                  {cat.isSystemDefault && (
                    <Text style={[styles.defaultBadge, { color: colors.textMuted, fontSize: typography.xs }]}>
                      Default
                    </Text>
                  )}
                </View>
              </View>

              {!cat.isSystemDefault && (
                <TouchableOpacity onPress={() => handleDelete(cat)} style={styles.deleteBtn}>
                  <Trash2 size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: typography.lg }]}>
                {editingCategory ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.xs }]}>NAME</Text>
            <TextInput
              placeholder="e.g. Subscriptions, Groceries, Sneakers"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              style={[
                styles.textInput,
                { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder },
              ]}
            />

            <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.xs }]}>SELECT ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
              {iconOptions.map((ico) => {
                const isSelected = selectedIcon === ico;
                return (
                  <TouchableOpacity
                    key={ico}
                    onPress={() => setSelectedIcon(ico)}
                    style={[
                      styles.iconSelectBtn,
                      {
                        backgroundColor: isSelected ? `${selectedColor}30` : colors.inputBg,
                        borderColor: isSelected ? selectedColor : colors.cardBorder,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <CategoryIcon name={ico} size={22} color={isSelected ? selectedColor : colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.xs }]}>COLOR PALETTE</Text>
            <View style={styles.colorRow}>
              {colorPalette.map((col) => (
                <TouchableOpacity
                  key={col}
                  onPress={() => setSelectedColor(col)}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: col,
                      borderWidth: selectedColor === col ? 3 : 0,
                      borderColor: '#FFFFFF',
                    },
                  ]}
                />
              ))}
            </View>

            <Button
              title={editingCategory ? 'Update Category' : 'Save Category'}
              onPress={handleSave}
              loading={saveMutation.isPending}
              style={{ marginTop: 16 }}
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
  tabToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  grid: {
    gap: 10,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    padding: 10,
    borderRadius: 12,
  },
  catName: {
    fontWeight: '700',
  },
  defaultBadge: {
    fontWeight: '500',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
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
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 14,
    marginBottom: 10,
  },
  iconScroll: {
    marginBottom: 12,
  },
  iconSelectBtn: {
    padding: 12,
    borderWidth: 1.5,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
