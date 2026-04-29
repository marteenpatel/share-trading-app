export const calculateBuyCharges = (price, quantity, useZerodha = true, customCharge = 0) => {
  const turnover = price * quantity;
  if (!useZerodha) {
    return {
      turnover,
      brokerage: 0, stt: 0, transactionCharge: 0, sebiCharge: 0, gst: 0, stampDuty: 0,
      totalBuyCharges: Number(customCharge),
      totalBuyCost: turnover + Number(customCharge)
    };
  }
  const brokerage = 0;
  const stt = turnover * 0.001;
  const transactionCharge = turnover * 0.0000307;
  const sebiCharge = turnover * 0.000001;
  const gst = (brokerage + transactionCharge + sebiCharge) * 0.18;
  const stampDuty = turnover * 0.00015;

  const totalBuyCharges = stt + transactionCharge + sebiCharge + gst + stampDuty;
  const totalBuyCost = turnover + totalBuyCharges;

  return {
    turnover,
    brokerage,
    stt,
    transactionCharge,
    sebiCharge,
    gst,
    stampDuty,
    totalBuyCharges,
    totalBuyCost
  };
};

export const calculateSellCharges = (price, quantity, useZerodha = true, customCharge = 0) => {
  const turnover = price * quantity;
  if (!useZerodha) {
    return {
      turnover,
      brokerage: 0, stt: 0, transactionCharge: 0, sebiCharge: 0, gst: 0, stampDuty: 0,
      totalSellCharges: Number(customCharge),
      totalSellAmount: turnover - Number(customCharge)
    };
  }
  const brokerage = 0;
  const stt = turnover * 0.001;
  const transactionCharge = turnover * 0.0000307;
  const sebiCharge = turnover * 0.000001;
  const gst = (brokerage + transactionCharge + sebiCharge) * 0.18;
  const stampDuty = 0;

  const totalSellCharges = stt + transactionCharge + sebiCharge + gst;
  const totalSellAmount = turnover - totalSellCharges;

  return {
    turnover,
    brokerage,
    stt,
    transactionCharge,
    sebiCharge,
    gst,
    stampDuty,
    totalSellCharges,
    totalSellAmount
  };
};

export const calculateNetPnL = (totalSellAmount, totalBuyCost) => {
  return totalSellAmount - totalBuyCost;
};
