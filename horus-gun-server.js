// horus-gun-server.js - COMPLETE, SELF-CONTAINED
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

// ==================== DURABLE OBJECT CLASS ====================
export class HorusGunServer {
  constructor(state, env) {
    this.state = state;
    this.storage = state.storage;
    this.sockets = new Set();
    this.initGun();
  }

  async initGun() {
    // Initialize Gun.js in CloudFlare environment
    const gunFn = new Function('opts', `${GUN_JS_CODE} return new Gun(opts);`);
    this.gun = gunFn({ peers: [] });
    
    // Load initial data
    await this.loadInitialData();
  }

  async loadInitialData() {
    // Check if already initialized
    const initialized = await this.storage.get('initialized');
    if (initialized) return;

    // Pre-populate admin data
    this.gun.put({
      content: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title data-lang="admin_title">Horus Admin</title><style>body{font-family:'Segoe UI',sans-serif;background:#2c3e50;color:white;padding:20px}.header{text-align:center;margin-bottom:30px}.logo{font-size:48px;color:#FFD700}.section{background:rgba(255,255,255,0.1);padding:20px;border-radius:10px;margin:20px 0}.button{background:#ccffcc;color:#2c3e50;padding:10px 20px;border:none;border-radius:5px;margin:5px}</style></head><body><div class="header"><div class="logo">&#x13080;</div><h1 data-lang="welcome_admin"></h1></div><div class="section"><h2 data-lang="user_management_title"></h2><button data-lang="create_user_button" class="button"></button><button data-lang="view_users_button" class="button"></button></div><div class="section"><h2 data-lang="db_admin_title"></h2><button data-lang="search_button" class="button"></button><button data-lang="write_button" class="button"></button></div><div class="section"><h2 data-lang="translation_interface_title"></h2><button data-lang="view_translator_button" class="button"></button></div><script>function loadLanguagePack(){try{const e=JSON.parse(localStorage.getItem("lang_en"));e&&e.ui_texts&&Object.keys(e.ui_texts).forEach(t=>{document.querySelectorAll('[data-lang="'+t+'"]').forEach(e=>{e.textContent=e.ui_texts[t]})})}catch(e){console.log("Language pack not loaded yet")}}loadLanguagePack();</script></body></html>`,
      version: "1.0.0"
    });

    this.gun.put({
      ui_texts: {
        "admin_title": "Horus Admin",
        "admin_registration_title": "Admin Registration",
        "admin_username_label": "Admin Username",
        "admin_username_placeholder": "Choose username",
        "admin_password_label": "Admin Password",
        "admin_password_placeholder": "Choose password",
        "register_button": "Register Admin",
        "registration_info": "One-time registration: This setup will be disabled after first admin is created.",
        "login_title": "Sign In",
        "username_label": "Username",
        "username_placeholder": "Username",
        "password_label": "Password",
        "password_placeholder": "Password",
        "login_button": "Login",
        "welcome_admin": "Welcome, Admin",
        "view_translator_button": "View Translator",
        "logout_button": "Logout",
        "user_management_title": "User Management",
        "create_user_title": "Create New User",
        "new_username_label": "Username",
        "new_username_placeholder": "Username",
        "new_password_label": "Password",
        "new_password_placeholder": "Password",
        "user_role_label": "User Role",
        "role_translator": "Translator",
        "role_developer": "Developer",
        "role_admin": "Admin",
        "create_user_button": "Create User",
        "existing_users_title": "Existing Users",
        "table_username": "Username",
        "table_role": "Role",
        "table_actions": "Actions",
        "db_admin_title": "Database Administration",
        "search_tab": "Search",
        "write_tab": "Write",
        "structure_tab": "DB Structure",
        "search_path_label": "Node Path",
        "search_path_placeholder": "node/path",
        "search_button": "Search",
        "search_results_default": "Results will appear here...",
        "write_path_label": "Node Path",
        "write_path_placeholder": "node/path",
        "write_data_label": "Data (JSON)",
        "write_data_placeholder": "{\"key\": \"value\"}",
        "write_button": "Write Data",
        "refresh_button": "Refresh Structure",
        "structure_loading": "DB structure will appear here...",
        "languages_title": "Available Languages",
        "export_csv_button": "Export as CSV",
        "view_text_button": "View as Text",
        "languages_loading": "Languages will be loaded here...",
        "welcome_translator": "Welcome, Translator",
        "back_to_admin_button": "Back to Admin",
        "translation_interface_title": "Translation Interface",
        "flag_label": "Flag",
        "flag_placeholder": "🏳️",
        "lang_id_label": "Lang ID",
        "lang_id_placeholder": "en",
        "lang_name_label": "Native Name",
        "lang_name_placeholder": "Language name",
        "continent_label": "Continent",
        "continent_default": "Continent",
        "continent_africa": "Africa",
        "continent_asia": "Asia",
        "continent_europe": "Europe",
        "continent_north_america": "N America",
        "continent_south_america": "S America",
        "continent_oceania": "Oceania",
        "source_tab": "Source Text",
        "translation_tab": "Translation",
        "source_text_label": "Source Text",
        "copy_source_button": "Copy Source",
        "export_languages_button": "Export Languages",
        "translation_label": "Translation",
        "translation_placeholder": "Enter translation here...",
        "save_button": "Save",
        "clear_button": "Clear"
      },
      version: "1.0.0"
    });

    await this.storage.put('initialized', true);
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader === 'websocket') {
      return this.handleWebSocket(request);
    }
    return new Response('Gun server running - use WebSocket connection', { status: 200 });
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
      console.error('Gun message error:', error);
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
    
    if (url.pathname === '/gun' || url.pathname.startsWith('/gun/')) {
      try {
        const id = env.HORUS_GUN_SERVER.idFromName('main');
        const stub = env.HORUS_GUN_SERVER.get(id);
        return stub.fetch(request);
      } catch (error) {
        return new Response('Durable Object error: ' + error.message, { status: 500 });
      }
    }
    
    return new Response('Horus Gun Server - Connect via /gun WebSocket', { status: 200 });
  }
}