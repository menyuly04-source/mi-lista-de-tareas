
const API = "";

const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const authMessage = document.getElementById("auth-message");
const taskMessage = document.getElementById("task-message");
const taskList = document.getElementById("task-list");

let token = sessionStorage.getItem("access_token");
let filtroActual = "all";
let todasLasTareas = []; 

// CAMBIAR ENTRE INICIO DE SESIÓN Y REGISTRO

document.getElementById("show-register").addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.classList.add("oculto");
  registerForm.classList.remove("oculto");
  authMessage.textContent = "";
});

document.getElementById("show-login").addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.classList.add("oculto");
  loginForm.classList.remove("oculto");
  authMessage.textContent = "";
});


// REGISTRAR USUARIO

document.getElementById("register-button").addEventListener("click", async () => {
  const fullName = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;

  authMessage.textContent = "Registrando...";

  try {
    const response = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fullName, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudo registrar");
    }

    authMessage.textContent =
      "Registro realizado. Revisá tu correo para confirmar la cuenta y después iniciá sesión.";

    registerForm.classList.add("oculto");
    loginForm.classList.remove("oculto");

  } catch (error) {
    authMessage.textContent = error.message;
  }
});


// INICIAR SESIÓN

document.getElementById("login-button").addEventListener("click", iniciarSesion);

async function iniciarSesion() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  authMessage.textContent = "Ingresando...";

  try {
    const response = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudo iniciar sesión");
    }

    if (!data.session?.access_token) {
      throw new Error("Revisá tu correo y confirmá tu cuenta antes de ingresar.");
    }

    token = data.session.access_token;
    sessionStorage.setItem("access_token", token);
    sessionStorage.setItem("user_email", email);

    mostrarAplicacion();
    await cargarTareas();

  } catch (error) {
    authMessage.textContent = error.message;
  }
}


// MOSTRAR LA APLICACIÓN

function mostrarAplicacion() {
  authSection.classList.add("oculto");
  appSection.classList.remove("oculto");

  const correo = sessionStorage.getItem("user_email");
  const perfilEmail = document.getElementById("perfil-email");

  if (perfilEmail) {
    perfilEmail.textContent = correo || "Correo no disponible";
  }

  cambiarPagina("inicio");
}
// CERRAR SESIÓN

document.getElementById("logout-button").addEventListener("click", () => {
  sessionStorage.removeItem("access_token");
  token = null;

  appSection.classList.add("oculto");
  authSection.classList.remove("oculto");

  taskList.replaceChildren();
  authMessage.textContent = "";
  taskMessage.textContent = "";
});


 // MOSTRAR TAREAS SEGÚN EL FILTRO

function mostrarTareasFiltradas() {
  taskList.replaceChildren();

  let tareasFiltradas = todasLasTareas;

  if (filtroActual === "pending") {
    tareasFiltradas = todasLasTareas.filter(
      (todo) => !todo.is_completed
    );
  }

  if (filtroActual === "completed") {
    tareasFiltradas = todasLasTareas.filter(
      (todo) => todo.is_completed
    );
  }

  if (tareasFiltradas.length === 0) {
    taskMessage.textContent = "No hay tareas en esta categoría.";
    return;
  }

  taskMessage.textContent = "";

  tareasFiltradas.forEach((todo) => {
    mostrarTarea(todo);
  });
}


// BOTONES DE FILTROS

document.getElementById("filter-all").addEventListener("click", () => {
  filtroActual = "all";
  mostrarTareasFiltradas();
});

document.getElementById("filter-pending").addEventListener("click", () => {
  filtroActual = "pending";
  mostrarTareasFiltradas();
});

document.getElementById("filter-completed").addEventListener("click", () => {
  filtroActual = "completed";
  mostrarTareasFiltradas();
});

// CARGAR TAREAS

async function cargarTareas() {
  taskMessage.textContent = "Cargando tareas...";

  try {
    const response = await fetch(`${API}/api/todos`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudieron cargar las tareas");
    }

    taskList.replaceChildren();
todasLasTareas = data;

actualizarResumen();
mostrarTareasFiltradas();  

   if (data.length === 0) {
  taskMessage.textContent = "Todavía no tenés tareas. ¡Agregá la primera!";
  return;
}

taskMessage.textContent = "";
mostrarTareasFiltradas(); 

  } catch (error) {
    taskMessage.textContent = error.message;
  }
}


