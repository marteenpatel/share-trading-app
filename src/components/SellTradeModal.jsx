import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateSellCharges, calculateNetPnL, calculateBuyCharges } from '../Calculations';

const SellTradeModal = ({ isOpen, onClose, trade, onSave }) => {
  const [sellPrice, setSellPrice] = useState('');
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0]);
  const [sellQuantity, setSellQuantity] = useState('');
  
  const [useZerodhaSell, setUseZerodhaSell] = useState(true);
  const [customSellCharge, setCustomSellCharge] = useState('');

  const [previewAmount, setPreviewAmount] = useState(0);
  const [previewCharges, setPreviewCharges] = useState(0);
  const [previewPnL, setPreviewPnL] = useState(0);

  useEffect(() => {
    if (trade && sellQuantity === '') {
      setSellQuantity(trade.quantity.toString());
    }
  }, [trade]);

  useEffect(() => {
    if (sellPrice && trade && !isNaN(sellPrice) && sellQuantity && !isNaN(sellQuantity)) {
      const sq = Number(sellQuantity);
      if (sq <= 0 || sq > trade.quantity) {
        setPreviewAmount(0); setPreviewCharges(0); setPreviewPnL(0);
        return;
      }
      const { totalSellAmount, totalSellCharges } = calculateSellCharges(Number(sellPrice), sq, useZerodhaSell, customSellCharge);
      setPreviewAmount(totalSellAmount);
      setPreviewCharges(totalSellCharges);
      
      const useZerodhaBuy = trade.useZerodha !== false;
      const proportionedCustomBuyCharge = (trade.customBuyCharge || 0) * (sq / trade.quantity);
      const buyCostForSoldQty = calculateBuyCharges(trade.buyPrice, sq, useZerodhaBuy, proportionedCustomBuyCharge).totalBuyCost;
      const pnl = calculateNetPnL(totalSellAmount, buyCostForSoldQty);
      setPreviewPnL(pnl);
    } else {
      setPreviewAmount(0);
      setPreviewCharges(0);
      setPreviewPnL(0);
    }
  }, [sellPrice, sellQuantity, trade, useZerodhaSell, customSellCharge]);

  if (!isOpen || !trade) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sellPrice || !sellDate || !sellQuantity) return;

    const sq = Number(sellQuantity);
    if (sq <= 0 || sq > trade.quantity) {
      alert('Invalid quantity. Cannot sell more than available quantity!');
      return;
    }

    const { totalSellAmount } = calculateSellCharges(Number(sellPrice), sq, useZerodhaSell, customSellCharge);
    
    const useZerodhaBuy = trade.useZerodha !== false;
    const proportionedCustomBuyCharge = (trade.customBuyCharge || 0) * (sq / trade.quantity);
    const buyCostForSoldQty = calculateBuyCharges(trade.buyPrice, sq, useZerodhaBuy, proportionedCustomBuyCharge).totalBuyCost;
    
    const netProfitLoss = calculateNetPnL(totalSellAmount, buyCostForSoldQty);

    const updatedTrade = {
      ...trade,
      sellDate,
      sellPrice: Number(sellPrice),
      sellQuantity: sq,
      useZerodhaSell,
      customSellCharge: useZerodhaSell ? 0 : Number(customSellCharge),
      totalSellAmount,
      netProfitLoss,
      status: 'CLOSED'
    };

    onSave(updatedTrade);
    setSellPrice('');
    setSellQuantity('');
    setUseZerodhaSell(true);
    setCustomSellCharge('');
    setSellDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const isProfit = previewPnL >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
              {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </span>
            Sell Trade - {trade.stockName}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Trade Summary */}
          <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-700 text-sm flex justify-between">
            <div>
              <p className="text-slate-400 mb-1">Buy Price</p>
              <p className="text-white font-semibold">₹{trade.buyPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Quantity</p>
              <p className="text-white font-semibold">{trade.quantity}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 mb-1">Total Buy Cost</p>
              <p className="text-white font-semibold">₹{trade.totalBuyCost.toFixed(2)}</p>
            </div>
          </div>

          <form id="sell-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sell Price (₹)</label>
                <input
                  type="number"
                  required
                  step="0.05"
                  min="0"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Qty to Sell</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={trade.quantity}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sell Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={sellDate}
                  onChange={(e) => setSellDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-600 rounded-xl">
              <span className="text-sm font-medium text-slate-300">Use Zerodha Charges for Sell</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={useZerodhaSell} onChange={() => setUseZerodhaSell(!useZerodhaSell)} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            {!useZerodhaSell && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Custom Sell Charge Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 20.50"
                  value={customSellCharge}
                  onChange={(e) => setCustomSellCharge(e.target.value)}
                />
              </div>
            )}
          </form>

          {/* Preview Section */}
          <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Settlement Preview</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300">Gross Sell Value</span>
              <span className="text-white font-medium">₹{((sellPrice || 0) * (sellQuantity || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-slate-400">Estimated Charges</span>
              <span className="text-red-400">- ₹{previewCharges.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-700 my-2 pt-2 flex justify-between items-center">
              <span className="text-slate-300">Total Sell Amount</span>
              <span className="text-white font-medium">₹{previewAmount.toFixed(2)}</span>
            </div>
            
            <div className={`mt-4 p-3 rounded-xl border ${isProfit ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'} flex justify-between items-center`}>
              <span className="font-semibold text-slate-200">Net P&L</span>
              <span className={`font-bold text-xl ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isProfit ? '+' : ''}₹{previewPnL.toFixed(2)}
              </span>
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
            form="sell-form"
            className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all"
          >
            Confirm Sell
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellTradeModal;
