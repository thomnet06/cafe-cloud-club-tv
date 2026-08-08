'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
  const [tokenNumber, setTokenNumber] = useState('');
  const [orderType, setOrderType] = useState('Swiggy');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveOrders();
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchActiveOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (!error && data) setOrders(data);
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    if (!tokenNumber.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('orders').insert([
      { token_number: tokenNumber.trim(), order_type: orderType, status: 'preparing' },
    ]);

    if (!error) setTokenNumber('');
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  const deleteOrder = async (id) => {
    await supabase.from('orders').delete().eq('id', id);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 font-sans text-slate-800">
      <header className="mb-6 rounded-lg bg-slate-900 p-4 text-white shadow">
        <h1 className="text-xl font-bold">Café Cloud Club — Order Manager</h1>
      </header>

      <section className="mb-8 rounded-lg bg-white p-4 shadow">
        <form onSubmit={handleAddOrder} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Token / Bill #"
            value={tokenNumber}
            onChange={(e) => setTokenNumber(e.target.value)}
            className="flex-1 rounded border p-3 font-bold"
            required
          />
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="rounded border p-3"
          >
            <option value="Swiggy">Swiggy</option>
            <option value="Zomato">Zomato</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Dine-In">Dine-In</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-slate-900 px-6 py-3 font-bold text-white"
          >
            {loading ? 'Adding...' : 'Add Order'}
          </button>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-amber-50 p-4">
          <h2 className="mb-3 font-bold text-amber-800">Preparing</h2>
          {orders.filter((o) => o.status === 'preparing').map((order) => (
            <div key={order.id} className="mb-2 flex justify-between rounded bg-white p-3 shadow">
              <span>#{order.token_number} ({order.order_type})</span>
              <button
                onClick={() => updateStatus(order.id, 'ready')}
                className="rounded bg-emerald-600 px-3 py-1 font-bold text-white"
              >
                Ready
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-emerald-50 p-4">
          <h2 className="mb-3 font-bold text-emerald-800">Ready</h2>
          {orders.filter((o) => o.status === 'ready').map((order) => (
            <div key={order.id} className="mb-2 flex justify-between rounded bg-white p-3 shadow">
              <span className="text-emerald-600 font-bold">#{order.token_number}</span>
              <button
                onClick={() => updateStatus(order.id, 'completed')}
                className="rounded bg-slate-800 px-3 py-1 font-bold text-white"
              >
                Clear
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
