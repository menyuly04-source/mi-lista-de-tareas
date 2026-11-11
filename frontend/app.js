
const API = "";

const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const authMessage = document.getElementById("auth-message");
const taskMessage = document.getElementById("task-message");
const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");

let token = sessionStorage.getItem("access_token");
let filtroActual = "all";
let todasLasTareas = [];
let creandoTarea = false;

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
  sessionStorage.removeItem("user_email");
  token = null;

  appSection.classList.add("oculto");
  authSection.classList.remove("oculto");

  taskList.replaceChildren();
  todasLasTareas = [];
  actualizarResumen();

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

    todasLasTareas = data;

    actualizarResumen();
    mostrarTareasFiltradas();

    if (data.length === 0) {
      taskMessage.textContent = "Todavía no tenés tareas. ¡Agregá la primera!";
    }

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

  document.getElementById("total-tareas").textContent = total;
  document.getElementById("total-pendientes").textContent = pendientes;
  document.getElementById("total-terminadas").textContent = terminadas;

  document.getElementById("estadistica-total").textContent = total;
  document.getElementById("estadistica-pendientes").textContent = pendientes;
  document.getElementById("estadistica-terminadas").textContent = terminadas;

  const porcentaje = total === 0
    ? 0
    : Math.round((terminadas / total) * 100);

  document.getElementById("barra-progreso").style.width = porcentaje + "%";

  document.getElementById("texto-progreso").textContent =
    porcentaje + "% completado";

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

  const prioridades = {
    low: "Baja",
    medium: "Media",
    high: "Alta"
  };

  const prioridad = document.createElement("p");
  prioridad.textContent =
    `Prioridad: ${prioridades[todo.priority] || todo.priority}`;

  const fechaLimite = document.createElement("p");

  if (todo.due_date) {
    const partes = todo.due_date.split("-");
    fechaLimite.textContent =
      `Fecha límite: ${partes[2]}/${partes[1]}/${partes[0]}`;
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

  const editar = document.createElement("button");
  editar.textContent = "Editar";
  editar.style.marginTop = "8px";
  editar.style.background = "#3498db";

  editar.addEventListener("click", () => {
    mostrarEditor(tarjeta, todo);
  });

  const eliminar = document.createElement("button");
  eliminar.textContent = "Eliminar";
  eliminar.style.background = "#e74c3c";
  eliminar.style.marginTop = "8px";

  eliminar.addEventListener("click", () => {
    eliminarTarea(todo.id);
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

// EDITAR SOLAMENTE LOS CAMPOS QUE CAMBIEN

function mostrarEditor(tarjeta, todo) {
  if (tarjeta.querySelector(".editor-tarea")) return;

  const editor = document.createElement("form");
  editor.className = "editor-tarea";

  const tituloLabel = document.createElement("label");
  tituloLabel.textContent = "Título";

  const tituloInput = document.createElement("input");
  tituloInput.type = "text";
  tituloInput.value = todo.title;
  tituloInput.required = true;

  const descripcionLabel = document.createElement("label");
  descripcionLabel.textContent = "Descripción";

  const descripcionInput = document.createElement("textarea");
  descripcionInput.value = todo.description || "";

  const prioridadLabel = document.createElement("label");
  prioridadLabel.textContent = "Prioridad";

  const prioridadSelect = document.createElement("select");

  [
    { value: "low", label: "Baja" },
    { value: "medium", label: "Media" },
    { value: "high", label: "Alta" }
  ].forEach(opcion => {
    const option = document.createElement("option");
    option.value = opcion.value;
    option.textContent = opcion.label;
    prioridadSelect.appendChild(option);
  });

  prioridadSelect.value = todo.priority || "medium";

  const fechaLabel = document.createElement("label");
  fechaLabel.textContent = "Fecha límite";

  const fechaInput = document.createElement("input");
  fechaInput.type = "date";
  fechaInput.value = todo.due_date || "";

  const guardar = document.createElement("button");
  guardar.type = "submit";
  guardar.textContent = "Guardar cambios";

  const cancelar = document.createElement("button");
  cancelar.type = "button";
  cancelar.textContent = "Cancelar";

  cancelar.addEventListener("click", () => {
    editor.remove();
  });

  editor.append(
    tituloLabel,
    tituloInput,
    descripcionLabel,
    descripcionInput,
    prioridadLabel,
    prioridadSelect,
    fechaLabel,
    fechaInput,
    guardar,
    cancelar
  );

  tarjeta.appendChild(editor);

  editor.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cambios = {};

    if (tituloInput.value.trim() !== todo.title) {
      cambios.title = tituloInput.value.trim();
    }

    if (descripcionInput.value !== (todo.description || "")) {
      cambios.description = descripcionInput.value;
    }

    if (prioridadSelect.value !== todo.priority) {
      cambios.priority = prioridadSelect.value;
    }

    if (fechaInput.value !== (todo.due_date || "")) {
      cambios.due_date = fechaInput.value || null;
    }

    if (Object.keys(cambios).length === 0) {
      editor.remove();
      return;
    }

    if (!cambios.title && tituloInput.value.trim() === "") {
      alert("El título no puede estar vacío.");
      return;
    }

    guardar.disabled = true;
    guardar.textContent = "Guardando...";

    await actualizarTarea(todo.id, cambios);
  });
}

// AGREGAR UNA TAREA SIN DUPLICAR CLICS

taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (creandoTarea) return;

  const title = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-description").value.trim();
  const priority = document.getElementById("task-priority").value;
  const due_date = document.getElementById("task-due-date").value;

  if (!title) {
    taskMessage.textContent = "Escribí un título para la tarea.";
    return;
  }

  creandoTarea = true;

  const botonAgregar = taskForm.querySelector('button[type="submit"]');
  const textoOriginal = botonAgregar.textContent;

  botonAgregar.disabled = true;
  botonAgregar.textContent = "Agregando...";
  taskMessage.textContent = "Guardando tarea...";

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

    taskForm.reset();
    taskMessage.textContent = "Tarea agregada correctamente.";

    await cargarTareas();

  } catch (error) {
    taskMessage.textContent = error.message;

  } finally {
    creandoTarea = false;
    botonAgregar.disabled = false;
    botonAgregar.textContent = textoOriginal;
  }
});

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


 // VENTANA PERSONALIZADA PARA CONFIRMAR LA ELIMINACIÓN

