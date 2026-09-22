import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Car,
  Film,
  Gamepad2,
  Receipt,
  Smartphone,
  Heart,
  Briefcase,
  Gift,
  Laptop,
  TrendingUp,
  Wallet,
  Building2,
  CreditCard,
  CircleDollarSign,
  Tag,
  HelpCircle,
} from 'lucide-react-native';

interface CategoryIconProps {
  name: string;
  size?: number;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  size = 20,
  color = '#8B5CF6',
}) => {
  const iconLower = (name || '').toLowerCase().trim();

  switch (iconLower) {
    case 'utensils':
    case 'food':
    case 'dining':
      return <Utensils size={size} color={color} />;
    case 'shopping-bag':
    case 'shopping':
    case 'clothes':
      return <ShoppingBag size={size} color={color} />;
    case 'car':
    case 'transport':
    case 'commute':
      return <Car size={size} color={color} />;
    case 'film':
    case 'entertainment':
      return <Film size={size} color={color} />;
    case 'gamepad':
    case 'game':
    case 'gaming':
      return <Gamepad2 size={size} color={color} />;
    case 'receipt':
    case 'bills':
    case 'utility':
      return <Receipt size={size} color={color} />;
    case 'smartphone':
    case 'gadgets':
    case 'tech':
      return <Smartphone size={size} color={color} />;
    case 'heart':
    case 'health':
    case 'fitness':
      return <Heart size={size} color={color} />;
    case 'briefcase':
    case 'salary':
    case 'work':
      return <Briefcase size={size} color={color} />;
    case 'gift':
    case 'allowance':
    case 'pocket money':
      return <Gift size={size} color={color} />;
    case 'laptop':
    case 'freelance':
    case 'gig':
      return <Laptop size={size} color={color} />;
    case 'trending-up':
    case 'investments':
    case 'dividends':
      return <TrendingUp size={size} color={color} />;
    case 'bank':
      return <Building2 size={size} color={color} />;
    case 'card':
      return <CreditCard size={size} color={color} />;
    case 'cash':
      return <CircleDollarSign size={size} color={color} />;
    case 'wallet':
      return <Wallet size={size} color={color} />;
    default:
      return <Tag size={size} color={color} />;
  }
};
