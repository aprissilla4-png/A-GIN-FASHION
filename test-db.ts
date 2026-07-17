import { db } from './src/db';
import { banners } from './src/db/schema';

async function test() {
  const bannerData = {
    id: "slide-test",
    image: "image",
    title: "title",
    subtitle: "",
    description: null,
    url: null,
    badge: "badge",
    bgColor: "bg"
  };
  try {
    await db.insert(banners).values(bannerData);
    console.log("Success");
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
