import { db } from "./src/db/index.ts";
import { products } from "./src/db/schema.ts";

async function testDb() {
  try {
    console.log("Attempting to fetch products...");
    const allProducts = await db.select().from(products);
    console.log("Success! Products count:", allProducts.length);
  } catch (err) {
    console.error("Database error:", err);
  }
}

testDb();