// ACTUALIZAR RESUMEN DEL INICIO

function actualizarResumen() {
  const total = todasLasTareas.length;

  const pendientes = todasLasTareas.filter(
    tarea => !tarea.is_completed
  ).length;

  const terminadas = todasLasTareas.filter(
    tarea => tarea.is_completed
  ).length;

  // Actualizar resumen del inicio
  document.getElementById("total-tareas").textContent = total;
  document.getElementById("total-pendientes").textContent = pendientes;
  document.getElementById("total-terminadas").textContent = terminadas;

  // Actualizar estadísticas
  document.getElementById("estadistica-total").textContent = total;
  document.getElementById("estadistica-pendientes").textContent = pendientes;
  document.getElementById("estadistica-terminadas").textContent = terminadas;

  // Calcular porcentaje de progreso
  const porcentaje = total === 0
    ? 0
    : Math.round((terminadas / total) * 100);

  document.getElementById("barra-progreso").style.width = porcentaje + "%";

  document.getElementById("texto-progreso").textContent =
    porcentaje + "% completado";

  // Mostrar tareas recientes
  const recientes = document.getElementById("tareas-recientes");

  if (!recientes) return;

  recientes.replaceChildren();

  const ultimasTareas = [...todasLasTareas].slice(-5).reverse();

  if (ultimasTareas.length === 0) {
    recientes.textContent = "Todavía no tenés tareas.";
    return;
  }

  ultimasTareas.forEach(tarea => {
    const elemento = document.createElement("p");

    elemento.textContent =
      `${tarea.title} - ${tarea.is_completed ? "Terminada" : "Pendiente"}`;

    recientes.appendChild(elemento);
  });
} 
 
// MOSTRAR UNA TAREA

function mostrarTarea(todo) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarea";

  const titulo = document.createElement("h3");
  titulo.textContent = todo.title;

  const descripcion = document.createElement("p");
  descripcion.textContent = todo.description || "Sin descripción";

  const prioridad = document.createElement("p");

  const prioridades = {
    low: "Baja",
    medium: "Media",
    high: "Alta"
  };

  prioridad.textContent = `Prioridad: ${prioridades[todo.priority] || todo.priority}`;

  // FECHA LÍMITE
  const fechaLimite = document.createElement("p");

  if (todo.due_date) {
    const partes = todo.due_date.split("-");
    fechaLimite.textContent = `Fecha límite: ${partes[2]}/${partes[1]}/${partes[0]}`;
  } else {
    fechaLimite.textContent = "Sin fecha límite";
  }

  const estado = document.createElement("p");
  estado.textContent = todo.is_completed ? "Completada" : "Pendiente";

  const completar = document.createElement("button");
  completar.textContent = todo.is_completed ? "Marcar pendiente" : "Completa";

  completar.addEventListener("click", () => {
    actualizarTarea(todo.id, {
      is_completed: !todo.is_completed
    });
  });

  const eliminar = document.createElement("button");
  eliminar.textContent = "Eliminar";
  eliminar.style.background = "#e74c3c";
  eliminar.style.marginTop = "8px";

  eliminar.addEventListener("click", () => {
    eliminarTarea(todo.id);
  });

  // BOTÓN EDITAR
  const editar = document.createElement("button");
  editar.textContent = "Editar";
  editar.style.marginTop = "8px";
  editar.style.background = "#3498db";

  editar.addEventListener("click", () => {
    editarTarea(todo);
  });

  tarjeta.append(
    titulo,
    descripcion,
    prioridad,
    fechaLimite,
    estado,
    completar,
    editar,
    eliminar
  );

  taskList.appendChild(tarjeta);
} 

// AGREGAR UNA TAREA

