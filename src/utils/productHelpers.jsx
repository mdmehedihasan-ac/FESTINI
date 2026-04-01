import { Gift, Package, Sparkles, ShoppingBag, Megaphone, Heart } from 'lucide-react';

export const categoryIconMap = {
  gifts: Gift,
  textiles: Package,
  party: Sparkles,
  apparel: ShoppingBag,
  promotional: Megaphone,
  wedding: Heart,
};

export const categoryColorMap = {
  gifts:       { bg: 'linear-gradient(135deg,#fdf0f7,#f9dff3)', color: '#B50A74' },
  textiles:    { bg: 'linear-gradient(135deg,#f4f0fd,#e8def8)', color: '#7c3aed' },
  party:       { bg: 'linear-gradient(135deg,#fff8e1,#ffecb3)', color: '#f59e0b' },
  apparel:     { bg: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', color: '#16a34a' },
  promotional: { bg: 'linear-gradient(135deg,#e3f2fd,#bbdefb)', color: '#1d4ed8' },
  wedding:     { bg: 'linear-gradient(135deg,#fce4ec,#f8bbd0)', color: '#e91e63' },
};

export const ProductPlaceholder = ({ category }) => {
  const Icon = categoryIconMap[category] || Gift;
  const colors = categoryColorMap[category] || categoryColorMap.gifts;
  return (
    <div className="product-img-placeholder" style={{ background: colors.bg }}>
      <Icon size={44} color={colors.color} />
    </div>
  );
};
