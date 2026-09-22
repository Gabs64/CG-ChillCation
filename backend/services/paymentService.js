/**
 * Payment Gateway Service Simulator (QR Ph & Dragonpay)
 */
export const processPaymentGateway = async (paymentMethod, amount) => {
  const prefix = paymentMethod === 'Dragonpay' ? 'DP' : 'QRPH';
  const randomRef = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transactionReference: randomRef,
        amount,
        paymentMethod,
        timestamp: new Date().toISOString()
      });
    }, 400);
  });
};
