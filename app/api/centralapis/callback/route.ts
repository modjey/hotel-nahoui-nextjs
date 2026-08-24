import { NextRequest, NextResponse } from 'next/server';
import { centralApisService } from '@/lib/centralapis';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();

    console.log('=== CENTRAL APIS CALLBACK RECEIVED ===', {
      timestamp: new Date().toISOString(),
      data: callbackData,
    });

    // Validate required fields
    if (!callbackData.partner_reference || !callbackData.state) {
      console.error('Invalid callback data: missing required fields');
      return NextResponse.json(
        { success: false, message: 'Invalid callback data' },
        { status: 400 }
      );
    }

    // Process the callback
    const payment = await centralApisService.handleCallback(callbackData);

    console.log('=== CENTRAL APIS CALLBACK PROCESSED ===', {
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
    console.error('=== CENTRAL APIS CALLBACK ERROR ===', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to process callback' },
      { status: 500 }
    );
  }
}
