import { adminDb } from "./src/lib/firebase-admin.ts";

async function testFirestore() {
  try {
    console.log("Attempting to fetch products from firestore...");
    const productsSnapshot = await adminDb.collection("products").get();
    console.log("Success! Products count:", productsSnapshot.size);
  } catch (err) {
    console.error("Firestore error:", err);
  }
}

testFirestore();
