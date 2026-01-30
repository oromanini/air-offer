import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const FilterSidebar = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      condition: null,
      minPrice: null,
      maxPrice: null,
      sort: "price_asc"
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <SlidersHorizontal className="w-5 h-5 text-slate-700" />
        <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
      </div>

      {/* Condition Filter */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-slate-900 mb-3 block">Condição</Label>
        <RadioGroup
          value={localFilters.condition || "all"}
          onValueChange={(value) => setLocalFilters({ ...localFilters, condition: value === "all" ? null : value })}
        >
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="all" id="all" data-testid="filter-condition-all" />
            <Label htmlFor="all" className="font-normal cursor-pointer">Todas</Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="refurbished" id="refurbished" data-testid="filter-condition-refurbished" />
            <Label htmlFor="refurbished" className="font-normal cursor-pointer">Reembalado</Label>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="new" id="new" data-testid="filter-condition-new" />
            <Label htmlFor="new" className="font-normal cursor-pointer">Novo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="used" id="used" data-testid="filter-condition-used" />
            <Label htmlFor="used" className="font-normal cursor-pointer">Usado</Label>
          </div>
        </RadioGroup>
      </div>

      <Separator className="my-6" />

      {/* Price Range */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-slate-900 mb-3 block">Faixa de Preço (R$)</Label>
        <div className="space-y-3">
          <Input
            type="number"
            placeholder="Mínimo"
            value={localFilters.minPrice || ""}
            onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value ? parseFloat(e.target.value) : null })}
            className="rounded-lg"
            data-testid="filter-min-price"
          />
          <Input
            type="number"
            placeholder="Máximo"
            value={localFilters.maxPrice || ""}
            onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value ? parseFloat(e.target.value) : null })}
            className="rounded-lg"
            data-testid="filter-max-price"
          />
        </div>
      </div>

      <Separator className="my-6" />

      {/* Sort */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-slate-900 mb-3 block">Ordenar por</Label>
        <RadioGroup
          value={localFilters.sort}
          onValueChange={(value) => setLocalFilters({ ...localFilters, sort: value })}
        >
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="price_asc" id="price_asc" data-testid="filter-sort-asc" />
            <Label htmlFor="price_asc" className="font-normal cursor-pointer">Menor preço</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="price_desc" id="price_desc" data-testid="filter-sort-desc" />
            <Label htmlFor="price_desc" className="font-normal cursor-pointer">Maior preço</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={handleApply}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-medium transition-all active:scale-95"
          data-testid="filter-apply-button"
        >
          Aplicar Filtros
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full border-2 border-slate-200 hover:border-primary hover:text-primary rounded-full font-medium transition-all"
          data-testid="filter-reset-button"
        >
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
};

export default FilterSidebar;