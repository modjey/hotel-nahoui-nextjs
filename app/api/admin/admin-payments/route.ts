import { prisma } from '@/lib/prisma';
import { ok, fail, withAuth } from '@/lib/auth/api';

export const runtime = 'nodejs';

const handler = withAuth(async (req) => {
  if (req.method !== 'GET') return fail('Méthode non autorisée', 405, 'METHOD_NOT_ALLOWED');

  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { transactionId: { contains: search, mode: 'insensitive' } },
        { booking: { reference: { contains: search, mode: 'insensitive' } } },
        { booking: { user: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Fetch payments with pagination
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          booking: {
            select: {
              id: true,
              reference: true,
              status: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              room: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return ok({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return fail('Failed to fetch payments', 500, 'FETCH_ERROR');
  }
}, { roles: ['ADMIN', 'SUPER_ADMIN'] });

export { handler as GET };
