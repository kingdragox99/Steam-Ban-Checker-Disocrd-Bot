const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Configuration optimisée de Supabase
const SUPABASE_CONFIG = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    enabled: false,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: { "x-application-name": "steam-ban-tracker" },
  },
};

// Paramètres de retry
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
};

class SupabaseManager {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error("Missing Supabase credentials in environment variables");
    }

    this.client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      SUPABASE_CONFIG
    );

    this.isConnected = false;
  }

  // Fonction utilitaire pour le retry avec backoff exponentiel
  async #retryOperation(operation, customConfig = {}) {
    const config = { ...RETRY_CONFIG, ...customConfig };
    let lastError;

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error;
        if (attempt === config.maxAttempts - 1) break;

        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        );

        console.log(
          `\x1b[43m\x1b[1mRETRY\x1b[0m: Database operation failed, attempt ${
            attempt + 1
          }/${config.maxAttempts}, retrying in ${delay}ms`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Test de connexion
  async testConnection() {
    try {
      const { error } = await this.#retryOperation(() =>
        this.client.from("profil").select("id").limit(1)
      );

      if (error) throw error;

      this.isConnected = true;
      console.log(
        "\x1b[42m\x1b[1mSUCCESS\x1b[0m: Connected to Supabase database"
      );

      return true;
    } catch (error) {
      this.isConnected = false;
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to connect to Supabase:",
        error
      );
      throw error;
    }
  }

  // Fonction générique pour les opérations de base de données avec retry
  async query(operation) {
    if (!this.isConnected) {
      await this.testConnection();
    }

    return this.#retryOperation(operation);
  }

  // Méthodes utilitaires courantes
  async insert(table, data) {
    return this.query(() => this.client.from(table).insert(data));
  }

  async select(table, query = "*", options = {}) {
    let request = this.client.from(table).select(query);

    if (options.where) {
      for (const [column, value] of Object.entries(options.where)) {
        request = request.eq(column, value);
      }
    }

    if (options.limit) {
      request = request.limit(options.limit);
    }

    return this.query(() => request);
  }

  async update(table, data, where) {
    return this.query(() =>
      this.client
        .from(table)
        .update(data)
        .eq(Object.keys(where)[0], Object.values(where)[0])
    );
  }

  // Getter pour accéder au client Supabase directement si nécessaire
  get supabase() {
    return this.client;
  }
}

// Export d'une instance unique
module.exports = new SupabaseManager();
