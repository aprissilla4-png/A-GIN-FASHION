import { db } from './src/db/index.ts';
import { media, banners } from './src/db/schema.ts';
async function test() {
  console.log("Media:", await db.select().from(media));
  console.log("Banners:", await db.select().from(banners));
}
test().catch(console.error).finally(() => process.exit(0));
