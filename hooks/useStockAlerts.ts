'use client';

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface StockAlertLogRow {
  id: string;
  garage_id: string;
  piece_id: string;
  piece_name: string;
  stock_current: number;
  stock_min: number;
  fournisseur: string | null;
  sent_at: string;
  resolved_at: string | null;
}

/**
 * useStockAlerts
 * Subscribes to real-time inserts on stock_alerts_log for a given garage.
 * On INSERT: fires a react-hot-toast notification and POSTs to /api/stock/alert
 * to send the email notification.
 */
export function useStockAlerts(garageId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!garageId) return;

    const channel = supabase
      .channel(`stock-alerts-${garageId}`)
      .on<StockAlertLogRow>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_alerts_log',
          filter: `garage_id=eq.${garageId}`,
        },
        (payload) => {
          const row = payload.new;

          const isRupture = row.stock_current <= 0;
          const label = isRupture ? '🔴 Rupture de stock' : '🟡 Stock faible';

          toast(
            `${label} — ${row.piece_name} (${row.stock_current}/${row.stock_min})`,
            {
              duration: 6000,
              style: {
                background: isRupture ? '#2A1A1A' : '#2A2200',
                color: isRupture ? '#FCA5A5' : '#FDE68A',
                border: `1px solid ${isRupture ? '#DC2626' : '#D97706'}`,
                borderRadius: '10px',
                fontSize: '14px',
              },
            },
          );

          // Fire-and-forget email via API route
          void fetch('/api/stock/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ garageId, pieceId: row.piece_id }),
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [garageId]);
}
