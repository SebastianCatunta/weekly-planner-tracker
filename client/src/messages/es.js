// Único archivo con textos visibles al usuario (principio 6).
// El servidor devuelve códigos; aquí se traduce cada uno (decisión D6 del plan).

const formatConflict = (conflict) => `"${conflict.name}" (${conflict.start} a ${conflict.end})`;
const formatConflicts = (conflicts = []) => conflicts.map(formatConflict).join(", ");

export const messages = {
  appName: "Weekly Planner Tracker",

  // RF-1.4: los días se muestran como días de la semana, no como fechas.
  days: {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  },

  grid: {
    label: "Horario semanal",
    hourColumn: "Hora",
  },

  form: {
    title: "Nueva actividad",
    name: "Nombre",
    category: "Categoría",
    day: "Día de la semana",
    start: "Hora de inicio",
    end: "Hora de fin",
    save: "Guardar actividad",
    hour: "Hora",
    minute: "Minutos",
    emptyOption: "--",
    selectDay: "Selecciona un día",
  },

  saveStatus: {
    saving: "Guardando",
    saved: "Guardado",
  },

  // RF-2.4
  saved: "La actividad se guardó correctamente.",

  // RF-7.4
  loading: "Cargando tus actividades",
  loadFailed: "Ocurrió un fallo del sistema al cargar tus actividades, intenta de nuevo en 1 minuto.",

  // RF-7.1
  connectionError: "No se pudo guardar por fallas de conexión",
  tryAgain: "Intenta de nuevo.",

  // RF-3.11: se pide rellenar solo los campos que se vaciaron.
  refill: (labels) => `Vuelve a rellenar: ${labels.join(", ")}.`,

  // Códigos de `details` del 422 (sección 4.2 del plan).
  validation: {
    NAME_REQUIRED: "Escribe el nombre de la actividad.",
    CATEGORY_REQUIRED: "Escribe la categoría de la actividad.",
    DAY_REQUIRED: "Selecciona el día de la semana.",
    START_REQUIRED: "Selecciona la hora de inicio.",
    END_REQUIRED: "Selecciona la hora de fin.",
    NAME_TOO_LONG: "El nombre no puede tener más de 30 caracteres.",
    CATEGORY_TOO_LONG: "La categoría no puede tener más de 30 caracteres.",
    TEXT_NOT_ALLOWED: (fieldLabels) =>
      `El texto de ${fieldLabels.join(" y ")} no es válido: no uses < > { } $ ; ' " \` ni las secuencias -- /* */.`,
    DAY_INVALID: "El día seleccionado no es válido.",
    TIME_INVALID: "La hora no es válida: usa horas de 00 a 23 y minutos de 00 a 59.",
    END_NOT_AFTER_START:
      "La actividad debe terminar el mismo día y después de su inicio. La hora 00:00 marca el fin del día.",
  },

  // Códigos de error de primer nivel (secciones 4.1 y 4.2 del plan).
  errors: {
    VALIDATION_FAILED: "Revisa los datos de la actividad.",
    OVERLAP: (conflicts) => `El horario choca con otras actividades: ${formatConflicts(conflicts)}.`,
    DUPLICATE_OVERLAP: (conflicts) =>
      `Esta actividad es un duplicado y además se solapa con ${formatConflicts(conflicts)}. ` +
      "Verifica en el horario semanal si ya está registrada.",
    DB_UNAVAILABLE: "No se pudo guardar por fallas de conexión",
    INVALID_BODY: "Los datos enviados no se pudieron leer. Revisa el formulario e intenta de nuevo.",
    DATA_CORRUPT: "Ocurrió un fallo del sistema al cargar tus actividades, intenta de nuevo en 1 minuto.",
    INTERNAL: "Ocurrió un fallo del sistema. Intenta de nuevo en 1 minuto.",
    NOT_FOUND: "No se encontró lo que buscabas.",
  },
};
