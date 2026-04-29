import React, { useState, useEffect } from 'react';
import { X, Edit2, Calculator } from 'lucide-react';
import { calculateBuyCharges, calculateSellCharges, calculateNetPnL } from '../Calculations';

const EditTradeModal = ({ isOpen, onClose, trade, onSave }) => {
  const [stockName, setStockName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyDate, setBuyDate] = useState('');
  
  const [sellPrice, setSellPrice] = useState('');
  const [sellDate, setSellDate] = useState('');

  const [useZerodha, setUseZerodha] = useState(true);
  const [customBuyCharge, setCustomBuyCharge] = useState('');
  
  const [useZerodhaSell, setUseZerodhaSell] = useState(true);
  const [customSellCharge, setCustomSellCharge] = useState('');

  const [previewBuyCost, setPreviewBuyCost] = useState(0);
  const [previewSellAmount, setPreviewSellAmount] = useState(0);
  const [previewPnL, setPreviewPnL] = useState(0);

  useEffect(() => {
    if (trade) {
      setStockName(trade.stockName || '');
      setBuyPrice(trade.buyPrice || '');
      setQuantity(trade.quantity || '');
      setBuyDate(trade.buyDate || '');
      if (trade.useZerodha !== undefined) setUseZerodha(trade.useZerodha);
      if (trade.customBuyCharge !== undefined) setCustomBuyCharge(trade.customBuyCharge);

      if (trade.status === 'CLOSED') {
        setSellPrice(trade.sellPrice || '');
        setSellDate(trade.sellDate || '');
        if (trade.useZerodhaSell !== undefined) setUseZerodhaSell(trade.useZerodhaSell);
        if (trade.customSellCharge !== undefined) setCustomSellCharge(trade.customSellCharge);
      }
    }
  }, [trade]);

  useEffect(() => {
    if (!trade) return;
    
    let currentBuyCost = 0;
    if (buyPrice && quantity && !isNaN(buyPrice) && !isNaN(quantity)) {
      const { totalBuyCost } = calculateBuyCharges(Number(buyPrice), Number(quantity), useZerodha, customBuyCharge);
      currentBuyCost = totalBuyCost;
      setPreviewBuyCost(totalBuyCost);
    } else {
      setPreviewBuyCost(0);
    }

    if (trade.status === 'CLOSED') {
      if (sellPrice && quantity && !isNaN(sellPrice) && !isNaN(quantity)) {
        const { totalSellAmount } = calculateSellCharges(Number(sellPrice), Number(quantity), useZerodhaSell, customSellCharge);
        setPreviewSellAmount(totalSellAmount);
        setPreviewPnL(calculateNetPnL(totalSellAmount, currentBuyCost));
      } else {
        setPreviewSellAmount(0);
        setPreviewPnL(0);
      }
    }
  }, [buyPrice, quantity, sellPrice, trade, useZerodha, customBuyCharge, useZerodhaSell, customSellCharge]);

  if (!isOpen || !trade) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!stockName || !buyPrice || !quantity || !buyDate) return;

    const { totalBuyCost } = calculateBuyCharges(Number(buyPrice), Number(quantity), useZerodha, customBuyCharge);

    let updatedTrade = {
      ...trade,
      stockName: stockName.toUpperCase(),
      buyDate,
      buyPrice: Number(buyPrice),
      quantity: Number(quantity),
      totalBuyCost,
      useZerodha,
      customBuyCharge: useZerodha ? 0 : Number(customBuyCharge)
    };

    if (trade.status === 'CLOSED') {
      if (!sellPrice || !sellDate) return;
      const { totalSellAmount } = calculateSellCharges(Number(sellPrice), Number(quantity), useZerodhaSell, customSellCharge);
      const netProfitLoss = calculateNetPnL(totalSellAmount, totalBuyCost);

      updatedTrade = {
        ...updatedTrade,
        sellDate,
        sellPrice: Number(sellPrice),
        useZerodhaSell,
        customSellCharge: useZerodhaSell ? 0 : Number(customSellCharge),
        totalSellAmount,
        netProfitLoss
      };
    }

    onSave(updatedTrade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-400 p-2 rounded-lg">
              <Edit2 size={20} />
            </span>
            Edit Trade
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Stock Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent uppercase"
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
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-600 rounded-xl">
              <span className="text-sm font-medium text-slate-300">Use Zerodha Charges for Buy</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={useZerodha} onChange={() => setUseZerodha(!useZerodha)} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
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
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  value={customBuyCharge}
                  onChange={(e) => setCustomBuyCharge(e.target.value)}
                />
              </div>
            )}

            {trade.status === 'CLOSED' && (
              <>
                <div className="border-t border-slate-700 my-4 pt-4">
                  <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Sell Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Sell Price (₹)</label>
                      <input
                        type="number"
                        required
                        step="0.05"
                        min="0"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Sell Date</label>
                      <input
                        type="date"
                        required
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        value={sellDate}
                        onChange={(e) => setSellDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 mt-4 bg-slate-900 border border-slate-600 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">Use Zerodha Charges for Sell</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={useZerodhaSell} onChange={() => setUseZerodhaSell(!useZerodhaSell)} />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  
                  {!useZerodhaSell && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-300 mb-1">Custom Sell Charge Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        value={customSellCharge}
                        onChange={(e) => setCustomSellCharge(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </form>

          {/* Preview Section */}
          <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Cost Preview</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300">Total Buy Cost</span>
              <span className="font-bold text-teal-400">₹{previewBuyCost.toFixed(2)}</span>
            </div>
            
            {trade.status === 'CLOSED' && (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">Total Sell Amount</span>
                  <span className="font-bold text-blue-400">₹{previewSellAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-700 my-2 pt-2 flex justify-between items-center">
                  <span className="font-semibold text-white">Net P&L</span>
                  <span className={`font-bold ${previewPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {previewPnL >= 0 ? '+' : ''}₹{previewPnL.toFixed(2)}
                  </span>
                </div>
              </>
            )}
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
            form="edit-form"
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-semibold shadow-lg shadow-amber-500/20 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTradeModal;
