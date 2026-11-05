const express = require("express");
const path = require("path"); 
const cors = require("cors");
require("dotenv").config();

const { createSupabaseClient } = require("./config/supabase");
const authRoutes = require("./routes/auth"); 
const todoRoutes = require("./routes/todos"); 


const app = express();


 //Configuración del servidor
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));   
app.use("/api/auth", authRoutes); 
app.use("/api/todos", todoRoutes); 


// Puerto
const PORT = process.env.PORT || 3000;

 

// Mostrar la aplicación principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html")); 
}); 
// Comprobar la conexión con Supabase
app.get("/api/conexion", async (req, res) => {
  try {
    const supabase = createSupabaseClient();

    const { error } = await supabase
      .from("todos")
      .select("id")
      .limit(1);

    if (error) {
      return res.status(500).json({
        message: "Error al consultar Supabase",
        error: error.message
      });
    }

    res.json({
      message: "Conexión con Supabase funcionando"
    });

  } catch (error) {
    res.status(500).json({
      message: "No se pudo conectar con Supabase",
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});