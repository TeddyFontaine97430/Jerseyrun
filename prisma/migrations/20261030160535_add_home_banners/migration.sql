-- CreateTable
CREATE TABLE "HomeBanner" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeBanner_pkey" PRIMARY KEY ("id")
);

-- Reprise de la bannière actuelle (réglée jusqu'ici dans "Contenu du site") comme première
-- bannière, avec ses valeurs enregistrées ou, à défaut, ses valeurs par défaut.
INSERT INTO "HomeBanner" ("id", "imageUrl", "link", "position")
VALUES (
    'banner_initial',
    COALESCE(
        (SELECT "value" FROM "SiteContent" WHERE "key" = 'home.bannerImage'),
        'https://hlgj7olfcqzaeggk.public.blob.vercel-storage.com/site/banner-js-saint-pierroise-q1S8i1gAxEsFwzEfl7DqpO3K7BjXkS.jpg'
    ),
    COALESCE(
        (SELECT "value" FROM "SiteContent" WHERE "key" = 'home.bannerLink'),
        '/clubs/jeunesse-sportive-saint-pierroise'
    ),
    0
);
