const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// WIP

const supabaseUrl = "https://thsdyclkzguvethyngrm.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// module.exports = supabaseconnect;
