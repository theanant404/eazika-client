import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "./types";
import { Server as IOServer } from "socket.io";
import redis from "@/lib/redis";

const hasRedis = Boolean(process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket) {
    // console.error("socket-server:no-res-socket", { method: req.method, url: req.url });
    return res.status(500).json({ error: "Socket unavailable" });
  }

  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
      // console.info("socket-server:connected", { socketId: socket.id });
      socket.on("disconnect", (reason) => {
        // console.info("socket-server:disconnected", { socketId: socket.id, reason });
      });
      socket.on("error", (err) => {
        // console.warn("socket-server:error", err);
      });

      socket.on("join-order", (orderId: string | number) => {
        if (!orderId) return;
        socket.join(`order-${orderId}`);
      });

      socket.on("leave-order", (orderId: string | number) => {
        if (!orderId) return;
        socket.leave(`order-${orderId}`);
      });

      socket.on(
        "rider-location",
        async (payload: { orderId: string | number; location: { lat: number; lng: number } }) => {
          if (!payload?.orderId || !payload?.location) return;
          const room = `order-${payload.orderId}`;
          const snapshot = {
            orderId: payload.orderId,
            location: payload.location,
            at: Date.now(),
          };

          if (hasRedis) {
            try {
              await redis.set(`order:${payload.orderId}:location`, JSON.stringify(snapshot), "EX", 900);
            } catch (e) {
              // console.warn("Failed to persist location to redis", e);
            }
          }

          io.to(room).emit("order-location", snapshot);
        }
      );
    });

    res.socket.server.io = io;
  }

  res.end();
}
