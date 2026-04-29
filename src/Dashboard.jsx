import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, Plus, Search, Filter, TrendingUp, TrendingDown, Briefcase, Edit2, Trash2 } from 'lucide-react';
import BuyTradeModal from './components/BuyTradeModal';
import SellTradeModal from './components/SellTradeModal';
import EditTradeModal from './components/EditTradeModal';
import { db, logout } from './firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { calculateBuyCharges } from './Calculations';

const Dashboard = ({ user }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from Firestore in real-time
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "trades"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tradesArray = [];
      querySnapshot.forEach((doc) => {
        tradesArray.push({ id: doc.id, ...doc.data() });
      });
      setTrades(tradesArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveBuy = async (newTrade) => {
    try {
      await addDoc(collection(db, "trades"), {
        ...newTrade,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error adding trade:", error);
      alert("Error saving trade.");
    }
  };

  const handleSaveSell = async (updatedTrade) => {
    try {
      const { sellQuantity, ...restOfTrade } = updatedTrade;
      const originalQuantity = updatedTrade.quantity;

      if (sellQuantity < originalQuantity) {
        const remainingQty = originalQuantity - sellQuantity;
        const useZerodhaBuy = updatedTrade.useZerodha !== false;
        const totalCustomBuyCharge = updatedTrade.customBuyCharge || 0;
        
        const remainingCustomBuyCharge = totalCustomBuyCharge * (remainingQty / originalQuantity);
        const { totalBuyCost: newOpenBuyCost } = calculateBuyCharges(updatedTrade.buyPrice, remainingQty, useZerodhaBuy, remainingCustomBuyCharge);
        
        // 1. Update original trade to remain OPEN with remaining quantity
        const tradeRef = doc(db, "trades", updatedTrade.id);
        await updateDoc(tradeRef, {
          quantity: remainingQty,
          totalBuyCost: newOpenBuyCost,
          customBuyCharge: remainingCustomBuyCharge
        });

        // 2. Add NEW closed trade for the sold quantity
        const soldCustomBuyCharge = totalCustomBuyCharge * (sellQuantity / originalQuantity);
        const { totalBuyCost: closedBuyCost } = calculateBuyCharges(updatedTrade.buyPrice, sellQuantity, useZerodhaBuy, soldCustomBuyCharge);
        const { id, ...tradeDataForNewDoc } = restOfTrade;
        await addDoc(collection(db, "trades"), {
          ...tradeDataForNewDoc,
          quantity: sellQuantity,
          totalBuyCost: closedBuyCost,
          customBuyCharge: soldCustomBuyCharge,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });

      } else {
        // Sold everything, just update the document
        const tradeRef = doc(db, "trades", updatedTrade.id);
        const { id, ...tradeData } = restOfTrade;
        await updateDoc(tradeRef, tradeData);
      }
    } catch (error) {
      console.error("Error updating trade:", error);
      alert("Error saving trade.");
    }
  };

  const handleSaveEdit = async (updatedTrade) => {
    try {
      const tradeRef = doc(db, "trades", updatedTrade.id);
      const { id, ...tradeData } = updatedTrade;
      await updateDoc(tradeRef, tradeData);
    } catch (error) {
      console.error("Error updating trade:", error);
      alert("Error saving trade.");
    }
  };

  const handleDeleteTrade = async (id) => {
    if(window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await deleteDoc(doc(db, "trades", id));
      } catch (error) {
        console.error("Error deleting trade:", error);
        alert("Error deleting trade.");
      }
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Summaries
  const totalInvested = useMemo(() => {
    return trades
      .filter(t => t.status === 'OPEN')
      .reduce((sum, t) => sum + t.totalBuyCost, 0);
  }, [trades]);

  const totalRealizedPnL = useMemo(() => {
    return trades
      .filter(t => t.status === 'CLOSED')
      .reduce((sum, t) => sum + t.netProfitLoss, 0);
  }, [trades]);

  const ledgerItems = useMemo(() => {
    let items = [];
    trades.forEach(t => {
      // Check filters for the BUY action
      let buyMatch = true;
      const bDate = new Date(t.buyDate);
      if (startDate && new Date(startDate) > bDate) buyMatch = false;
      if (endDate && new Date(endDate) < bDate) buyMatch = false;
      if (searchTerm && !t.stockName.toLowerCase().includes(searchTerm.toLowerCase())) buyMatch = false;
      
      if (buyMatch) {
        items.push({
          ...t,
          actionType: 'BUY',
          displayDate: t.buyDate,
          displayPrice: t.buyPrice,
          displayTotal: t.totalBuyCost,
          uniqueKey: `${t.id}-buy`
        });
      }

      if (t.status === 'CLOSED') {
        let sellMatch = true;
        const sDate = new Date(t.sellDate);
        if (startDate && new Date(startDate) > sDate) sellMatch = false;
        if (endDate && new Date(endDate) < sDate) sellMatch = false;
        if (searchTerm && !t.stockName.toLowerCase().includes(searchTerm.toLowerCase())) sellMatch = false;

        if (sellMatch) {
          items.push({
            ...t,
            actionType: 'SELL',
            displayDate: t.sellDate,
            displayPrice: t.sellPrice,
            displayTotal: t.totalSellAmount,
            uniqueKey: `${t.id}-sell`
          });
        }
      }
    });

    return items.sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));
  }, [trades, startDate, endDate, searchTerm]);

  const isProfit = totalRealizedPnL >= 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-teal-500/30">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center border border-teal-500/30">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">TradePro</h1>
              <p className="text-xs text-slate-400 font-medium">Welcome, {user.displayName || 'Trader'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all font-medium text-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700 relative overflow-hidden shadow-xl">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                <Briefcase size={24} />
              </div>
              <h2 className="text-lg font-semibold text-slate-300">Total Invested</h2>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">
              ₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-slate-400 mt-2 font-medium">In Open Positions</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700 relative overflow-hidden shadow-xl">
            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl ${isProfit ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}></div>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </div>
              <h2 className="text-lg font-semibold text-slate-300">Total Realized P&L</h2>
            </div>
            <p className={`text-4xl font-bold tracking-tight ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfit ? '+' : ''}₹{totalRealizedPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-slate-400 mt-2 font-medium">From Closed Positions</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl w-full sm:w-auto relative">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search stock..."
                className="bg-transparent text-sm text-slate-300 focus:outline-none w-full sm:w-32"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl w-full sm:w-auto">
              <Filter size={16} className="text-slate-400" />
              <input
                type="date"
                className="bg-transparent text-sm text-slate-300 focus:outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="text-slate-500 hidden sm:block">to</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl w-full sm:w-auto">
              <input
                type="date"
                className="bg-transparent text-sm text-slate-300 focus:outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate || searchTerm) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }}
                className="text-sm text-teal-400 hover:text-teal-300 ml-2"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-teal-500/20 transition-all w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            Add New Buy Trade
          </button>
        </div>

        {/* Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium text-center">Action</th>
                  <th className="px-6 py-4 font-medium text-right">Qty</th>
                  <th className="px-6 py-4 font-medium text-right">Price</th>
                  <th className="px-6 py-4 font-medium text-right">Total Value</th>
                  <th className="px-6 py-4 font-medium text-center">P&L</th>
                  <th className="px-6 py-4 font-medium text-right">Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {ledgerItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Search size={48} className="text-slate-600 mb-4" />
                        <p className="text-lg font-medium text-slate-300">No actions found</p>
                        <p className="text-sm">Try adjusting your filters or add a new trade.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ledgerItems.map((item) => (
                    <tr key={item.uniqueKey} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                        {new Date(item.displayDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-white">
                        {item.stockName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                          item.actionType === 'BUY' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {item.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 text-right">
                        ₹{item.displayPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white text-right">
                        ₹{item.displayTotal.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.actionType === 'SELL' ? (
                          <span className={`text-sm font-bold ${item.netProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {item.netProfitLoss >= 0 ? '+' : ''}₹{item.netProfitLoss.toFixed(2)}
                          </span>
                        ) : (
                           item.status === 'OPEN' ? (
                             <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">Open</span>
                           ) : (
                             <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">Closed</span>
                           )
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.actionType === 'BUY' && item.status === 'OPEN' && (
                            <button
                              onClick={() => { setSelectedTrade(item); setIsSellModalOpen(true); }}
                              className="text-xs font-semibold px-4 py-1.5 bg-slate-700 hover:bg-rose-500 text-white rounded-lg transition-colors border border-slate-600 hover:border-rose-400 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              SELL
                            </button>
                          )}
                          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 transition-opacity">
                            <button
                              onClick={() => { setSelectedTrade(item); setIsEditModalOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition-colors"
                              title="Edit Trade"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTrade(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                              title="Delete Trade"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <BuyTradeModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSave={handleSaveBuy}
      />

      <SellTradeModal
        isOpen={isSellModalOpen}
        onClose={() => { setIsSellModalOpen(false); setSelectedTrade(null); }}
        trade={selectedTrade}
        onSave={handleSaveSell}
      />

      <EditTradeModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedTrade(null); }}
        trade={selectedTrade}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default Dashboard;
