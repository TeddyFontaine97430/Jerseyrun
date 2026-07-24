import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@jerseyrun.fr";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMoi123!";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPasswordHash,
      name: "Administrateur Jersey Run",
      role: "ADMIN",
    },
  });

  const demoClubs = [
    {
      name: "AS Rugby Club",
      slug: "as-rugby-club",
      email: "contact@as-rugby.fr",
      phone: "0600000001",
      description:
        "Club de rugby historique de la région, formé en 1952. Boutique officielle : maillots, survêtements et goodies.",
      logoUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=as-rugby&backgroundColor=1e3a8a",
      products: [
        { name: "Maillot domicile", priceCents: 6900, stock: 40, description: "Maillot officiel domicile, saison en cours." },
        { name: "Maillot extérieur", priceCents: 6900, stock: 35, description: "Maillot officiel extérieur, saison en cours." },
        { name: "Survêtement d'entraînement", priceCents: 5400, stock: 25, description: "Ensemble veste + pantalon, respirant." },
        { name: "Bonnet du club", priceCents: 1800, stock: 60, description: "Bonnet brodé aux couleurs du club." },
      ],
    },
    {
      name: "Basket Club Rive Gauche",
      slug: "basket-club-rive-gauche",
      email: "boutique@bcrg.fr",
      phone: "0600000002",
      description:
        "Club de basket amateur et formateur, plus de 300 licenciés. Retrouvez tous les équipements officiels.",
      logoUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=bcrg&backgroundColor=b91c1c",
      products: [
        { name: "Maillot réversible", priceCents: 4500, stock: 50, description: "Maillot réversible domicile/extérieur." },
        { name: "Short officiel", priceCents: 3200, stock: 45, description: "Short technique respirant." },
        { name: "Sac de sport", priceCents: 3900, stock: 20, description: "Sac de sport aux couleurs du club." },
      ],
    },
    {
      name: "Jersey Handball",
      slug: "jersey-handball",
      email: "contact@jersey-handball.fr",
      phone: "0600000003",
      description: "Club de handball dynamique, présent en championnat régional depuis 1998.",
      logoUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=handball&backgroundColor=15803d",
      products: [
        { name: "Maillot de match", priceCents: 5900, stock: 30, description: "Maillot officiel de match." },
        { name: "Coupe-vent", priceCents: 6500, stock: 22, description: "Coupe-vent léger, idéal avant-match." },
      ],
    },
  ];

  for (const club of demoClubs) {
    const passwordHash = await bcrypt.hash("Club1234!", 10);
    const owner = await prisma.user.upsert({
      where: { email: club.email },
      update: {},
      create: {
        email: club.email,
        password: passwordHash,
        name: club.name,
        role: "CLUB",
      },
    });

    const createdClub = await prisma.club.upsert({
      where: { slug: club.slug },
      update: {
        status: "APPROVED",
      },
      create: {
        name: club.name,
        slug: club.slug,
        phone: club.phone,
        email: club.email,
        description: club.description,
        logoUrl: club.logoUrl,
        status: "APPROVED",
        ownerId: owner.id,
      },
    });

    for (const product of club.products) {
      const existing = await prisma.product.findFirst({
        where: { clubId: createdClub.id, name: product.name },
      });
      if (!existing) {
        await prisma.product.create({
          data: {
            clubId: createdClub.id,
            name: product.name,
            description: product.description,
            priceCents: product.priceCents,
            stock: product.stock,
            imageUrl: `https://api.dicebear.com/9.x/icons/svg?seed=${encodeURIComponent(product.name)}`,
          },
        });
      }
    }
  }

  // Club en attente de validation, pour tester le workflow admin
  const pendingEmail = "contact@volley-etoile.fr";
  const pendingPasswordHash = await bcrypt.hash("Club1234!", 10);
  const pendingOwner = await prisma.user.upsert({
    where: { email: pendingEmail },
    update: {},
    create: {
      email: pendingEmail,
      password: pendingPasswordHash,
      name: "Volley Étoile",
      role: "CLUB",
    },
  });
  await prisma.club.upsert({
    where: { slug: "volley-etoile" },
    update: {},
    create: {
      name: "Volley Étoile",
      slug: "volley-etoile",
      phone: "0600000004",
      email: pendingEmail,
      description: "Nouveau club de volley-ball souhaitant rejoindre Jersey Run.",
      status: "PENDING",
      ownerId: pendingOwner.id,
    },
  });

  console.log("Seed terminé.");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log("Clubs de démo (mot de passe: Club1234!) :");
  for (const club of demoClubs) console.log(` - ${club.email}`);
  console.log(` - ${pendingEmail} (en attente de validation)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
