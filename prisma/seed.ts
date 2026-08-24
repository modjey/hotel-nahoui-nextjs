/**
 * Seed initial Super Admin.
 * Usage:
 *   npx tsx prisma/seed.ts
 *   # or via npm script: npm run db:seed
 *
 * Override defaults with env vars:
 *   SEED_ADMIN_EMAIL=admin@hotelnahoui.ci SEED_ADMIN_PASSWORD=ChangeMe!2025 npx tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { roomsData } from "./seed-rooms-data";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_USER_PASSWORD ?? "admin123!";

  const passwordHash = await bcrypt.hash(password, 12);

  const seedUsers = [
    { email: "yeowindi@gmail.com", name: "Super Admin", role: "SUPER_ADMIN" as const },
    { email: "hotelnahoui@yahoo.com", name: "Admin", role: "ADMIN" as const },
    { email: "user@gmail.com", name: "User", role: "USER" as const },
  ];

  for (const seedUser of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {
        emailVerified: new Date(),
        name: seedUser.name,
        passwordHash,
        role: seedUser.role,
        isActive: true,
      },
      create: {
        email: seedUser.email,
        emailVerified: new Date(),
        name: seedUser.name,
        passwordHash,
        role: seedUser.role,
        isActive: true,
      },
    });

    console.log(`✅ Seeded ${user.role}: ${user.email} (id: ${user.id})`);
  }

  console.log(`   Password: ${password}`);
  console.log(`   ⚠️  Change it after first login.`);

  // ---------------------------------------------------------------------------
  // Types de chambres par défaut
  // ---------------------------------------------------------------------------
  const defaultRoomTypes = [
    { slug: "standard", name: "Standard", order: 1, description: "Chambre standard confortable" },
    { slug: "confort", name: "Confort", order: 2, description: "Chambre spacieuse au design moderne" },
    { slug: "confort-plus", name: "Confort Plus", order: 3, description: "Chambre avec terrasse privative" },
    { slug: "prestige-plus", name: "Prestige Plus", order: 4, description: "Chambre avec double terrasse vue jardin, piscine et plage" },
    { slug: "suite-nuptiale", name: "Suite Nuptiale", order: 5, description: "Suite unique avec lit rond sur mesure" },
    { slug: "petite-mezzanine", name: "Petite Mezzanine", order: 6, description: "Espace familial avec salon et chambre en hauteur" },
    { slug: "grande-mezzanine", name: "Grande Mezzanine", order: 7, description: "Grande mezzanine familiale" },
    { slug: "mini-suite-senior", name: "Mini Suite Senior", order: 8, description: "Suite junior chic avec salon séparé" },
    { slug: "mini-suite-superieure", name: "Mini Suite Supérieure", order: 9, description: "Suite avec décoration minimaliste et double douche" },
    { slug: "suite-presidentielle", name: "Suite Présidentielle", order: 10, description: "Suite d'exception avec grand salon et double terrasse" },
  ];
  for (const rt of defaultRoomTypes) {
    await prisma.roomType.upsert({
      where: { slug: rt.slug },
      update: { name: rt.name, order: rt.order, description: rt.description },
      create: rt,
    });
  }
  console.log(`✅ Seeded ${defaultRoomTypes.length} room types`);

  // ---------------------------------------------------------------------------
  // Localisation de démo (idempotent)
  // ---------------------------------------------------------------------------
  await prisma.location.upsert({
    where: { slug: "san-pedro" },
    update: {},
    create: {
      slug: "san-pedro",
      name: "San Pedro",
      shortDescription: "Ville balnéaire dynamique du sud-ouest de la Côte d'Ivoire",
      description:
        "San Pedro est une ville balnéaire dynamique située au sud-ouest de la Côte d'Ivoire. " +
        "Connue pour son port, ses plages et son atmosphère animée, elle offre un cadre idéal pour un séjour inoubliable.",
      address: "Boulevard de la République",
      city: "San Pedro",
      country: "Côte d'Ivoire",
      latitude: 4.7493,
      longitude: -6.6285,
      mapLink: "https://www.google.com/maps/place/H%C3%B4tel+Nahoui+Sp/@4.7239875,-6.6443927,17z/data=!4m9!3m8!1s0xf961312d9e1df9d:0x7ba51b79fb1fd8ea!5m2!4m1!1i2!8m2!3d4.7239875!4d-6.6418178!16s%2Fg%2F11c2pjqlkp?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
      phone: "+225 27 33 00 00 00",
      email: "sanpedro@hotelnahoui.ci",
      coverImageUrl: "/assets/property-2.jpg",
      amenities: ["Piscine", "Restaurant", "Wi-Fi", "Parking", "Vue mer", "Climatisation"],
      isFeatured: true,
      order: 1,
    },
  });
  console.log(`✅ Seeded sample location: san-pedro`);

  const seededLocation = await prisma.location.findUnique({
    where: { slug: "san-pedro" },
  });

  if (!seededLocation) {
    throw new Error("Location san-pedro not found after seed");
  }

  const roomTypes = await prisma.roomType.findMany();
  const roomTypeIds = Object.fromEntries(roomTypes.map((roomType) => [roomType.slug, roomType.id]));
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
  const getRoomImages = (index: number) => {
    const startIdx = (index * 5) % roomImages.length;
    return Array.from({ length: 5 }, (_, imageIndex) => roomImages[(startIdx + imageIndex) % roomImages.length]);
  };

  const createdRooms: Array<{ id: string; slug: string }> = [];
  for (const roomData of roomsData) {
    const roomTypeId = roomTypeIds[roomData.roomTypeSlug];
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
        locationId: seededLocation.id,
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
        locationId: seededLocation.id,
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
  console.log(`✅ Seeded ${createdRooms.length} rooms`);

  let roomMediaCount = 0;
  for (let i = 0; i < createdRooms.length; i++) {
    const room = createdRooms[i];
    const images = getRoomImages(i);

    await prisma.room.update({
      where: { id: room.id },
      data: { coverImageUrl: images[0] },
    });

    for (let j = 0; j < images.length; j++) {
      await prisma.media.upsert({
        where: { id: `${room.id}-${j}` },
        update: {
          url: images[j],
          alt: `${room.slug} - Image ${j + 1}`,
          type: "IMAGE",
          roomId: room.id,
          order: j,
        },
        create: {
          id: `${room.id}-${j}`,
          url: images[j],
          alt: `${room.slug} - Image ${j + 1}`,
          type: "IMAGE",
          roomId: room.id,
          order: j,
        },
      });
      roomMediaCount++;
    }
  }
  console.log(`✅ Seeded ${roomMediaCount} room media items`);

  // ---------------------------------------------------------------------------
  // Catégories de plats du restaurant
  // ---------------------------------------------------------------------------
  const dishCategories = [
    { slug: "brochettes", name: "Nos Brochettes", description: "Nos brochettes grillées", order: 1, isPublished: true },
    { slug: "pizzas", name: "Pizzas", description: "Nos pizzas artisanales", order: 2, isPublished: true },
    { slug: "tradition", name: "Tradition", description: "Plats traditionnels ivoiriens", order: 3, isPublished: true },
    { slug: "desserts", name: "Desserts", description: "Nos desserts maison", order: 4, isPublished: true },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of dishCategories) {
    const created = await prisma.dishCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, order: cat.order, description: cat.description, isPublished: cat.isPublished },
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
  }
  console.log(`✅ Seeded ${dishCategories.length} dish categories`);

  // ---------------------------------------------------------------------------
  // Plats du restaurant
  // ---------------------------------------------------------------------------
  const dishImages = [
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/8f29ac13-8777-44c6-ac5e-ea025f22a1d7.jpeg?im_w=960",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/ccf6d547-5504-4188-9bf7-6e61169b8ce6.jpeg?im_w=960",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/73ef54ef-e7e7-4829-8a85-b0f31c5f1ee5.jpeg?im_w=960",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/7f69b39b-7b26-4a30-9a2c-3651ffc4f17f.jpeg?im_w=960&_swrbgfetch=1778279622666",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/d6c49557-5184-4b29-a8f0-1c528a998919.jpeg?im_w=960&_swrbgfetch=1778279658883",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/3efb2790-5ddf-40db-bef9-5c3ec26a070e.jpeg?im_w=960",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/51bc6d5e-687f-4dc9-b137-024f56b7d407.jpeg?im_w=960",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/698d0098-a06e-4b93-9b44-a63deeb70dd9.jpeg?im_w=960",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/9a5ddc7c-bd87-4410-ac02-0a20c6fcac9e.jpeg?im_w=960",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/286fd218-a74f-4608-91ce-c6de04ed062e.jpeg?im_w=960",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/1f67df68-4e2e-4a68-a012-14ee425c54b9.jpeg?im_w=960",
    "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/89cdd496-c4b9-4b99-a574-bfefcb7ced86.jpeg?im_w=960",
  ];

  const parsePrice = (priceStr: string): number => {
    const cleaned = priceStr.replace(/[^\d]/g, '');
    return parseInt(cleaned, 10) || 0;
  };

  const menuItems = [
    {
      categorySlug: "brochettes",
      items: [
        { name: "Brochette de blanc de poulet", price: "8 000 FCFA", description: "", image: dishImages[0] },
        { name: "Brochette de filet de Bœuf", price: "14 000 FCFA", description: "", image: dishImages[1] },
        { name: "Brochette de gésier", price: "6 000 FCFA", description: "", image: dishImages[2] },
        { name: "Brochette d'escargot", price: "8 000 FCFA", description: "", image: dishImages[3] },
        { name: "Brochette de poisson", price: "9 000 FCFA", description: "", image: dishImages[4] },
        { name: "Brochette d'écrevisse", price: "10 000 FCFA", description: "", image: dishImages[5] },
      ],
    },
    {
      categorySlug: "pizzas",
      items: [
        { name: "Pizza Margherita", price: "6 000 FCFA", description: "Sauce tomate, Mozzarella, Basilic", image: dishImages[6] },
        { name: "Pizza Marinara", price: "5 000 FCFA", description: "Sauce tomate, Ail, Persil", image: dishImages[7] },
        { name: "Pizza Napoli", price: "6 500 FCFA", description: "Sauce tomate, Mozzarella, Olives, Anchois", image: dishImages[8] },
        { name: "Pizza Royal", price: "8 000 FCFA", description: "Sauce tomate, Mozzarella, Jambon de porc ou bœuf", image: dishImages[9] },
        { name: "Pizza Capricciosa", price: "8 500 FCFA", description: "Sauce tomate, Mozzarella, Jambon, Champignon, Artichaud, Olive", image: dishImages[10] },
        { name: "Pizza Côte d'Ivoire", price: "8 000 FCFA", description: "Sauce tomate, Poulet, Poivron, Mozzarella, Oignon", image: dishImages[11] },
        { name: "Pizza au thon", price: "9 000 FCFA", description: "Sauce tomate, Mozzarella, Oignon, Thon, Olives", image: dishImages[0] },
        { name: "Pizza Alla Diavola", price: "8 500 FCFA", description: "Sauce tomate, Mozzarella, Chorizo piquante", image: dishImages[1] },
        { name: "Pizza Nahoui", price: "8 000 FCFA", description: "Crème fraiche, Mozzarella, Champignon, Jambon, Olives", image: dishImages[2] },
        { name: "Pizza Calzone", price: "9 500 FCFA", description: "Sauce tomate, Mozzarella, Jambon, Œuf", image: dishImages[3] },
        { name: "Pizza San Pedro", price: "8 000 FCFA", description: "Sauce tomate, Mozzarella, Viande hachée, Emmental, Poivron", image: dishImages[4] },
        { name: "Pizza Saumon", price: "10 000 FCFA", description: "Mozzarella, Crème fraiche, Saumon fumé, Courgette", image: dishImages[5] },
        { name: "Pizza Végétarienne", price: "10 000 FCFA", description: "Sauce tomate, Mozzarella, Courgette, Aubergine, Poivron, Artichaud, Champignon", image: dishImages[6] },
        { name: "Pizza Fruits de mer", price: "12 000 FCFA", description: "Sauce tomate, Mozzarella, Calamar, Crevette, Moule", image: dishImages[7] },
        { name: "Bufala", price: "12 000 FCFA", description: "Sauce tomate, Basilic, Mozzarella de buff, Tomate fraiche", image: dishImages[8] },
        { name: "Pizza Parma", price: "12 000 FCFA", description: "Sauce tomate, Mozzarella, Jambon de parme, Roquette, Parmesan", image: dishImages[9] },
      ],
    },
    {
      categorySlug: "tradition",
      items: [
        { name: "Escargot sauté", price: "9 000 FCFA", description: "", image: dishImages[10] },
        { name: "Soupe de viande de Brousse", price: "15 000 FCFA", description: "Selon arrivage", image: dishImages[11] },
        { name: "Lapin sauté", price: "15 000F / 8 000 FCFA", description: "Entier / Demi", image: dishImages[0] },
        { name: "Kédjénou de poulet africain", price: "10 000F / 6 000 FCFA", description: "Entier / Demi", image: dishImages[1] },
        { name: "Poulet (Braisé, Sauté, Kédjénou)", price: "8 000F / 5 000 FCFA", description: "Entier / Demi", image: dishImages[2] },
        { name: "Pintade (Braisé, Sauté, Kédjénou)", price: "12 500F / 7 500 FCFA", description: "Entière / Demi", image: dishImages[3] },
        { name: "Poisson (Braisé, Kédjénou, frit)", price: "8 000F à 16 000 FCFA", description: "Dorade, Carpe, Bar, Capitaine, Mâchoiron selon arrivage", image: dishImages[4] },
      ],
    },
    {
      categorySlug: "desserts",
      items: [
        { name: "Tiramisu Italienne", price: "6 000 FCFA", description: "", image: dishImages[5] },
        { name: "Fondant au chocolat, Boule de glace vanille", price: "5 000 FCFA", description: "", image: dishImages[6] },
        { name: "Crème brulée", price: "4 000 FCFA", description: "", image: dishImages[7] },
        { name: "Panna Cotta aux fruits rouge", price: "4 500 FCFA", description: "", image: dishImages[8] },
      ],
    },
  ];

  const location = await prisma.location.findFirst();
  if (!location) {
    console.error("❌ No location found. Please seed a location first.");
    return;
  }

  let dishCount = 0;
  for (const section of menuItems) {
    const categoryId = createdCategories[section.categorySlug];
    if (!categoryId) {
      console.warn(`⚠️ Category ${section.categorySlug} not found, skipping`);
      continue;
    }

    for (const item of section.items) {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const price = parsePrice(item.price);

      await prisma.dish.upsert({
        where: { slug },
        update: {
          name: item.name,
          description: item.description,
          price,
          imageUrl: item.image,
          categoryId,
          locationId: location.id,
          isAvailable: true,
          isPublished: true,
        },
        create: {
          slug,
          name: item.name,
          description: item.description,
          price,
          currency: "XOF",
          imageUrl: item.image,
          categoryId,
          locationId: location.id,
          isAvailable: true,
          isPublished: true,
          order: dishCount,
        },
      });
      dishCount++;
    }
  }
  console.log(`✅ Seeded ${dishCount} dishes`);

  // ---------------------------------------------------------------------------
  // Albums photo
  // ---------------------------------------------------------------------------
  const photoAlbums = [
    {
      slug: "galerie-officielle",
      name: "Galerie officielle",
      description: "Photos professionnelles de nos établissements",
      type: "GALLERY" as const,
      isPublished: true,
      isFeatured: true,
      order: 1,
    },
    {
      slug: "evenements",
      name: "Événements",
      description: "Mariages, conférences et événements spéciaux",
      type: "EVENT" as const,
      isPublished: true,
      isFeatured: false,
      order: 2,
    },
    {
      slug: "chambres",
      name: "Chambres",
      description: "Nos chambres et suites",
      type: "ROOM" as const,
      isPublished: true,
      isFeatured: false,
      order: 3,
    },
    {
      slug: "equipements",
      name: "Équipements",
      description: "Piscine, restaurant, spa et installations",
      type: "AMENITY" as const,
      isPublished: true,
      isFeatured: false,
      order: 4,
    },
  ];

  const createdAlbums: Record<string, string> = {};
  for (const album of photoAlbums) {
    const created = await prisma.photoAlbum.upsert({
      where: { slug: album.slug },
      update: {
        name: album.name,
        description: album.description,
        type: album.type,
        isPublished: album.isPublished,
        isFeatured: album.isFeatured,
        order: album.order,
      },
      create: album,
    });
    createdAlbums[album.slug] = created.id;
  }
  console.log(`✅ Seeded ${photoAlbums.length} photo albums`);

  // ---------------------------------------------------------------------------
  // Photos
  // ---------------------------------------------------------------------------
  const photoImages = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800",
  ];

  const photos = [
    {
      albumSlug: "galerie-officielle",
      title: "Vue sur la piscine",
      description: "Notre piscine principale avec vue sur la lagune",
      imageUrl: photoImages[0],
      isFeatured: true,
    },
    {
      albumSlug: "galerie-officielle",
      title: "Suite Présidentielle",
      description: "La suite la plus prestigieuse de notre établissement",
      imageUrl: photoImages[1],
      isFeatured: true,
    },
    {
      albumSlug: "galerie-officielle",
      title: "Restaurant",
      description: "Notre restaurant avec vue panoramique",
      imageUrl: photoImages[2],
      isFeatured: false,
    },
    {
      albumSlug: "chambres",
      title: "Chambre Confort",
      description: "Chambre confortable et bien équipée",
      imageUrl: photoImages[3],
      isFeatured: false,
    },
    {
      albumSlug: "chambres",
      title: "Suite Sénior",
      description: "Suite spacieuse avec salon",
      imageUrl: photoImages[4],
      isFeatured: true,
    },
    {
      albumSlug: "equipements",
      title: "Spa & Wellness",
      description: "Notre espace détente et bien-être",
      imageUrl: photoImages[5],
      isFeatured: false,
    },
    {
      albumSlug: "equipements",
      title: "Jardins tropicaux",
      description: "Nos jardins luxuriants",
      imageUrl: photoImages[6],
      isFeatured: false,
    },
    {
      albumSlug: "evenements",
      title: "Salle de réception",
      description: "Notre salle pour vos événements",
      imageUrl: photoImages[7],
      isFeatured: true,
    },
  ];

  let photoCount = 0;
  for (const photo of photos) {
    const albumId = createdAlbums[photo.albumSlug];
    if (!albumId) {
      console.warn(`⚠️ Album ${photo.albumSlug} not found, skipping`);
      continue;
    }

    const slug = (photo.title || "photo").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + `-${photoCount}`;

    await prisma.photo.upsert({
      where: { slug },
      update: {
        title: photo.title,
        description: photo.description,
        imageUrl: photo.imageUrl,
        isFeatured: photo.isFeatured,
        order: photoCount,
      },
      create: {
        slug,
        title: photo.title,
        description: photo.description,
        imageUrl: photo.imageUrl,
        albumId,
        isApproved: true,
        isFeatured: photo.isFeatured,
        order: photoCount,
      },
    });
    photoCount++;
  }
  console.log(`✅ Seeded ${photoCount} photos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
