import { NextRequest, NextResponse } from 'next/server';
import { paymentProviderManager } from '@/lib/payment-provider';
import { prisma } from '@/lib/prisma';
import { notifyAdminNewBooking } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = 'XOF',
      reference,
      description,
      returnUrl,
      cancelUrl,
      customer,
      metadata,
    } = body;

    if (!amount || !reference) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: amount, reference' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // If booking_id is provided in metadata, use existing booking
    if (metadata?.booking_id) {
      const existingBooking = await prisma.booking.findUnique({
        where: { id: metadata.booking_id },
        include: { payment: true },
      });

      if (!existingBooking) {
        return NextResponse.json(
          { success: false, message: 'Booking not found' },
          { status: 404 }
        );
      }

      // Create or update payment
      let payment;
      if (existingBooking.payment) {
        payment = await prisma.payment.update({
          where: { id: existingBooking.payment.id },
          data: {
            status: 'PENDING',
            amount,
            currency,
          },
        });
      } else {
        payment = await prisma.payment.create({
          data: {
            reference,
            bookingId: existingBooking.id,
            amount,
            currency,
            status: 'PENDING',
            method: 'MOBILE_MONEY',
            provider: paymentProviderManager.getCurrentProvider(),
            customerName: customer?.name || null,
            customerEmail: customer?.email || null,
            customerPhone: customer?.phone || null,
          },
        });
      }

      // Create checkout using the current payment provider
      const result = await paymentProviderManager.createCheckout({
        amount,
        currency,
        reference,
        description: description || 'Paiement réservation',
        returnUrl: returnUrl || `${baseUrl}/bookings/confirmed?reference=${reference}`,
        cancelUrl: cancelUrl || `${baseUrl}/bookings/cancelled?reference=${reference}`,
        customer,
        metadata,
      });

      if (!result.success) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json(result);
    }

    // Prepare booking data for new booking
    const bookingData: any = {
      reference,
      room: {
        connect: { id: metadata?.room_id || '' },
      },
      checkIn: metadata?.check_in ? new Date(metadata.check_in) : new Date(),
      checkOut: metadata?.check_out ? new Date(metadata.check_out) : new Date(),
      adults: metadata?.adults || 1,
      children: metadata?.children || 0,
      guestFirstName: customer?.name?.split(' ')[0] || null,
      guestLastName: customer?.name?.split(' ').slice(1).join(' ') || null,
      guestEmail: customer?.email || null,
      guestPhone: customer?.phone || null,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    };

    // Only include user relation if userId is provided
    if (metadata?.userId) {
      bookingData.user = {
        connect: { id: metadata.userId },
      };
    }

    // Create Booking record in database
    const booking = await prisma.booking.create({
      data: bookingData,
      include: { room: { select: { name: true } } },
    });

    console.log('=== BOOKING CREATED ===', {
      booking_id: booking.id,
      reference: booking.reference,
    });

    await notifyAdminNewBooking({
      reference: booking.reference,
      roomName: booking.room?.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      adults: booking.adults,
      children: booking.children,
      status: booking.status,
      guestFirstName: booking.guestFirstName,
      guestLastName: booking.guestLastName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
    });

    // Create Payment record in database
    const payment = await prisma.payment.create({
      data: {
        reference,
        bookingId: booking.id,
        amount,
        currency,
        status: 'PENDING',
        method: 'MOBILE_MONEY',
        provider: paymentProviderManager.getCurrentProvider(),
        customerName: customer?.name || null,
        customerEmail: customer?.email || null,
        customerPhone: customer?.phone || null,
      },
    });

    console.log('=== PAYMENT CREATED ===', {
      payment_id: payment.id,
      reference: payment.reference,
      booking_id: payment.bookingId,
    });

    // Create checkout using the current payment provider
    const result = await paymentProviderManager.createCheckout({
      amount,
      currency,
      reference,
      description: description || 'Réservation de chambre',
      returnUrl: returnUrl || `${baseUrl}/bookings/confirmed?reference=${reference}`,
      cancelUrl: cancelUrl || `${baseUrl}/bookings/cancelled?reference=${reference}`,
      customer,
      metadata,
    });

    console.log('=== PAYMENT PROVIDER SERVICE RESULT ===', result);

    if (!result.success) {
      // Update payment status to FAILED
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    const response = NextResponse.json(result);
    console.log('=== API RESPONSE ===', response);
    return response;
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
