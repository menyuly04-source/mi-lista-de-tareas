const express = require("express");
const router = express.Router();

const verificarUsuario = require("../middleware/auth");

// PROTEGER TODAS LAS RUTAS
router.use(verificarUsuario);

// 1. MOSTRAR TODAS LAS TAREAS
router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("todos")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las tareas",
      error: error.message
    });
  }
});

// 2. CREAR UNA TAREA
router.post("/", async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "El título es obligatorio"
      });
    }

    const { data, error } = await req.supabase
      .from("todos")
      .insert({
        title: title.trim(),
        description: description || null,
        priority: priority || "medium",
        user_id: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Tarea creada correctamente",
      todo: data
    });

  } catch (error) {
    res.status(500).json({
      message: "Error al crear la tarea",
      error: error.message
    });
  }
});

// 3. MODIFICAR UNA TAREA
router.patch("/:id", async (req, res) => {
  try {
    const { title, description, is_completed, priority } = req.body;

    const cambios = {};

    if (title !== undefined) cambios.title = title.trim();
    if (description !== undefined) cambios.description = description;
    if (is_completed !== undefined) cambios.is_completed = is_completed;
    if (priority !== undefined) cambios.priority = priority;

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({
        message: "No hay cambios para realizar"
      });
    }

    cambios.updated_at = new Date().toISOString();

    const { data, error } = await req.supabase
      .from("todos")
      .update(cambios)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        message: "Tarea no encontrada"
      });
    }

    res.json({
      message: "Tarea actualizada correctamente",
      todo: data
    });

  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar la tarea",
      error: error.message
    });
  }
});

// 4. ELIMINAR UNA TAREA
router.delete("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("todos")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        message: "Tarea no encontrada"
      });
    }

    res.json({
      message: "Tarea eliminada correctamente"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar la tarea",
      error: error.message
    });
  }
});

module.exports = router; 
