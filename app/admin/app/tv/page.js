'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TVPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('tv-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (!error && data) setOrders(data);
  };

  const preparingList = orders.filter((o) => o.status === 'preparing');
  const readyList = orders.filter((o) => o.status === 'ready');

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 font-sans text-white select-none overflow-hidden">
      <header className="flex items-center justify-between bg-slate-900 px-8 py-4">
        <h1 className="text-3xl font-black text-amber-400">CAFÉ CLOUD CLUB</h1>
        <div className="text-xl font-bold text-slate-400">ORDER STATUS</div>
      </header>

      <div className="grid flex-1 grid-cols-2 divide-x divide-slate-800">
        <section className="p-8">
          <h2 className="mb-6 text-4xl font-black text-amber-400">PREPARING</h2>
          <div className="grid grid-cols-2 gap-4">
            {preparingList.map((order) => (
              <div key={order.id} className="rounded-xl border border-amber-500/20 bg-slate-900 p-5 text-4xl font-bold">
                #{order.token_number} <span className="text-sm block text-amber-300">{order.order_type}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 bg-slate-900/40">
          <h2 className="mb-6 text-4xl font-black text-emerald-400">READY FOR PICKUP</h2>
          <div className="grid grid-cols-2 gap-4">
            {readyList.map((order) => (
              <div key={order.id} className="rounded-xl border-2 border-emerald-500 bg-emerald-950/40 p-5 text-5xl font-black text-emerald-400 animate-pulse">
                #{order.token_number} <span className="text-sm block text-emerald-200">{order.order_type}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
