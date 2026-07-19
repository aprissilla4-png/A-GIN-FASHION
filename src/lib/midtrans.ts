import midtransClient from 'midtrans-client';

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface MidtransCustomerDetail {
  first_name: string;
  phone: string;
}

export interface MidtransTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails?: MidtransCustomerDetail;
  itemDetails?: MidtransItemDetail[];
}

/**
 * Generates a Midtrans Snap transaction token securely.
 * This should be executed server-side to protect the Server Key.
 */
export async function generateMidtransSnapToken(
  serverKey: string,
  isProduction: boolean,
  params: MidtransTransactionParams
) {
  // Use midtrans-client SDK to generate transaction
  const snap = new (midtransClient as any).Snap({
    isProduction,
    serverKey,
    clientKey: ''
  });

  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount
    },
    item_details: params.itemDetails,
    customer_details: params.customerDetails
  };

  const transaction = await snap.createTransaction(parameter);
  return {
    token: transaction.token,
    redirectUrl: transaction.redirect_url
  };
}
