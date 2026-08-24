interface CentralApisConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

interface DepositRequest {
  numberClient: string;
  typeService: string;
  amount: number;
  reference: string;
}

interface WithdrawRequest {
  numberClient: string;
  typeService: string;
  amount: number;
  reference: string;
}

interface CentralApisResponse {
  etat: boolean;
  result?: {
    recipient_phone_number: string;
    partner_reference: string;
    amount_send_net: string;
    amount_receive_in_balance: string;
    service: string;
    typeTransaction: 'DEPOSIT' | 'WITHDRAW';
    state: 'INITIALISE' | 'PENDING' | 'DONE' | 'FAILURE';
    transaction_reference: string;
    payment_url?: string;
  };
  error?: string[];
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
  recipient_phone_number?: string;
  partner_reference?: string;
  amount_send_net?: string;
  amount_receive_in_balance?: string;
  service?: string;
  typeTransaction?: 'DEPOSIT' | 'WITHDRAW';
  state?: 'INITIALISE' | 'PENDING' | 'DONE' | 'FAILURE';
  transaction_reference?: string;
  payment_url?: string;
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

class CentralApisService {
  private config: CentralApisConfig;

  constructor(config: CentralApisConfig) {
    this.config = config;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-app-access': this.config.clientId,
      'x-app-token': this.config.clientSecret,
    };
  }

  /**
   * Create checkout link for booking payment using CASHOUT (deposit)
   * This debits the customer's mobile money account
   */
  async createBookingCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      // Extract phone number from customer
      const phoneNumber = request.customer?.phone?.replace(/\D/g, '') || '';
      
      // Remove country code if present (keep only 8-10 digits)
      const cleanPhone = phoneNumber.length > 10 ? phoneNumber.slice(-10) : phoneNumber;

      if (!cleanPhone) {
        return {
          success: false,
          message: 'Customer phone number is required for mobile money payment',
        };
      }

      const depositRequest: DepositRequest = {
        numberClient: cleanPhone,
        typeService: 'mtn', // Default to MTN, can be configured
        amount: request.amount,
        reference: request.reference,
      };

      const response = await fetch(`${this.config.apiUrl}/deposit`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(depositRequest),
      });

      const data: CentralApisResponse = await response.json();

      console.log('=== CENTRAL APIS RESPONSE ===', {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok || !data.etat) {
        throw new Error(data.error?.join(', ') || 'Failed to create checkout');
      }

      return {
        success: true,
        data: {
          checkoutLink: data.result?.payment_url || `${request.returnUrl}?reference=${request.reference}`,
          payment_id: data.result?.transaction_reference || request.reference,
          reference: data.result?.partner_reference || request.reference,
        },
      };
    } catch (error) {
      console.error('CentralApis checkout error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create checkout',
      };
    }
  }

  /**
   * Handle payment callback from CentralApis
   */
  async handleCallback(callbackData: CallbackData): Promise<Payment> {
    return {
      id: callbackData.transaction_reference || callbackData.partner_reference || '',
      reference: callbackData.partner_reference || '',
      amount: callbackData.amount_send_net ? parseFloat(callbackData.amount_send_net) : 0,
      status: this.mapCentralApisStatus(callbackData.state || 'INITIALISE'),
      transaction_id: callbackData.transaction_reference,
      payment_method: callbackData.service,
      payment_date: new Date().toISOString(),
      metadata: {
        recipient_phone_number: callbackData.recipient_phone_number,
        amount_receive_in_balance: callbackData.amount_receive_in_balance,
        typeTransaction: callbackData.typeTransaction,
        payment_url: callbackData.payment_url,
      },
    };
  }

  /**
   * Map CentralApis status to internal payment status
   */
  private mapCentralApisStatus(state: string): string {
    switch (state) {
      case 'DONE':
        return 'SUCCESS';
      case 'FAILURE':
        return 'FAILED';
      case 'PENDING':
      case 'INITIALISE':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  }

  /**
   * Get transaction status by reference
   */
  async getTransactionStatus(reference: string): Promise<Payment | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/status/transaction/${reference}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data: CentralApisResponse = await response.json();

      if (!data.etat || !data.result) {
        return null;
      }

      return {
        id: data.result.transaction_reference,
        reference: data.result.partner_reference,
        amount: parseFloat(data.result.amount_send_net),
        status: this.mapCentralApisStatus(data.result.state),
        transaction_id: data.result.transaction_reference,
        payment_method: data.result.service,
        payment_date: new Date().toISOString(),
        metadata: {
          recipient_phone_number: data.result.recipient_phone_number,
          amount_receive_in_balance: data.result.amount_receive_in_balance,
          typeTransaction: data.result.typeTransaction,
          payment_url: data.result.payment_url,
        },
      };
    } catch (error) {
      console.error('CentralApis get transaction status error:', error);
      return null;
    }
  }

  /**
   * Process withdrawal (CASHIN) - credit customer account
   * This can be used for refunds
   */
  async processWithdrawal(request: WithdrawRequest): Promise<CentralApisResponse> {
    try {
      const response = await fetch(`${this.config.apiUrl}/withdraw`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      const data: CentralApisResponse = await response.json();

      console.log('=== CENTRAL APIS WITHDRAWAL RESPONSE ===', {
        status: response.status,
        ok: response.ok,
        data,
      });

      return data;
    } catch (error) {
      console.error('CentralApis withdrawal error:', error);
      return {
        etat: false,
        error: [error instanceof Error ? error.message : 'Failed to process withdrawal'],
      };
    }
  }
}

// Create singleton instance
const centralApisConfig: CentralApisConfig = {
  apiUrl: process.env.CENTRAL_APIS_API_URL || 'https://api.centralapis.com/api/v1/finance',
  clientId: process.env.CENTRAL_APIS_CLIENT_ID || '',
  clientSecret: process.env.CENTRAL_APIS_CLIENT_SECRET || '',
  callbackUrl: process.env.CENTRAL_APIS_CALLBACK_URL || '',
};

export const centralApisService = new CentralApisService(centralApisConfig);
export default centralApisService;
