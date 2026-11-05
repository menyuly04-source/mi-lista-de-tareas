const { createSupabaseClient } = require("../config/supabase");

async function verificarUsuario(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No se recibió un token válido"
      });
    }

    const token = authHeader.split(" ")[1];

    const supabase = createSupabaseClient();

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        message: "Supabase rechazó el token",
        error: error?.message || "Usuario no encontrado"
      });
    }

    req.user = data.user;
    req.supabase = createSupabaseClient(token);

    next();

  } catch (error) {
    res.status(500).json({
      message: "Error de autenticación",
      error: error.message
    });
  }
}

module.exports = verificarUsuario; 