document.getElementById("task-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-description").value.trim();
  const priority = document.getElementById("task-priority").value;
  const due_date = document.getElementById("task-due-date").value;

  try {
    const response = await fetch(`${API}/api/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, priority, due_date })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudo crear la tarea");
    }

    e.target.reset();
    taskMessage.textContent = "Tarea agregada correctamente.";

    await cargarTareas();

  } catch (error) {
    taskMessage.textContent = error.message;
  }
});
// EDITAR UNA TAREA

async function editarTarea(todo) {
  const nuevoTitulo = prompt("Modificar título:", todo.title);

  if (nuevoTitulo === null) return;

  if (!nuevoTitulo.trim()) {
    alert("El título no puede estar vacío");
    return;
  }

  const nuevaDescripcion = prompt(
    "Modificar descripción:",
    todo.description || ""
  );

  if (nuevaDescripcion === null) return;

  const nuevaPrioridad = prompt(
    "Elegí la prioridad: low (baja), medium (media) o high (alta)",
    todo.priority
  );

  if (nuevaPrioridad === null) return;

  if (!["low", "medium", "high"].includes(nuevaPrioridad)) {
    alert("La prioridad debe ser low, medium o high");
    return;
  }

  const nuevaFecha = prompt(
    "Modificar fecha límite (AAAA-MM-DD). Dejá vacío si no querés una fecha:",
    todo.due_date || ""
  );

  if (nuevaFecha === null) return;

  if (nuevaFecha !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) {
    alert("La fecha debe tener el formato AAAA-MM-DD");
    return;
  }

  await actualizarTarea(todo.id, {
    title: nuevoTitulo.trim(),
    description: nuevaDescripcion,
    priority: nuevaPrioridad,
    due_date: nuevaFecha || null
  });
} 
// ACTUALIZAR UNA TAREA

async function actualizarTarea(id, cambios) {
  try {
    const response = await fetch(`${API}/api/todos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(cambios)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudo actualizar la tarea");
    }

    await cargarTareas();

  } catch (error) {
    taskMessage.textContent = error.message;
  }
}


// ELIMINAR UNA TAREA

async function eliminarTarea(id) {
  const confirmar = confirm("¿Seguro que querés eliminar esta tarea?");

  if (!confirmar) return;

  try {
    const response = await fetch(`${API}/api/todos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudo eliminar la tarea");
    }

    await cargarTareas();

  } catch (error) {
    taskMessage.textContent = error.message;
  }
}


// RECUPERAR SESIÓN SI LA PÁGINA SE RECARGA

if (token) {
  mostrarAplicacion();
  cargarTareas();
}

// NAVEGACIÓN ENTRE PANTALLAS

function cambiarPagina(nombre) {

  // Ocultar todas las pantallas
  document.querySelectorAll(".pagina").forEach((pagina) => {
    pagina.classList.remove("activa");
  });

  // Quitar selección de todos los botones
  document.querySelectorAll(".menu-link[data-page]").forEach((boton) => {
    boton.classList.remove("activo");
  });

  // Mostrar la pantalla seleccionada
  const paginaSeleccionada = document.getElementById(`pagina-${nombre}`);

  if (!paginaSeleccionada) return;

  paginaSeleccionada.classList.add("activa");

  // Marcar el botón seleccionado
  const botonSeleccionado = document.querySelector(
    `.menu-link[data-page="${nombre}"]`
  );

  if (botonSeleccionado) {
    botonSeleccionado.classList.add("activo");
  }

  // Cambiar el título superior
  const titulos = {
    inicio: "Inicio",
    tareas: "Mis tareas",
    estadisticas: "Estadísticas",
    configuracion: "Configuración"
  };

  const titulo = document.getElementById("titulo-pagina");

  if (titulo && titulos[nombre]) {
    titulo.textContent = titulos[nombre];
  }

} // ESTA LLAVE CIERRA cambiarPagina


// ESCUCHAR LOS BOTONES DEL MENÚ

document.querySelectorAll(".menu-link[data-page]").forEach((boton) => {

  boton.addEventListener("click", () => {
    const pagina = boton.dataset.page;
    cambiarPagina(pagina);
  });

});

// CONFIGURACIÓN DE APARIENCIA

const botonTemaClaro = document.getElementById("tema-claro");
const botonTemaOscuro = document.getElementById("tema-oscuro");
const mensajeTema = document.getElementById("mensaje-tema");

function cambiarTema(tema) {
  document.body.classList.toggle("modo-oscuro", tema === "oscuro");

  localStorage.setItem("tema", tema);

  if (mensajeTema) {
    mensajeTema.textContent =
      "Tema actual: " + (tema === "oscuro" ? "Oscuro" : "Claro");
  }
}

if (botonTemaClaro && botonTemaOscuro) {
  botonTemaClaro.addEventListener("click", () => {
    cambiarTema("claro");
  });

  botonTemaOscuro.addEventListener("click", () => {
    cambiarTema("oscuro");
  });
}

// Recuperar el tema guardado
const temaGuardado = localStorage.getItem("tema") || "claro";
cambiarTema(temaGuardado);
