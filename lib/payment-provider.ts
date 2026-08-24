import { fineoPayService } from './fineopay';
import { centralApisService } from './centralapis';

export type PaymentProvider = 'fineopay' | 'centralapis';

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
  [key: string]: any;
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

interface PaymentProviderService {
  createBookingCheckout(request: CheckoutRequest): Promise<CheckoutResponse>;
  handleCallback(callbackData: CallbackData): Promise<Payment>;
  getPaymentStatus?(paymentId: string): Promise<Payment | null>;
  getTransactionStatus?(reference: string): Promise<Payment | null>;
  updatePaymentStatus?(reference: string, status: string, transactionId?: string): Promise<void>;
  getPaymentByReference?(reference: string): Promise<Payment | null>;
}

class PaymentProviderManager {
  private currentProvider: PaymentProvider;
  private providers: Map<PaymentProvider, PaymentProviderService>;

  constructor() {
    this.currentProvider = (process.env.PAYMENT_PROVIDER as PaymentProvider) || 'fineopay';
    this.providers = new Map<PaymentProvider, PaymentProviderService>([
      ['fineopay', fineoPayService],
      ['centralapis', centralApisService],
    ]);
  }

  /**
   * Get the current payment provider
   */
  getCurrentProvider(): PaymentProvider {
    return this.currentProvider;
  }

  /**
   * Switch to a different payment provider
   */
  switchProvider(provider: PaymentProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Payment provider '${provider}' is not supported`);
    }
    this.currentProvider = provider;
    console.log(`Switched to payment provider: ${provider}`);
  }

  /**
   * Get the service instance for the current provider
   */
  private getService(): PaymentProviderService {
    const service = this.providers.get(this.currentProvider);
    if (!service) {
      throw new Error(`Payment provider '${this.currentProvider}' is not configured`);
    }
    return service;
  }

  /**
   * Create checkout link using the current provider
   */
  async createCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    const service = this.getService();
    return service.createBookingCheckout(request);
  }

  /**
   * Handle payment callback using the current provider
   */
  async handleCallback(callbackData: CallbackData): Promise<Payment> {
    const service = this.getService();
    return service.handleCallback(callbackData);
  }

  /**
   * Get payment status using the current provider
   */
  async getPaymentStatus(paymentId: string): Promise<Payment | null> {
    const service = this.getService();
    
    if (service.getPaymentStatus) {
      return service.getPaymentStatus(paymentId);
    }
    
    if (service.getTransactionStatus) {
      return service.getTransactionStatus(paymentId);
    }
    
    throw new Error('Current provider does not support status checking');
  }

  /**
   * Get transaction status by reference (for providers that support it)
   */
  async getTransactionStatus(reference: string): Promise<Payment | null> {
    const service = this.getService();
    
    if (service.getTransactionStatus) {
      return service.getTransactionStatus(reference);
    }
    
    if (service.getPaymentStatus) {
      return service.getPaymentStatus(reference);
    }
    
    throw new Error('Current provider does not support transaction status checking');
  }
}

// Create singleton instance
export const paymentProviderManager = new PaymentProviderManager();

// Export convenience functions
export const createCheckout = (request: CheckoutRequest) => 
  paymentProviderManager.createCheckout(request);

export const handlePaymentCallback = (callbackData: CallbackData) => 
  paymentProviderManager.handleCallback(callbackData);

export const getPaymentStatus = (paymentId: string) => 
  paymentProviderManager.getPaymentStatus(paymentId);

export const getTransactionStatus = (reference: string) => 
  paymentProviderManager.getTransactionStatus(reference);

export const switchPaymentProvider = (provider: PaymentProvider) => 
  paymentProviderManager.switchProvider(provider);

export const getCurrentPaymentProvider = () => 
  paymentProviderManager.getCurrentProvider();

export default paymentProviderManager;
