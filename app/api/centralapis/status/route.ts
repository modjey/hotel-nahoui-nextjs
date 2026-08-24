import { NextRequest, NextResponse } from 'next/server';
import { centralApisService } from '@/lib/centralapis';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Reference is required' },
        { status: 400 }
      );
    }

    // Try to get transaction status from CentralApis
    const transactionStatus = await centralApisService.getTransactionStatus(reference);

    if (transactionStatus) {
      // Update payment status in database if transaction exists
      await prisma.payment.update({
        where: { reference },
        data: {
          status: transactionStatus.status as 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED',
          transactionId: transactionStatus.transaction_id,
          paidAt: transactionStatus.status === 'SUCCESS' ? new Date() : null,
        },
      });

      return NextResponse.json({
        success: true,
        data: transactionStatus,
      });
    }

    // If not found in CentralApis, return from database
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { booking: true },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        bookingStatus: payment.booking?.status,
      },
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get payment status' },
      { status: 500 }
    );
  }
}
