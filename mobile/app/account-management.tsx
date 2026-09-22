import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Wallet, Building2, CreditCard, CircleDollarSign, Gift } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';
import { useSettingsStore } from '../store/settingsStore';
import { accountService } from '../services/accountService';
import { formatCurrency } from '../utils/money';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Account, AccountType } from '../types/api';

export default function AccountManagementScreen() {
  const { colors, typography, radius } = useTheme();
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(AccountType.Bank);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [selectedColor, setSelectedColor] = useState('#5B3FE0');
  const [selectedIcon, setSelectedIcon] = useState('bank');

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts-list'],
    queryFn: () => accountService.getAccounts(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => accountService.saveAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-list'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      setModalVisible(false);
      resetForm();
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (encryptedId: string) => accountService.deleteAccount(encryptedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-list'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
    },
  });

  const resetForm = () => {
    setName('');
    setAccountType(AccountType.Bank);
    setOpeningBalance('0');
    setSelectedColor('#5B3FE0');
    setSelectedIcon('bank');
    setEditingAccount(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setAccountType(acc.accountType);
    setOpeningBalance(acc.openingBalance.toString());
    setSelectedColor(acc.colorHex || '#5B3FE0');
    setSelectedIcon(acc.icon || 'bank');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an account name');
      return;
    }

    saveMutation.mutate({
      encryptedId: editingAccount ? editingAccount.encryptedId : undefined,
      name: name.trim(),
      accountType,
      openingBalance: parseFloat(openingBalance) || 0,
      colorHex: selectedColor,
      icon: selectedIcon,
    });
  };

  const handleDelete = (acc: Account) => {
    Alert.alert('Delete Account', `Are you sure you want to delete ${acc.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(acc.encryptedId),
      },
    ]);
  };

  const accountTypesList = [
    { type: AccountType.Cash, label: 'Cash', icon: 'cash' },
    { type: AccountType.Bank, label: 'Bank', icon: 'bank' },
    { type: AccountType.Card, label: 'Card', icon: 'card' },
    { type: AccountType.Wallet, label: 'Wallet', icon: 'wallet' },
    { type: AccountType.PocketMoney, label: 'Pocket Money', icon: 'gift' },
  ];

  const colorPalette = ['#5B3FE0', '#10B981', '#FF5A78', '#38BDF8', '#F59E0B', '#EC4899'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header
        title="Accounts & Wallets"
        subtitle="Manage your cash, bank and pocket money"
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.list}>
          {accounts.map((acc) => (
            <Card
              key={acc.id}
              style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => openEditModal(acc)}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.iconWrapper, { backgroundColor: `${acc.colorHex || colors.accent}25` }]}>
                  {acc.accountType === AccountType.PocketMoney ? (
                    <Gift size={20} color={acc.colorHex || colors.accent} />
                  ) : acc.accountType === AccountType.Bank ? (
                    <Building2 size={20} color={acc.colorHex || colors.accent} />
                  ) : acc.accountType === AccountType.Card ? (
                    <CreditCard size={20} color={acc.colorHex || colors.accent} />
                  ) : acc.accountType === AccountType.Cash ? (
                    <CircleDollarSign size={20} color={acc.colorHex || colors.accent} />
                  ) : (
                    <Wallet size={20} color={acc.colorHex || colors.accent} />
                  )}
                </View>
                <View>
                  <Text style={[styles.accName, { color: colors.text, fontSize: typography.base }]}>
                    {acc.name}
                  </Text>
                  <Text style={[styles.accBalance, { color: colors.textSecondary, fontSize: typography.xs }]}>
                    Opening: {formatCurrency(acc.openingBalance, 'INR', currencySymbol)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <Text style={[styles.currentBalance, { color: colors.text, fontSize: typography.base }]}>
                  {formatCurrency(acc.currentBalance, 'INR', currencySymbol)}
                </Text>
                {accounts.length > 1 && (
                  <TouchableOpacity onPress={() => handleDelete(acc)} style={styles.deleteBtn}>
                    <Trash2 size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
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
                {editingAccount ? 'Edit Account' : 'New Account / Wallet'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.xs }]}>ACCOUNT TYPE</Text>
            <View style={styles.typesRow}>
              {accountTypesList.map((t) => {
                const isSelected = accountType === t.type;
                return (
                  <TouchableOpacity
                    key={t.type}
                    onPress={() => {
                      setAccountType(t.type);
                      setSelectedIcon(t.icon);
                    }}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.inputBg,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: typography.xs,
                      }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.xs }]}>NAME</Text>
            <TextInput
              placeholder="e.g. HDFC Bank, Cash Wallet, Pocket Money"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              style={[
                styles.textInput,
                { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder },
              ]}
            />

            {!editingAccount && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.xs }]}>
                  OPENING BALANCE ({currencySymbol})
                </Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={openingBalance}
                  onChangeText={setOpeningBalance}
                  keyboardType="numeric"
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder },
                  ]}
                />
              </>
            )}

            <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.xs }]}>COLOR THEME</Text>
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
              title={editingAccount ? 'Update Account' : 'Save Account'}
              onPress={handleSave}
              loading={saveMutation.isPending}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  list: {
    gap: 12,
  },
  accountCard: {
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
  accName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  accBalance: {
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  currentBalance: {
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 4,
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
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  typeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  textInput: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 14,
    marginBottom: 10,
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
