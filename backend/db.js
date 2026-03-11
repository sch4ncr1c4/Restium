const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config({ quiet: true });

const disableDbSsl = String(process.env.DB_SSL || "").toLowerCase() === "false";

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      // Supabase pooler requires TLS; keep cert validation relaxed for hosted environments.
      ssl: disableDbSsl ? false : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "sistema_gastronomico",
    };

const pool = new Pool(poolConfig);

module.exports = {
  pool,
};
