"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { SELLER_WHATSAPP, SELLER_WHATSAPP_DISPLAY } from "@/lib/format";
import type { StoreSettings } from "@/types/catalog";

const StoreSettingsContext = createContext<StoreSettings>({
  sellerWhatsApp: SELLER_WHATSAPP,
  sellerWhatsAppDisplay: SELLER_WHATSAPP_DISPLAY,
});

interface StoreSettingsProviderProps {
  settings?: StoreSettings;
  children: ReactNode;
}

export function StoreSettingsProvider({ settings, children }: StoreSettingsProviderProps) {
  const value = useMemo<StoreSettings>(() => {
    return {
      sellerWhatsApp: settings?.sellerWhatsApp || SELLER_WHATSAPP,
      sellerWhatsAppDisplay: settings?.sellerWhatsAppDisplay || SELLER_WHATSAPP_DISPLAY,
    };
  }, [settings]);

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings(): StoreSettings {
  return useContext(StoreSettingsContext);
}
