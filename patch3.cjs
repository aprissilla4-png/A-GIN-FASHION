const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Also add to db.json media gallery so it instantly appears there!([\s\S]*?)res\.json\(\{ url: fileUrl, media: newMedia \}\);/g;
const replacement = `// Also add to Drizzle media gallery so it instantly appears there!
      const [newMedia] = await db.insert(media).values({
        id: "med-" + Date.now(),
        type: isVideo ? "video" : "image",
        url: fileUrl,
        title: name || filename,
        description: ""
      }).returning();
      res.json({ url: fileUrl, media: newMedia });`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
