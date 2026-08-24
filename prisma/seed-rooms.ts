import { PrismaClient } from "@prisma/client";
import { roomsData } from "./seed-rooms-data";

const prisma = new PrismaClient();

async function seedRooms() {
  console.log("🌱 Seeding rooms data...");

  // Get or create San Pedro location
  const location = await prisma.location.upsert({
    where: { slug: "san-pedro" },
    update: {},
    create: {
      name: "San Pedro",
      slug: "san-pedro",
      description: "Ville balnéaire dynamique du sud-ouest de la Côte d'Ivoire",
      country: "Côte d'Ivoire",
      isPublished: true,
      order: 1,
    },
  });

  console.log(`✅ Location: ${location.name}`);

  // Get room types
  const roomTypeSlugs = [
    "standard", "confort", "confort-plus", "prestige-plus",
    "suite-nuptiale", "petite-mezzanine", "grande-mezzanine",
    "mini-suite-senior", "mini-suite-superieure", "suite-presidentielle"
  ];

  const roomTypes: Record<string, string> = {};
  for (const slug of roomTypeSlugs) {
    const rt = await prisma.roomType.findUnique({ where: { slug } });
    if (rt) {
      roomTypes[slug] = rt.id;
    }
  }

  console.log(`✅ Found ${Object.keys(roomTypes).length} room types`);

  // Images disponibles dans public/uploads/rooms
  const roomImages = [
    "/uploads/rooms/Image2.jpg",
    "/uploads/rooms/Image3.jpg",
    "/uploads/rooms/Image4.jpg",
    "/uploads/rooms/Image5.jpg",
    "/uploads/rooms/Image6.jpg",
    "/uploads/rooms/Image7.jpg",
    "/uploads/rooms/Image8.jpg",
    "/uploads/rooms/Image9.jpg",
    "/uploads/rooms/Image10.jpg",
    "/uploads/rooms/Image11.jpg",
    "/uploads/rooms/Image12.jpg",
    "/uploads/rooms/Image13.jpg",
  ];

  // Assigner les images aux chambres (1 couverture + 4 images par chambre)
  const getRoomImages = (index: number) => {
    const startIdx = (index * 5) % roomImages.length;
    const images = [];
    for (let i = 0; i < 5; i++) {
      images.push(roomImages[(startIdx + i) % roomImages.length]);
    }
    return images;
  };

  // Create rooms from data
  const createdRooms: Array<{ id: string; slug: string }> = [];
  for (const roomData of roomsData) {
    const roomTypeId = roomTypes[roomData.roomTypeSlug];
    if (!roomTypeId) {
      console.warn(`⚠️ Room type ${roomData.roomTypeSlug} not found, skipping ${roomData.slug}`);
      continue;
    }

    const room = await prisma.room.upsert({
      where: { slug: roomData.slug },
      update: {
        name: roomData.name,
        roomNumber: roomData.roomNumber,
        shortDescription: roomData.shortDescription,
        description: roomData.description,
        locationId: location.id,
        roomTypeId,
        basePrice: roomData.basePrice,
        currency: roomData.currency,
        maxGuests: roomData.maxGuests,
        beds: roomData.beds,
        bathrooms: roomData.bathrooms,
        sizeSqm: roomData.sizeSqm,
        amenities: roomData.amenities,
        isPublished: roomData.isPublished,
        isFeatured: roomData.isFeatured,
        order: roomData.order,
        checkInStart: roomData.checkInStart,
        checkInEnd: roomData.checkInEnd,
        checkOutTime: roomData.checkOutTime,
        checkInMethod: roomData.checkInMethod,
        cancellationPolicy: roomData.cancellationPolicy,
      },
      create: {
        slug: roomData.slug,
        name: roomData.name,
        roomNumber: roomData.roomNumber,
        shortDescription: roomData.shortDescription,
        description: roomData.description,
        locationId: location.id,
        roomTypeId,
        basePrice: roomData.basePrice,
        currency: roomData.currency,
        maxGuests: roomData.maxGuests,
        beds: roomData.beds,
        bathrooms: roomData.bathrooms,
        sizeSqm: roomData.sizeSqm,
        amenities: roomData.amenities,
        isPublished: roomData.isPublished,
        isFeatured: roomData.isFeatured,
        order: roomData.order,
        checkInStart: roomData.checkInStart,
        checkInEnd: roomData.checkInEnd,
        checkOutTime: roomData.checkOutTime,
        checkInMethod: roomData.checkInMethod,
        cancellationPolicy: roomData.cancellationPolicy,
      },
    });
    createdRooms.push({ id: room.id, slug: room.slug });
  }

  console.log(`✅ Created ${createdRooms.length} rooms`);

  // Create media for rooms (1 cover + 4 images per room)
  let mediaCount = 0;
  for (let i = 0; i < createdRooms.length; i++) {
    const room = createdRooms[i];
    const images = getRoomImages(i);

    // Set cover image
    await prisma.room.update({
      where: { id: room.id },
      data: { coverImageUrl: images[0] },
    });

    // Create media entries
    for (let j = 0; j < images.length; j++) {
      await prisma.media.upsert({
        where: {
          id: `${room.id}-${j}`,
        },
        update: {},
        create: {
          id: `${room.id}-${j}`,
          url: images[j],
          alt: `${room.slug} - Image ${j + 1}`,
          type: "IMAGE",
          roomId: room.id,
          order: j,
        },
      });
      mediaCount++;
    }
  }

  console.log(`✅ Created ${mediaCount} media items`);

  console.log("🎉 Room seeding completed!");
}

seedRooms()
  .catch((e) => {
    console.error("❌ Error seeding rooms:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
