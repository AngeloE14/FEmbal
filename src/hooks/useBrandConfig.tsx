/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface BrandConfig {
  institutionName: string;
  logoDataUrl: string;
}

const BRAND_STORAGE_KEY = 'esams-brand-config-v1';

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  institutionName: '',
  logoDataUrl: '',
};

type BrandContextValue = {
  brand: BrandConfig;
  updateBrand: (changes: Partial<BrandConfig>) => void;
  resetBrand: () => void;
};

const BrandContext = createContext<BrandContextValue | null>(null);

function readStoredBrand(): BrandConfig {
  try {
    const stored = localStorage.getItem(BRAND_STORAGE_KEY);
    if (!stored) return DEFAULT_BRAND_CONFIG;

    const parsed = JSON.parse(stored) as Partial<BrandConfig>;
    return {
      institutionName: typeof parsed.institutionName === 'string' ? parsed.institutionName : '',
      logoDataUrl: typeof parsed.logoDataUrl === 'string' ? parsed.logoDataUrl : '',
    };
  } catch {
    return DEFAULT_BRAND_CONFIG;
  }
}

function persistBrand(brand: BrandConfig): void {
  try {
    localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand));
  } catch {
    // El uso continúa en memoria si el navegador bloquea el almacenamiento.
  }
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandConfig>(readStoredBrand);

  useEffect(() => {
    persistBrand(brand);
  }, [brand]);

  const updateBrand = useCallback((changes: Partial<BrandConfig>) => {
    setBrand((current) => ({ ...current, ...changes }));
  }, []);

  const resetBrand = useCallback(() => {
    setBrand(DEFAULT_BRAND_CONFIG);
  }, []);

  const value = useMemo(() => ({ brand, updateBrand, resetBrand }), [brand, resetBrand, updateBrand]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrandConfig(): BrandContextValue {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrandConfig debe usarse dentro de BrandProvider.');
  }
  return context;
}
