const { createClient } = require("@supabase/supabase-js");

// Datos de conexión
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

// Comprobar que existan los datos
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan los datos de conexión con Supabase");
}

// Crear conexión con Supabase
function createSupabaseClient(accessToken) {
  return createClient(supabaseUrl, supabaseKey, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      : {},
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

module.exports = { createSupabaseClient };