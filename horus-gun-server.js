// horus-gun-server.js - DUAL WEBSOCKET VERSION
// Save this single file and deploy to CloudFlare

// ==================== CLOUDFLARE WORKER CONFIG ====================
const GUN_JS_CODE = `
// Minimal Gun.js implementation for CloudFlare
class Gun {
  constructor(opts = {}) {
    this.peers = opts.peers || [];
    this.graph = {};
    this.souls = new Set();
  }

  get(path) {
    return new Node(this, path);
  }

  put(data, cb) {
    if (typeof data === 'object') {
      const soul = this._soul();
      this.graph[soul] = data;
      this.souls.add(soul);
      if (cb) cb(null, {ok: true});
      return {soul, data};
    }
    return null;
  }

  _soul() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

class Node {
  constructor(gun, path) {
    this.gun = gun;
    this.path = path;
  }

  put(data, cb) {
    return this.gun.put(data, cb);
  }

  once(cb) {
    const result = this.gun.graph[this.path] || null;
    if (cb) cb(result);
    return result;
  }

  on(cb) {
    const result = this.gun.graph[this.path] || null;
    if (cb) cb(result);
    return this;
  }
}
`;

// ==================== ADMIN DB DURABLE OBJECT ====================
export class HorusGunAdmin {
  constructor(state, env) {
    this.state = state;
    this.storage = state.storage;
    this.sockets = new Set();
    this.initGun();
  }

  async initGun() {
    const gunFn = new Function('opts', `${GUN_JS_CODE} return new Gun(opts);`);
    this.gun = gunFn({ peers: [] });
    await this.loadAdminData();
  }

  async loadAdminData() {
    const initialized = await this.storage.get('admin_initialized');
    if (initialized) return;

    // Admin-specific initial data
    this.gun.put({
      ui_texts: {
        "admin_title": "Horus Admin",
        "admin_registration_title": "Admin Registration",
        "admin_username_label": "Admin Username",
        "admin_password_label": "Admin Password",
        "register_button": "Register Admin",
        "login_title": "Sign In",
        "username_label": "Username",
        "password_label": "Password",
        "login_button": "Login",
        "welcome_admin": "Welcome, Admin",
        "logout_button": "Logout",
        "user_management_title": "User Management",
        "create_user_button": "Create User",
        "view_users_button": "View Users"
      },
      version: "1.0.0"
    });

    await this.storage.put('admin_initialized', true);
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader === 'websocket') {
      return this.handleWebSocket(request);
    }
    return new Response('Admin Gun server running', { status: 200 });
  }

  async handleWebSocket(request) {
    try {
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);
      
      this.sockets.add(server);
      server.accept();
      
      server.addEventListener('message', (event) => {
        this.handleGunMessage(event.data, server);
      });

      server.addEventListener('close', () => {
        this.sockets.delete(server);
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    } catch (error) {
      return new Response('WebSocket upgrade failed', { status: 500 });
    }
  }

  async handleGunMessage(data, socket) {
    try {
      const message = JSON.parse(data);
      
      if (message.put) {
        const result = this.gun.put(message.put);
        this.broadcast({ put: { [result.soul]: result.data } });
      }
      
      if (message.get) {
        const result = this.gun.get(message.get['#']).once();
        socket.send(JSON.stringify({ get: { [message.get['#']]: result } }));
      }
      
    } catch (error) {
      console.error('Admin Gun message error:', error);
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    for (const socket of this.sockets) {
      try {
        if (socket.readyState === 1) {
          socket.send(messageStr);
        }
      } catch (error) {
        this.sockets.delete(socket);
      }
    }
  }
}

// ==================== PLATFORM DB DURABLE OBJECT ====================
export class HorusGunPlatform {
  constructor(state, env) {
    this.state = state;
    this.storage = state.storage;
    this.sockets = new Set();
    this.initGun();
  }

  async initGun() {
    const gunFn = new Function('opts', `${GUN_JS_CODE} return new Gun(opts);`);
    this.gun = gunFn({ peers: [] });
    await this.loadPlatformData();
  }

  async loadPlatformData() {
    const initialized = await this.storage.get('platform_initialized');
    if (initialized) return;

    // Platform-specific initial data
    this.gun.put({
      content: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Horus Platform</title></head><body>Platform content</body></html>`,
      version: "1.0.0"
    });

    await this.storage.put('platform_initialized', true);
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader === 'websocket') {
      return this.handleWebSocket(request);
    }
    return new Response('Platform Gun server running', { status: 200 });
  }

  async handleWebSocket(request) {
    try {
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);
      
      this.sockets.add(server);
      server.accept();
      
      server.addEventListener('message', (event) => {
        this.handleGunMessage(event.data, server);
      });

      server.addEventListener('close', () => {
        this.sockets.delete(server);
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    } catch (error) {
      return new Response('WebSocket upgrade failed', { status: 500 });
    }
  }

  async handleGunMessage(data, socket) {
    try {
      const message = JSON.parse(data);
      
      if (message.put) {
        const result = this.gun.put(message.put);
        this.broadcast({ put: { [result.soul]: result.data } });
      }
      
      if (message.get) {
        const result = this.gun.get(message.get['#']).once();
        socket.send(JSON.stringify({ get: { [message.get['#']]: result } }));
      }
      
    } catch (error) {
      console.error('Platform Gun message error:', error);
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    for (const socket of this.sockets) {
      try {
        if (socket.readyState === 1) {
          socket.send(messageStr);
        }
      } catch (error) {
        this.sockets.delete(socket);
      }
    }
  }
}

// ==================== WORKER ENTRY POINT ====================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Admin DB endpoint - /gun-admin
    if (url.pathname === '/gun-admin' || url.pathname.startsWith('/gun-admin/')) {
      try {
        const id = env.HORUS_GUN_ADMIN.idFromName('admin-main');
        const stub = env.HORUS_GUN_ADMIN.get(id);
        return stub.fetch(request);
      } catch (error) {
        return new Response('Admin Durable Object error: ' + error.message, { status: 500 });
      }
    }
    
    // Platform DB endpoint - /gun-platform  
    if (url.pathname === '/gun-platform' || url.pathname.startsWith('/gun-platform/')) {
      try {
        const id = env.HORUS_GUN_PLATFORM.idFromName('platform-main');
        const stub = env.HORUS_GUN_PLATFORM.get(id);
        return stub.fetch(request);
      } catch (error) {
        return new Response('Platform Durable Object error: ' + error.message, { status: 500 });
      }
    }
    
    return new Response('Horus Gun Server - Connect via /gun-admin or /gun-platform WebSocket', { status: 200 });
  }
}