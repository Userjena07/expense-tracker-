export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  messageCode: string;
  message: string;
  data: T;
  traceId?: string;
  statusCode: number;
}

export interface User {
  id: number;
  encryptedId: string;
  fullName: string;
  email: string;
  currencyCode: string;
  monthStartDay: number;
  theme: string;
  isBiometricOn: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export enum AccountType {
  Cash = 1,
  Bank = 2,
  Card = 3,
  Wallet = 4,
  PocketMoney = 5,
}

export interface Account {
  id: number;
  encryptedId: string;
  userId: number;
  name: string;
  accountType: AccountType;
  openingBalance: number;
  currentBalance: number;
  colorHex: string;
  icon: string;
  isActive: boolean;
}

export enum CategoryType {
  Expense = 1,
  Income = 2,
}

export interface Category {
  id: number;
  encryptedId: string;
  userId: number;
  name: string;
  icon: string;
  colorHex: string;
  categoryType: CategoryType;
  isSystemDefault: boolean;
  isActive: boolean;
}

export enum TransactionType {
  Expense = 1,
  Income = 2,
  Transfer = 3,
}

export interface Transaction {
  id: number;
  encryptedId: string;
  userId: number;
  accountId: number;
  encryptedAccountId: string;
  accountName: string;
  accountColorHex: string;
  categoryId: number;
  encryptedCategoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColorHex: string;
  amount: number;
  transactionType: TransactionType;
  txnDate: string;
  note?: string;
  targetAccountId?: number;
  encryptedTargetAccountId?: string;
  targetAccountName?: string;
  clientTxnId?: string;
}

export interface Budget {
  id: number;
  encryptedId: string;
  userId: number;
  categoryId?: number;
  encryptedCategoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColorHex?: string;
  budgetAmount: number;
  spentAmount: number;
  month: number;
  year: number;
}

export interface MonthlySummary {
  month: number;
  year: number;
  cycleStartDate: string;
  cycleEndDate: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  totalAccountBalance: number;
  totalBudget: number;
  budgetRemaining: number;
  daysRemainingInCycle: number;
  safeToSpendToday: number;
}

export interface CategorySummary {
  categoryId: number;
  encryptedCategoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColorHex: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface DailySummary {
  txnDate: string;
  expenseTotal: number;
  incomeTotal: number;
  transactionCount: number;
}

export interface TransactionFilter {
  fromDate?: string;
  toDate?: string;
  encryptedCategoryId?: string;
  encryptedAccountId?: string;
  transactionType?: number;
  keyword?: string;
  pageNumber?: number;
  pageSize?: number;
}
