import WebSocket, { WebSocketServer } from "ws";
import { verifyAccessToken } from "./generate_tokens.js";
import Notification from "../Models/notification.js";
import User from "../Models/user.js";

let wss = null;
const roleSockets = new Map(); // role -> Set(ws)
const userSockets = new Map(); // userId -> Set(ws)

export function initWebSocket(server) {
  if (wss) return wss;
  wss = new WebSocketServer({ server, path: "/ws" });

  function registerSocketForRole(ws, role) {
    if (!role) return;
    const set = roleSockets.get(role) || new Set();
    set.add(ws);
    roleSockets.set(role, set);
  }

  function unregisterSocket(ws) {
    // remove from role maps
    for (const [role, set] of roleSockets.entries()) {
      if (set.has(ws)) set.delete(ws);
      if (set.size === 0) roleSockets.delete(role);
    }
    for (const [uid, set] of userSockets.entries()) {
      if (set.has(ws)) set.delete(ws);
      if (set.size === 0) userSockets.delete(uid);
    }
  }

  wss.on("connection", (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));
    // Try to authenticate via token in query string: /ws?token=xxx
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");
      if (token) {
        try {
          const payload = verifyAccessToken(token);
          if (payload) {
            // register by role and user id
            if (payload.role) registerSocketForRole(ws, payload.role);
            const uid = payload.id || payload.user_id || payload.userId;
            if (uid) {
              const set = userSockets.get(uid) || new Set();
              set.add(ws);
              userSockets.set(uid, set);
            }
            ws.auth = payload;
            safeSend(ws, { type: "ack", message: "authenticated" });
          }
        } catch (e) {
          // invalid token -> close connection
          ws.close(4001, "Unauthorized");
          return;
        }
      }
    } catch (e) {
      // ignore URL parsing errors
    }

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        // fallback authentication via message: { type: 'auth', token: '...' }
        if (msg.type === "auth" && msg.token) {
          try {
            const payload = verifyAccessToken(msg.token);
            if (payload) {
              if (payload.role) registerSocketForRole(ws, payload.role);
              const uid = payload.id || payload.user_id || payload.userId;
              if (uid) {
                const set = userSockets.get(uid) || new Set();
                set.add(ws);
                userSockets.set(uid, set);
              }
              ws.auth = payload;
              safeSend(ws, { type: "ack", message: "authenticated" });
            }
          } catch (e) {
            ws.close(4001, "Unauthorized");
          }
        }
      } catch (e) {
        // ignore invalid messages
      }
    });

    ws.on("close", () => unregisterSocket(ws));
    ws.on("error", () => unregisterSocket(ws));
  });

  // heartbeat
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping(() => {});
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  return wss;
}

function safeSend(ws, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch (e) {
    // ignore
  }
}

async function persistNotificationsForUserIds(userIds = [], payload = {}) {
  if (!Array.isArray(userIds)) userIds = [userIds];
  if (!userIds.length) return;
  try {
    const records = userIds.map((uid) => ({
      user_id: uid,
      title: payload.title || (payload.message ? String(payload.message).slice(0, 80) : "Notification"),
      message: payload.message ? String(payload.message) : JSON.stringify(payload),
      data: payload.data || null,
      created_by: payload.actorId || payload.created_by || null,
    }));
    await Notification.bulkCreate(records);
  } catch (e) {
    // non-fatal, keep going
    console.error("Failed to persist notifications:", e.message || e);
  }
}

export async function notifyRoles(roles = [], payload = {}) {
  if (!Array.isArray(roles)) roles = [roles];
  try {
    // gather user ids for roles and persist notifications before sending
    const userIds = new Set();
    for (const role of roles) {
      const set = roleSockets.get(role);
      if (set) {
        for (const ws of set) {
          safeSend(ws, { type: "notification", ...payload });
        }
      }
      try {
        const users = await User.findAll({ where: { role, is_deleted: false }, attributes: ["user_id"] });
        for (const u of users) userIds.add(u.user_id);
      } catch (e) {
        // ignore DB failures for role lookup
        console.error("Failed to lookup users for role", role, e.message || e);
      }
    }
    if (userIds.size) await persistNotificationsForUserIds(Array.from(userIds), payload);
  } catch (e) {
    console.error("notifyRoles error:", e.message || e);
  }
}

export async function notifyUsers(userIds = [], payload = {}) {
  if (!Array.isArray(userIds)) userIds = [userIds];
  try {
    for (const uid of userIds) {
      const set = userSockets.get(uid);
      if (set) {
        for (const ws of set) safeSend(ws, { type: "notification", ...payload });
      }
    }
    // persist
    await persistNotificationsForUserIds(userIds, payload);
  } catch (e) {
    console.error("notifyUsers error:", e.message || e);
  }
}

export default {
  initWebSocket,
  notifyRoles,
  notifyUsers,
};
