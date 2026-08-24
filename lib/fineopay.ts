interface FineoPayConfig {
  apiUrl: string;
  businessCode: string;
  apiKey: string;
  callbackUrl: string;
}

interface CheckoutRequest {
  amount: number;
  currency: string;
  reference: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
}

interface CheckoutResponse {
  success: boolean;
  data?: {
    checkoutLink: string;
    payment_id: string;
    reference: string;
  };
  message?: string;
}

interface CallbackData {
  syncRef: string;
  reference: string;
  amount: number;
  status: string;
  clientAccountNumber?: string;
  timestamp: string;
}

interface Payment {
  id: string;
  reference: string;
  amount: number;
  status: string;
  transaction_id?: string;
  payment_method?: string;
  payment_date?: string;
  metadata?: Record<string, any>;
}

class FineoPayService {
  private config: FineoPayConfig;

  constructor(config: FineoPayConfig) {
    this.config = config;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'businessCode': this.config.businessCode,
      'apiKey': this.config.apiKey,
    };
  }

  /**
   * Create checkout link for booking payment
   */
  async createBookingCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          title: request.description,
          amount: request.amount,
          callbackUrl: this.config.callbackUrl,
          syncRef: request.reference,
        }),
      });

      const data = await response.json();

      console.log('=== FINEOPAY RESPONSE ===', {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data) || 'Failed to create checkout');
      }

      return {
        success: true,
        data: {
          checkoutLink: data.data?.checkoutLink,
          payment_id: data.data?.syncRef,
          reference: data.data?.syncRef,
        },
      };
    } catch (error) {
      console.error('FineoPay checkout error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create checkout',
      };
    }
  }

  /**
   * Handle payment callback from FineoPay
   */
  async handleCallback(callbackData: CallbackData): Promise<Payment> {
    // Verify signature if needed
    // For now, return the callback data as payment info
    return {
      id: callbackData.syncRef,
      reference: callbackData.reference,
      amount: callbackData.amount,
      status: callbackData.status,
      transaction_id: callbackData.syncRef,
      payment_method: callbackData.clientAccountNumber,
      payment_date: callbackData.timestamp,
    };
  }

  /**
   * Update payment status in database
   */
  async updatePaymentStatus(reference: string, status: string, transactionId?: string): Promise<void> {
    // This will be implemented in the callback route
    // The callback route will use Prisma to update the payment status
  }

  /**
   * Get payment by reference
   */
  async getPaymentByReference(reference: string): Promise<Payment | null> {
    try {
      const response = await fetch(`${this.config.apiUrl.replace('/checkout-link', '')}/payments/${reference}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('FineoPay get payment error:', error);
      return null;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<Payment | null> {
    try {
      const response = await fetch(`${this.config.apiUrl.replace('/checkout-link', '')}/payments/${paymentId}/status`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('FineoPay get payment status error:', error);
      return null;
    }
  }
}

// Create singleton instance
const fineoPayConfig: FineoPayConfig = {
  apiUrl: process.env.FINEOPAY_API_URL || 'https://api.fineopay.com/api/v1/business/dev/checkout-link',
  businessCode: process.env.FINEOPAY_BUSINESS_CODE || '',
  apiKey: process.env.FINEOPAY_API_KEY || '',
  callbackUrl: process.env.FINEOPAY_CALLBACK_URL || '',
};

export const fineoPayService = new FineoPayService(fineoPayConfig);
export default fineoPayService;
