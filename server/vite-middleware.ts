import type { Express } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

export async function setupVite(app: Express) {
  const vite = await createViteServer({
    root: path.resolve(process.cwd(), "client"),
    server: {
      middlewareMode: true,
      hmr: { port: 5001 },
      headers: {
        "X-Frame-Options": "",
        "Content-Security-Policy": "frame-ancestors *",
      },
    },
    appType: "spa",
  });

  app.use(vite.middlewares);
}
