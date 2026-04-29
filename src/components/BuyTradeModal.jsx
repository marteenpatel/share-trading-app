import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import { calculateBuyCharges } from '../Calculations';

const BuyTradeModal = ({ isOpen, onClose, onSave }) => {
  const [stockName, setStockName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [useZerodha, setUseZerodha] = useState(true);
  const [customCharge, setCustomCharge] = useState('');

  const [previewCost, setPreviewCost] = useState(0);
  const [previewCharges, setPreviewCharges] = useState(0);

  useEffect(() => {
    if (buyPrice && quantity && !isNaN(buyPrice) && !isNaN(quantity)) {
      const { totalBuyCost, totalBuyCharges } = calculateBuyCharges(Number(buyPrice), Number(quantity), useZerodha, customCharge);
      setPreviewCost(totalBuyCost);
      setPreviewCharges(totalBuyCharges);
    } else {
      setPreviewCost(0);
      setPreviewCharges(0);
    }
  }, [buyPrice, quantity, useZerodha, customCharge]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!stockName || !buyPrice || !quantity || !buyDate) return;

    const { totalBuyCost } = calculateBuyCharges(Number(buyPrice), Number(quantity), useZerodha, customCharge);

    const newTrade = {
      stockName: stockName.toUpperCase(),
      buyDate,
      buyPrice: Number(buyPrice),
      quantity: Number(quantity),
      totalBuyCost,
      useZerodha,
      customBuyCharge: useZerodha ? 0 : Number(customCharge),
      status: 'OPEN'
    };

    onSave(newTrade);
    setStockName('');
    setBuyPrice('');
    setQuantity('');
    setBuyDate(new Date().toISOString().split('T')[0]);
    setUseZerodha(true);
    setCustomCharge('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-teal-500/20 text-teal-400 p-2 rounded-lg">
              <Calculator size={20} />
            </span>
            Add New Buy Trade
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="buy-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Stock Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase"
                placeholder="e.g. RELIANCE"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Buy Price (₹)</label>
                <input
                  type="number"
                  required
                  step="0.05"
                  min="0"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="0.00"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Buy Date</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-600 rounded-xl">
              <span className="text-sm font-medium text-slate-300">Use Zerodha Charges</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={useZerodha} onChange={() => setUseZerodha(!useZerodha)} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>
            
            {!useZerodha && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Custom Buy Charge Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g. 20.50"
                  value={customCharge}
                  onChange={(e) => setCustomCharge(e.target.value)}
                />
              </div>
            )}
          </form>

          {/* Preview Section */}
          <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Estimated Cost Preview</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300">Investment</span>
              <span className="text-white font-medium">₹{((buyPrice || 0) * (quantity || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-slate-400">Estimated Charges</span>
              <span className="text-red-400">+ ₹{previewCharges.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-700 my-2 pt-2 flex justify-between items-center">
              <span className="font-semibold text-white">Total Buy Cost</span>
              <span className="font-bold text-teal-400 text-lg">₹{previewCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="buy-form"
            className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-xl font-semibold shadow-lg shadow-teal-500/20 transition-all"
          >
            Save Trade
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyTradeModal;