function mostrarConfirmacionEliminar(tarea) {
  return new Promise((resolve) => {
    const oscuro = document.body.classList.contains("modo-oscuro");

    const fondo = document.createElement("div");
    fondo.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      padding: 20px;
    `;

    const ventana = document.createElement("div");
    ventana.style.cssText = `
      width: 100%;
      max-width: 340px;
      padding: 24px;
      border-radius: 14px;
      background: ${oscuro ? "#1e293b" : "#ffffff"};
      color: ${oscuro ? "#f1f5f9" : "#1f2937"};
      box-shadow: 0 10px 35px rgba(0,0,0,0.3);
    `;

    const titulo = document.createElement("h3");
    titulo.textContent = "Eliminar tarea";

    const mensaje = document.createElement("p");
    mensaje.textContent = `¿Estás seguro de que querés eliminar "${tarea.title}"?`;

    const botones = document.createElement("div");
    botones.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 22px;
    `;

    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.textContent = "Cancelar";
    cancelar.style.background = oscuro ? "#475569" : "#e5e7eb";
    cancelar.style.color = oscuro ? "#ffffff" : "#1f2937";

    const eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.textContent = "Eliminar";
    eliminar.style.background = "#dc3545";
    eliminar.style.color = "#ffffff";

    function cerrar(resultado) {
      fondo.remove();
      resolve(resultado);
    }

    cancelar.addEventListener("click", () => cerrar(false));
    eliminar.addEventListener("click", () => cerrar(true));

    fondo.addEventListener("click", (e) => {
      if (e.target === fondo) cerrar(false);
    });

    botones.append(cancelar, eliminar);
    ventana.append(titulo, mensaje, botones);
    fondo.appendChild(ventana);
    document.body.appendChild(fondo);
  });
}

// ELIMINAR UNA TAREA

async function eliminarTarea(id) {
  const tarea = todasLasTareas.find(todo => todo.id === id);

  if (!tarea) return;

  const confirmar = await mostrarConfirmacionEliminar(tarea);

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
  document.querySelectorAll(".pagina").forEach((pagina) => {
    pagina.classList.remove("activa");
  });

  document.querySelectorAll(".menu-link[data-page]").forEach((boton) => {
    boton.classList.remove("activo");
  });

  const paginaSeleccionada = document.getElementById(`pagina-${nombre}`);

  if (!paginaSeleccionada) return;

  paginaSeleccionada.classList.add("activa");

  const botonSeleccionado = document.querySelector(
    `.menu-link[data-page="${nombre}"]`
  );

  if (botonSeleccionado) {
    botonSeleccionado.classList.add("activo");
  }

  const titulos = {
    inicio: "Inicio",
    tareas: "Mis tareas",
    estadisticas: "Estadísticas",
    configuracion: "Perfil"
  };

  const titulo = document.getElementById("titulo-pagina");

  if (titulo && titulos[nombre]) {
    titulo.textContent = titulos[nombre];
  }
}

// ESCUCHAR LOS BOTONES DEL MENÚ

document.querySelectorAll(".menu-link[data-page]").forEach((boton) => {
  boton.addEventListener("click", () => {
    cambiarPagina(boton.dataset.page);
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

const temaGuardado = localStorage.getItem("tema") || "claro";
cambiarTema(temaGuardado);
