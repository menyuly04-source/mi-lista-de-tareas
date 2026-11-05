const express = require("express");
const router = express.Router();

const { createSupabaseClient } = require("../config/supabase");

// REGISTRO DE USUARIOS
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        message: "Completá todos los campos"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    const supabase = createSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    res.status(201).json({
      message: "Registro realizado correctamente",
      user: data.user,
      session: data.session
    });

  } catch (error) {
    res.status(500).json({
      message: "Error al registrar usuario",
      error: error.message
    });
  }
});

// INICIO DE SESIÓN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Ingresá tu correo y contraseña"
      });
    }

    const supabase = createSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        message: error.message
      });
    }

    res.json({
      message: "Inicio de sesión exitoso",
      user: data.user,
      session: data.session
    });

  } catch (error) {
    res.status(500).json({
      message: "Error al iniciar sesión",
      error: error.message
    });
  }
});

module.exports = router;
