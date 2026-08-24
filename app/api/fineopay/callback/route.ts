import { NextRequest, NextResponse } from 'next/server';
import { fineoPayService } from '@/lib/fineopay';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();

    console.log('=== FINEOPAY CALLBACK RECEIVED ===', {
      timestamp: new Date().toISOString(),
      syncRef: callbackData.syncRef,
      status: callbackData.status,
      reference: callbackData.reference,
      amount: callbackData.amount,
    });

    // Validate required fields
    if (!callbackData.syncRef || !callbackData.status || !callbackData.reference) {
      console.error('Invalid callback data: missing required fields');
      return NextResponse.json(
        { success: false, message: 'Invalid callback data' },
        { status: 400 }
      );
    }

    // Process the callback
    const payment = await fineoPayService.handleCallback(callbackData);

    console.log('=== FINEOPAY CALLBACK PROCESSED ===', {
      payment_id: payment.id,
      reference: payment.reference,
      status: payment.status,
    });

    // Update payment status in database
    const existingPayment = await prisma.payment.findUnique({
      where: { reference: payment.reference },
      include: { booking: true },
    });

    if (existingPayment) {
      // Update existing payment
      // Convert status from lowercase "success"/"failed" to uppercase "SUCCESS"/"FAILED"
      const paymentStatus = callbackData.status.toLowerCase() === 'success' ? 'SUCCESS' : callbackData.status.toLowerCase() === 'failed' ? 'FAILED' : 'PENDING';

      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: paymentStatus,
          transactionId: callbackData.syncRef,
          paidAt: paymentStatus === 'SUCCESS' ? new Date(callbackData.timestamp) : null,
        },
      });

      // Update booking status based on payment status
      if (paymentStatus === 'SUCCESS') {
        await prisma.booking.update({
          where: { id: existingPayment.bookingId },
          data: { 
            status: 'CONFIRMED',
            expiresAt: null, // Clear expiration when confirmed
          },
        });
      } else if (paymentStatus === 'FAILED') {
        await prisma.booking.update({
          where: { id: existingPayment.bookingId },
          data: { status: 'PENDING' },
        });
      }

      console.log('=== PAYMENT UPDATED ===', {
        payment_id: existingPayment.id,
        reference: payment.reference,
        status: paymentStatus,
        booking_status: paymentStatus === 'SUCCESS' ? 'CONFIRMED' : 'PENDING',
      });
    } else {
      console.log('=== PAYMENT NOT FOUND ===', {
        reference: payment.reference,
      });
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('=== FINEOPAY CALLBACK ERROR ===', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to process callback' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
