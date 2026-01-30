import { useState, useEffect } from "react";
import { X, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PriceHistoryModal = ({ product, open, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && product) {
      fetchHistory();
    }
  }, [open, product]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/products/${product.id}/price-history`);
      const formattedHistory = response.data.history.map(record => ({
        date: new Date(record.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        price: record.price
      }));
      setHistory(formattedHistory);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Erro ao carregar histórico de preços");
    } finally {
      setLoading(false);
    }
  };

  const minPrice = history.length > 0 ? Math.min(...history.map(h => h.price)) : product.price;
  const maxPrice = history.length > 0 ? Math.max(...history.map(h => h.price)) : product.price;
  const priceChange = history.length > 1 ? ((history[history.length - 1].price - history[0].price) / history[0].price * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" data-testid="price-history-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-heading flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-primary" />
            Histórico de Preços
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Product Info */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2">{product.title}</h4>
            <p className="text-2xl font-bold text-primary">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Stats */}
          {history.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Preço Mínimo</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {minPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Preço Máximo</p>
                <p className="text-lg font-bold text-red-600">
                  R$ {maxPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Variação</p>
                <p className={`text-lg font-bold ${priceChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          {loading ? (
            <div className="h-64 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
              <p className="text-slate-500">Carregando histórico...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">Nenhum histórico disponível ainda</p>
                <p className="text-sm text-slate-500 mt-1">Os preços começarão a ser rastreados agora</p>
              </div>
            </div>
          ) : (
            <div className="h-64" data-testid="price-history-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    tickLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    tickLine={{ stroke: '#E2E8F0' }}
                    tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                    formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Preço']}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#007AFF"
                    strokeWidth={3}
                    dot={{ fill: '#007AFF', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceHistoryModal;