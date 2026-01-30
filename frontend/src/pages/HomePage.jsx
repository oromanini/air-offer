import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, TrendingDown, Bell, Package } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import FilterSidebar from "@/components/FilterSidebar";
import PriceHistoryModal from "@/components/PriceHistoryModal";
import AlertModal from "@/components/AlertModal";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("ar condicionado");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    condition: null,
    minPrice: null,
    maxPrice: null,
    sort: "price_asc"
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        q: searchQuery,
        ...filters
      };
      
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });
      
      const response = await axios.get(`${API}/products/search`, { params });
      setProducts(response.data.products);
      
      if (response.data.products.length === 0) {
        toast.info("Nenhum produto encontrado. Tente outros filtros.");
      }
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Erro ao buscar produtos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchProducts();
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    searchProducts();
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setMobileFiltersOpen(false);
  };

  const handleShowHistory = (product) => {
    setSelectedProduct(product);
    setShowHistory(true);
  };

  const handleCreateAlert = (product) => {
    setSelectedProduct(product);
    setShowAlert(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-lg bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold font-heading text-slate-900">FrostFind</h1>
            </div>
            <p className="hidden md:block text-sm text-slate-600">Encontre as melhores ofertas em ar condicionado</p>
          </div>
        </div>
      </header>

      {/* Hero Search */}
      <section className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-6xl font-bold font-heading text-slate-900 mb-4 tracking-tight">
              Ofertas que <span className="text-primary">Refrescam</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Produtos reembalados, liquidações e pontas de estoque. Economize até 70%.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative" data-testid="search-form">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ar condicionado..."
              className="h-14 pl-14 pr-4 rounded-full border-2 border-slate-100 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg shadow-sm"
              data-testid="search-input"
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 bg-primary hover:bg-primary/90 text-white rounded-full font-medium transition-all active:scale-95"
              data-testid="search-button"
            >
              Buscar
            </Button>
          </form>

          {/* Quick Stats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span>{products.length} produtos encontrados</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <span>{products.filter(p => p.condition === 'refurbished').length} reembalados</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {/* Desktop Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                    data-testid="mobile-filter-button"
                  >
                    <SlidersHorizontal className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                      <div className="aspect-square bg-slate-200 rounded-xl mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhum produto encontrado</h3>
                  <p className="text-slate-600">Tente ajustar seus filtros ou buscar por outros termos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onShowHistory={handleShowHistory}
                      onCreateAlert={handleCreateAlert}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      {showHistory && selectedProduct && (
        <PriceHistoryModal
          product={selectedProduct}
          open={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showAlert && selectedProduct && (
        <AlertModal
          product={selectedProduct}
          open={showAlert}
          onClose={() => setShowAlert(false)}
        />
      )}
    </div>
  );
};

export default HomePage;