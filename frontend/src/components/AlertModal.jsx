import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AlertModal = ({ product, open, onClose }) => {
  const [targetPrice, setTargetPrice] = useState(product.price * 0.9);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/alerts`, {
        product_id: product.id,
        product_title: product.title,
        target_price: targetPrice,
        user_email: email || null
      });

      setSuccess(true);
      toast.success("Alerta criado com sucesso!");

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Erro ao criar alerta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const discountPercent = ((product.price - targetPrice) / product.price * 100).toFixed(0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="alert-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-heading flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Criar Alerta de Preço
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Alerta Criado!</h3>
            <p className="text-slate-600">Você será notificado quando o preço baixar</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4">
            {/* Product Info */}
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2">{product.title}</h4>
              <p className="text-lg font-bold text-slate-900">
                Preço atual: R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Target Price */}
            <div className="mb-6">
              <Label htmlFor="target-price" className="text-sm font-medium text-slate-900 mb-2 block">
                Preço Desejado (R$)
              </Label>
              <Input
                id="target-price"
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                className="rounded-lg"
                required
                data-testid="alert-target-price"
              />
              <p className="text-sm text-slate-600 mt-2">
                Você quer economizar aproximadamente {discountPercent}% ({' '}
                R$ {(product.price - targetPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
              </p>
            </div>

            {/* Email (Optional) */}
            <div className="mb-6">
              <Label htmlFor="email" className="text-sm font-medium text-slate-900 mb-2 block">
                Email (opcional)
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="rounded-lg"
                data-testid="alert-email"
              />
              <p className="text-xs text-slate-500 mt-1">
                Deixe em branco para ver alertas apenas na plataforma
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-medium transition-all active:scale-95 h-12"
              data-testid="alert-submit-button"
            >
              {loading ? "Criando..." : "Criar Alerta"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;