import fs from 'fs';
import path from 'path';
import { db } from './index.ts';
import { users, products, banners, settings, media } from './schema.ts';
import { eq } from 'drizzle-orm';

const DB_FILE = path.join(process.cwd(), 'db.json');

async function migrate() {
  if (!fs.existsSync(DB_FILE)) {
    console.log('No db.json found, skipping migration.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

  console.log('Migrating users...');
  for (const user of data.users) {
    await db.insert(users).values({
      uid: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      avatarUrl: user.avatarUrl,
    }).onConflictDoNothing();
  }

  console.log('Migrating products...');
  for (const product of data.products) {
    await db.insert(products).values({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString(),
      image: product.image,
      category: product.category,
      stock: product.stock,
      description: product.description,
      rating: (product.rating || 5.0).toString(),
      salesCount: product.salesCount || 0,
      isFlashSale: !!product.isFlashSale,
      isPromo: !!product.isPromo,
    }).onConflictDoNothing();
  }

  console.log('Migrating banners...');
  if (data.banners) {
    for (const banner of data.banners) {
      await db.insert(banners).values({
        id: banner.id,
        image: banner.image,
        url: banner.url,
        title: banner.title,
        subtitle: banner.subtitle,
        badge: banner.badge,
        bgColor: banner.bgColor,
        description: banner.description,
      }).onConflictDoNothing();
    }
  }

  console.log('Migrating settings...');
  if (data.logoSettings) {
    await db.insert(settings).values({
      key: 'logoSettings',
      value: JSON.stringify(data.logoSettings),
    }).onConflictDoNothing();
  }
  if (data.dtfSettings) {
    await db.insert(settings).values({
      key: 'dtfSettings',
      value: JSON.stringify(data.dtfSettings),
    }).onConflictDoNothing();
  }

  console.log('Migrating media...');
  if (data.homeMedia) {
    for (const item of data.homeMedia) {
      await db.insert(media).values({
        id: item.id,
        type: item.type,
        url: item.url,
        title: item.title,
        description: item.description,
      }).onConflictDoNothing();
    }
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
