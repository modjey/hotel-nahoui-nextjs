/** Sélection de média pour les payloads publics. */
export const mediaSelect = {
  id: true,
  type: true,
  provider: true,
  url: true,
  thumbnailUrl: true,
  title: true,
  alt: true,
  order: true,
  width: true,
  height: true,
  durationSec: true,
};

export const roomTypeSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  order: true,
  isPublished: true,
};

export const roomCardSelect = {
  id: true,
  slug: true,
  name: true,
  roomNumber: true,
  shortDescription: true,
  basePrice: true,
  currency: true,
  maxGuests: true,
  beds: true,
  bathrooms: true,
  sizeSqm: true,
  coverImageUrl: true,
  isPublished: true,
  isFeatured: true,
  order: true,
  roomType: { select: { id: true, slug: true, name: true } },
  location: { select: { id: true, slug: true, name: true, city: true } },
};

export const roomDetailSelect = {
  ...roomCardSelect,
  description: true,
  amenities: true,
  createdAt: true,
  checkInStart: true,
  checkInEnd: true,
  checkOutTime: true,
  checkInMethod: true,
  cancellationPolicy: true,
  media: {
    select: mediaSelect,
    orderBy: { order: "asc" as const },
  },
};

export const locationCardSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  city: true,
  country: true,
  coverImageUrl: true,
  isPublished: true,
  isFeatured: true,
  order: true,
  _count: { select: { rooms: { where: { isPublished: true } } } },
};

export const locationDetailSelect = {
  ...locationCardSelect,
  description: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  email: true,
  amenities: true,
  media: { select: mediaSelect, orderBy: { order: "asc" as const } },
  rooms: {
    where: { isPublished: true },
    orderBy: [{ order: "asc" as const }, { createdAt: "desc" as const }],
    select: roomCardSelect,
  },
};
