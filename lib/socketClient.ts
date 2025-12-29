import { io, Socket } from "socket.io-client";

// Avoid connecting from the server/SSR where xhr-poll will always fail.
const isBrowser = typeof window !== "undefined";

// Provide a tiny no-op stub when not in the browser to prevent SSR logs.
const noopSocket: Pick<Socket, "on" | "off" | "emit" | "connected" | "connect" | "disconnect"> = {
  on: () => noopSocket,
  off: () => noopSocket,
  emit: () => false,
  connect: () => noopSocket as any,
  disconnect: () => noopSocket as any,
  connected: false,
};

const socket = isBrowser
  ? io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, {
    path: "/api/socket",
    // Start with polling so the Next API route can spin up before upgrading.
    transports: ["polling", "websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 800,
    timeout: 10000,
    withCredentials: true,
  })
  : (noopSocket as Socket);

if (isBrowser) {
  socket.on("connect_error", (err) => {
    console.warn("socket-client:connect_error", err?.message);
  });

  socket.on("error", (err) => {
    console.warn("socket-client:error", err);
  });
}

export default socket;
