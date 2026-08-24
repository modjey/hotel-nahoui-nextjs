import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedBlog() {
  console.log("🌱 Seeding blog data...");

  // Get any user for author
  let author = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!author) {
    author = await prisma.user.findFirst();
  }

  if (!author) {
    console.error("❌ No user found in database. Please create a user first.");
    return;
  }

  console.log(`✅ Using user ${author.name || author.email} as author`);

  // Create categories
  const categories = await Promise.all([
    prisma.blogCategory.upsert({
      where: { slug: "evenements" },
      update: {},
      create: {
        name: "Événements",
        slug: "evenements",
        description: "Nos événements spéciaux et mariages",
        order: 1,
      },
    }),
    prisma.blogCategory.upsert({
      where: { slug: "conseils" },
      update: {},
      create: {
        name: "Conseils",
        slug: "conseils",
        description: "Conseils pour votre séjour",
        order: 2,
      },
    }),
    prisma.blogCategory.upsert({
      where: { slug: "actualites" },
      update: {},
      create: {
        name: "Actualités",
        slug: "actualites",
        description: "Nouvelles de l'hôtel",
        order: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create blog posts
  const posts = await Promise.all([
    prisma.blogPost.upsert({
      where: { slug: "evenement-mariage-bord-de-mer" },
      update: {},
      create: {
        slug: "evenement-mariage-bord-de-mer",
        title: "Organisez votre mariage au bord de la mer",
        excerpt: "Découvrez comment l'Hôtel Nahoui peut rendre votre jour de mariage inoubliable avec nos services personnalisés et notre cadre exceptionnel.",
        content: `
          <h2>Un cadre exceptionnel pour votre jour J</h2>
          <p>L'Hôtel Nahoui offre le décor parfait pour votre mariage. Situé au bord de la mer, notre établissement vous propose une vue imprenable sur l'océan et un cadre romantique inégalé.</p>
          
          <h2>Nos services personnalisés</h2>
          <p>Notre équipe expérimentée s'occupe de tous les détails de votre mariage :</p>
          <ul>
            <li>Organisation de la cérémonie sur la plage</li>
            <li>Réception dans notre salle de fête</li>
            <li>Catering gastronomique</li>
            <li>Décoration personnalisée</li>
            <li>Photographie et vidéographie</li>
            <li>Hébergement pour les invités</li>
          </ul>
          
          <h2>Forfaits mariage</h2>
          <p>Nous proposons plusieurs forfaits adaptés à vos besoins et à votre budget. Contactez-nous pour un devis personnalisé.</p>
          
          <h2>Contactez-nous</h2>
          <p>Pour planifier votre mariage à l'Hôtel Nahoui, contactez notre équipe au +33 1 23 45 67 89 ou par email à mariage@hotelnahoui.com</p>
        `,
        coverImage: "https://hotelnahoui.net/wp-content/uploads/2024/06/piscine-1.jpg",
        isPublished: true,
        isFeatured: true,
        publishedAt: new Date("2024-06-01"),
        categoryId: categories[0].id,
        authorId: author.id,
        order: 1,
      },
    }),
    prisma.blogPost.upsert({
      where: { slug: "conseils-reussir-sejour" },
      update: {},
      create: {
        slug: "conseils-reussir-sejour",
        title: "5 conseils pour réussir votre séjour",
        excerpt: "Découvrez nos astuces pour profiter au maximum de votre séjour à l'Hôtel Nahoui et dans la région.",
        content: `
          <h2>Préparez votre voyage</h2>
          <p>Avant votre arrivée, renseignez-vous sur les activités disponibles dans la région et réservez vos excursions à l'avance.</p>
          
          <h2>Profitez de nos installations</h2>
          <p>Notre hôtel dispose d'une piscine, d'un spa et d'un restaurant. Prenez le temps de profiter de ces installations pendant votre séjour.</p>
          
          <h2>Découvrez la région</h2>
          <p>La région regorge de trésors : plages, sentiers de randonnée, villages pittoresques. N'hésitez pas à explorer les environs.</p>
          
          <h2>Goûtez à la cuisine locale</h2>
          <p>Notre restaurant vous propose des spécialités locales. Laissez-vous tenter par nos plats traditionnels.</p>
          
          <h2>Détendez-vous</h2>
          <p>Profitez de notre spa pour vous détendre et vous ressourcer. Nos professionnels vous proposent divers soins.</p>
        `,
        coverImage: "https://hotelnahoui.net/wp-content/uploads/2024/06/dest-1.jpg",
        isPublished: true,
        isFeatured: false,
        publishedAt: new Date("2024-05-15"),
        categoryId: categories[1].id,
        authorId: author.id,
        order: 2,
      },
    }),
    prisma.blogPost.upsert({
      where: { slug: "nouveau-restaurant" },
      update: {},
      create: {
        slug: "nouveau-restaurant",
        title: "Ouverture de notre nouveau restaurant",
        excerpt: "Nous sommes ravis de vous annoncer l'ouverture de notre nouveau restaurant gastronomique avec vue sur mer.",
        content: `
          <h2>Une nouvelle expérience culinaire</h2>
          <p>L'Hôtel Nahoui est fier d'annoncer l'ouverture de son nouveau restaurant gastronomique. Situé en terrasse avec vue panoramique sur l'océan, notre restaurant vous propose une cuisine raffinée inspirée des produits locaux.</p>
          
          <h2>Notre chef</h2>
          <p>Notre chef, avec plus de 20 ans d'expérience, vous propose des créations originales mettant à l'honneur les produits de saison et les poissons frais pêchés localement.</p>
          
          <h2>La carte</h2>
          <p>Notre carte change régulièrement en fonction des produits disponibles. Vous y trouverez des plats créatifs et des classiques revisités.</p>
          
          <h2>Réservation</h2>
          <p>Pour réserver une table, contactez-nous au +33 1 23 45 67 89 ou directement à la réception de l'hôtel.</p>
        `,
        coverImage: "https://hotelnahoui.net/wp-content/uploads/2024/06/dest-2.jpg",
        isPublished: true,
        isFeatured: false,
        publishedAt: new Date("2024-04-20"),
        categoryId: categories[2].id,
        authorId: author.id,
        order: 3,
      },
    }),
    prisma.blogPost.upsert({
      where: { slug: "activites-ete" },
      update: {},
      create: {
        slug: "activites-ete",
        title: "Les activités à ne pas manquer cet été",
        excerpt: "Découvrez toutes les activités proposées par l'hôtel et dans la région pour un été inoubliable.",
        content: `
          <h2>Activités nautiques</h2>
          <p>Profitez de notre situation bord de mer pour pratiquer diverses activités nautiques : jet-ski, planche à voile, kayak, plongée...</p>
          
          <h2>Excursions</h2>
          <p>Nous organisons des excursions vers les sites touristiques de la région : visites de villages, sentiers de randonnée, parcs naturels.</p>
          
          <h2>Animation soirées</h2>
          <p>Chaque soir, notre équipe vous propose des animations : musique live, spectacles, soirées à thème.</p>
          
          <h2>Enfants</h2>
          <p>Notre club enfants accueille vos petits de 4 à 12 ans avec des activités adaptées à leur âge.</p>
        `,
        coverImage: "https://hotelnahoui.net/wp-content/uploads/2024/06/dest-3.jpg",
        isPublished: true,
        isFeatured: false,
        publishedAt: new Date("2024-06-10"),
        categoryId: categories[1].id,
        authorId: author.id,
        order: 4,
      },
    }),
  ]);

  console.log(`✅ Created ${posts.length} blog posts`);

  console.log("🎉 Blog seeding completed!");
}

seedBlog()
  .catch((e) => {
    console.error("❌ Error seeding blog:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
