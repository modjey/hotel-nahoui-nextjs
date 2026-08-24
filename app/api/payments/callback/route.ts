import { NextRequest, NextResponse } from 'next/server';
import { paymentProviderManager } from '@/lib/payment-provider';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();

    console.log('=== PAYMENT CALLBACK RECEIVED ===', {
      timestamp: new Date().toISOString(),
      provider: paymentProviderManager.getCurrentProvider(),
      data: callbackData,
    });

    // Validate required fields based on provider
    const provider = paymentProviderManager.getCurrentProvider();
    let isValid = false;
    
    if (provider === 'fineopay') {
      isValid = !!(callbackData.syncRef && callbackData.status && callbackData.reference);
    } else if (provider === 'centralapis') {
      isValid = !!(callbackData.partner_reference && callbackData.state);
    }
    
    if (!isValid) {
      console.error('Invalid callback data: missing required fields');
      return NextResponse.json(
        { success: false, message: 'Invalid callback data' },
        { status: 400 }
      );
    }

    // Process the callback using the current provider
    const payment = await paymentProviderManager.handleCallback(callbackData);

    console.log('=== PAYMENT CALLBACK PROCESSED ===', {
      payment_id: payment.id,
      reference: payment.reference,
      status: payment.status,
    });

    // Update payment status in database
    const updatedPayment = await prisma.payment.update({
      where: { reference: payment.reference },
      data: {
        status: payment.status as 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED',
        transactionId: payment.transaction_id,
        paidAt: payment.status === 'SUCCESS' ? new Date() : null,
      },
      include: { booking: true },
    });

    console.log('=== PAYMENT UPDATED ===', {
      payment_id: updatedPayment.id,
      status: updatedPayment.status,
      booking_id: updatedPayment.bookingId,
    });

    // Update booking status based on payment status
    if (updatedPayment.booking) {
      let bookingStatus = updatedPayment.booking.status;
      
      if (payment.status === 'SUCCESS') {
        bookingStatus = 'CONFIRMED';
      } else if (payment.status === 'FAILED') {
        bookingStatus = 'CANCELLED';
      }

      await prisma.booking.update({
        where: { id: updatedPayment.bookingId },
        data: { status: bookingStatus },
      });

      console.log('=== BOOKING UPDATED ===', {
        booking_id: updatedPayment.bookingId,
        status: bookingStatus,
      });
    }
    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('=== PAYMENT CALLBACK ERROR ===', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to process callback' },
      { status: 500 }
    );
  }
}
