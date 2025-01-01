const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Création du client Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Test de connexion
async function testConnection() {
  try {
    const { data, error } = await supabase.from("discord").select("*").limit(1);

    if (error) throw error;
    console.log("\x1b[42m\x1b[1mSUCCESS\x1b[0m: Connected to Supabase");
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Supabase connection failed:",
      error
    );
    throw error;
  }
}

module.exports = {
  supabase,
  testConnection,
};
