import { ExternalLink, TrendingDown, Bell, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ProductCard = ({ product, onShowHistory, onCreateAlert }) => {
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const getConditionBadge = () => {
    if (product.condition === 'refurbished') {
      return (
        <Badge className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          Reembalado
        </Badge>
      );
    }
    if (product.condition === 'new') {
      return (
        <Badge className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          Novo
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-50 text-slate-600 border border-slate-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
        Usado
      </Badge>
    );
  };

  return (
    <div
      className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      data-testid={`product-card-${product.id}`}
    >
      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-4 right-4 z-10 bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
          -{discountPercent}%
        </div>
      )}

      {/* Image */}
      <div className="aspect-square bg-slate-50 overflow-hidden relative">
        <img
          src={product.thumbnail || 'https://images.pexels.com/photos/1567355/pexels-photo-1567355.jpeg'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Condition Badge */}
        <div className="mb-3">
          {getConditionBadge()}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-900 mb-2 line-clamp-2 min-h-[3rem]" title={product.title}>
          {product.title}
        </h3>

        {/* Price */}
        <div className="mb-3">
          {hasDiscount && (
            <p className="text-sm text-slate-400 line-through mb-1">
              R$ {product.original_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
          <p className="text-2xl font-bold text-slate-900">
            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4 text-sm text-slate-600">
          {product.free_shipping && (
            <div className="flex items-center gap-2 text-green-600">
              <Truck className="w-4 h-4" />
              <span className="font-medium">Frete grátis</span>
            </div>
          )}
          {product.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{product.location}</span>
            </div>
          )}
          <div className="text-xs text-slate-500">
            {product.sold_quantity > 0 && `${product.sold_quantity} vendidos`}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShowHistory(product)}
            className="flex-1 rounded-full border-2 border-slate-200 hover:border-primary hover:text-primary transition-all"
            data-testid={`price-history-btn-${product.id}`}
          >
            <TrendingDown className="w-4 h-4 mr-1" />
            Histórico
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateAlert(product)}
            className="flex-1 rounded-full border-2 border-slate-200 hover:border-primary hover:text-primary transition-all"
            data-testid={`create-alert-btn-${product.id}`}
          >
            <Bell className="w-4 h-4 mr-1" />
            Alerta
          </Button>
        </div>

        {/* View Product Link */}
        <a
          href={product.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          data-testid={`view-product-link-${product.id}`}
        >
          Ver no Mercado Livre
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default ProductCard;