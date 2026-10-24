# Especificación 001: Weekly Planner Tracker (MVP)

## 1. Contexto y objetivo

Weekly Planner Tracker es una herramienta educativa para planificar la semana y, más adelante, hacer seguimiento del cumplimiento. Esta primera funcionalidad cubre solo la planificación: ver los 7 días de la semana en una cuadrícula horaria, registrar actividades con su horario y verlas en pantalla de forma persistente.

El horario es semanal y recurrente: el usuario indica solo el **día de la semana** (lunes, martes, etc.) y la hora, nunca una fecha de calendario. Lo registrado rige indefinidamente hasta que se cambie.

**Regla de negocio del proyecto (alcance completo, no de esta versión):** cada actividad mostrará cuántas veces se ha cumplido, y al hacer click en una actividad se verá su historial de días cumplidos y no cumplidos. Esta versión sienta la base (el horario) y no incluye ese comportamiento.

**Por qué:** sin un horario registrado y persistente no hay nada que cumplir ni seguir. Esta funcionalidad es la base de las siguientes (marcar cumplimiento, contador, historial).

**Objetivo:** que una persona pueda registrar una actividad en un día y franja horaria, verla en su horario semanal y encontrarla igual al volver a abrir la aplicación.

**Marco del proyecto:** el stack tecnológico, la política de tests, la persistencia y el idioma del código están fijados en `docs/constitution.md`. Esta spec no los repite: la funcionalidad se entrega como página web con una base de datos, y debe cumplir esa constitución.

## 2. Usuarios

- **Persona que organiza su semana** (estudiante o cualquier persona con hábitos que quiere sostener, como estudiar, hacer ejercicio o tomar agua). Usuario único: no existen cuentas, inicio de sesión ni múltiples usuarios. El horario es el mismo para cualquiera que abra la aplicación.

## 3. Historias de usuario

- **HU-1:** Como usuario, quiero ver los 7 días de la semana en una cuadrícula con las horas del día, para tener una visión completa de mi horario.
- **HU-2:** Como usuario, quiero registrar una actividad indicando nombre, categoría, día y horario de inicio y fin, para planificar mi semana.
- **HU-3:** Como usuario, quiero ver cada actividad en el día y la posición horaria que le corresponde, para saber qué tengo que hacer y cuándo.
- **HU-4:** Como usuario, quiero que mis actividades se conserven al cerrar y volver a abrir la aplicación, para no tener que registrarlas de nuevo.
- **HU-5:** Como usuario, quiero que se me informe el motivo cuando una actividad choca con otra del mismo día y se rechaza, para corregirla.
- **HU-6:** Como usuario con varias pestañas abiertas, quiero ver los mismos cambios en todas, para no trabajar con un horario desactualizado.

## 4. Requisitos funcionales

Notación EARS: *Cuando* (evento), *Mientras* (estado), *Si… entonces* (condición no deseada), *El sistema deberá* (respuesta).

### RF-1: Visualizar la semana
**Criterios de aceptación:**
- **RF-1.1:** Cuando el usuario abre la pantalla, el sistema deberá mostrar los 7 días de la semana, de lunes a domingo, cada uno con su nombre.
- **RF-1.2:** El sistema deberá mostrar el horario como una cuadrícula con los días como columnas y las horas del día como filas, de modo que cada actividad quede posicionada según su hora de inicio y fin.
- **RF-1.3:** Mientras no exista ninguna actividad registrada, el sistema deberá mostrar el calendario semanal vacío, sin textos de ayuda ni pasos guiados adicionales.
- **RF-1.4:** El sistema deberá mostrar los días como días de la semana (lunes, martes, etc.) y no como fechas de calendario.
- **RF-1.5:** Si la cuadrícula no cabe completa en la pantalla, entonces el sistema deberá permitir desplazarse (scroll) para ver el resto.

### RF-2: Registrar una actividad
**Criterios de aceptación:**
- **RF-2.1:** El sistema deberá ofrecer un formulario con los campos: nombre, categoría, día de la semana, hora de inicio y hora de fin. Los cinco campos deberán partir vacíos.
- **RF-2.2:** El sistema deberá permitir asignar una actividad a un único día por registro. Para repetirla en otro día, el usuario la registra de nuevo.
- **RF-2.3:** Cuando el usuario envía el formulario con todos los datos válidos y sin choques, el sistema deberá guardar la actividad de forma persistente y mostrarla en su día y horario.
- **RF-2.4:** Cuando la actividad se guarda correctamente, el sistema deberá vaciar el formulario y mostrar un mensaje temporal de confirmación durante 5 segundos.
- **RF-2.5:** Mientras se guarda una actividad, el sistema deberá mostrar un icono de "guardando", y cuando termine el guardado, un icono distinto de "guardado".

### RF-3: Validar los datos
El orden de las comprobaciones al registrar es: (1) campos (este RF), (2) solapamientos (RF-4), (3) errores de guardado (RF-7).

**Criterios de aceptación:**
- **RF-3.1:** Cuando el usuario envía el formulario, el sistema deberá normalizar el nombre y la categoría antes de validarlos: eliminar los espacios al inicio y al final, y reducir a uno solo los espacios repetidos entre palabras.
- **RF-3.2:** Si el nombre o la categoría quedan vacíos tras la normalización, entonces el sistema deberá rechazar el registro e indicar qué campo falta.
- **RF-3.3:** Si no se selecciona el día, la hora de inicio o la hora de fin, entonces el sistema deberá rechazar el registro e indicar qué campo falta.
- **RF-3.4:** Cuando la hora de fin es 00:00, el sistema deberá interpretarla como el fin del día (24:00).
- **RF-3.5:** Si la hora de fin (con 00:00 entendida como 24:00) es igual o anterior a la hora de inicio, entonces el sistema deberá rechazar el registro e informar que la actividad debe terminar el mismo día y después de su inicio, y que 00:00 marca el fin del día.
- **RF-3.6:** Si el nombre o la categoría, ya normalizados, superan los 30 caracteres, entonces el sistema deberá rechazar el registro e indicar el límite.
- **RF-3.7:** El sistema deberá impedir que se ingresen valores inválidos de hora o minutos (horas fuera de 00–23 o minutos fuera de 00–59).
- **RF-3.8:** Si el nombre o la categoría contienen caracteres o secuencias que pueden usarse para vulnerar la seguridad de la aplicación, entonces el sistema deberá rechazar el registro e indicar que el texto no es válido. Son de este tipo: `<`, `>`, `{`, `}`, `$`, `;`, `'`, `"`, el acento grave (``` ` ```), y las secuencias `--`, `/*` y `*/`. Los emojis y el resto de caracteres se aceptan.
- **RF-3.9:** El sistema deberá validar los datos en el momento de guardar, sin depender de que la pantalla ya los haya comprobado.
- **RF-3.10:** Si varios campos son inválidos a la vez, entonces el sistema deberá mostrar todos los errores juntos, no solo el primero.
- **RF-3.11:** Cuando el registro es rechazado, el sistema deberá vaciar únicamente los campos que no pasaron la validación, conservar los demás y pedir al usuario que rellene de nuevo los campos vaciados. En un choque de horario o en un duplicado, los campos que no pasan la validación son el día, la hora de inicio y la hora de fin, porque son los que se solapan.

### RF-4: Evitar solapamientos y duplicados
**Criterios de aceptación:**
- **RF-4.1:** Si el horario de la nueva actividad se solapa con el de una o más actividades ya registradas el mismo día, entonces el sistema deberá rechazar el registro e informar el motivo, indicando con cuáles actividades choca (todas las que apliquen).
- **RF-4.2:** Cuando una actividad termina exactamente a la hora en que empieza otra del mismo día, el sistema deberá aceptarlas, porque no hay solapamiento.
- **RF-4.3:** Cuando dos actividades están en días distintos, el sistema deberá aceptarlas aunque coincidan en hora.
- **RF-4.4:** Si el usuario intenta registrar una actividad idéntica a una ya registrada (mismo nombre, categoría, día e inicio y fin), entonces el sistema deberá rechazarla e informar que es un duplicado y que además se solapa con la existente, pidiendo al usuario que verifique en el horario semanal si ya está registrada.
- **RF-4.5:** Si dos registros que se solapan llegan casi al mismo tiempo, entonces el sistema deberá conservar el primero que se registró y rechazar el segundo conforme a RF-4.1.

### RF-5: Mostrar el horario
**Criterios de aceptación:**
- **RF-5.1:** El sistema deberá mostrar cada actividad dentro de la columna de su día, ocupando el espacio entre su hora de inicio y su hora de fin, con su nombre, categoría y horas.
- **RF-5.2:** Mientras un día tenga varias actividades, el sistema deberá mostrarlas en orden cronológico según su posición en la cuadrícula, sin que se superpongan.
- **RF-5.3:** El sistema deberá mostrar las categorías como texto, sin colores asociados.
- **RF-5.4:** El sistema deberá tener un tamaño mínimo de cuadrícula que la haga legible: cada hora ocupará al menos 48 píxeles de alto (1152 píxeles en total). Además, cada bloque de actividad tendrá una altura mínima de 20 píxeles, de modo que una actividad de cualquier duración, incluida una de 1 minuto, muestre su nombre de forma legible. Una actividad de 00:00 a 00:00 ocupa el día completo.

### RF-6: Persistencia
**Criterios de aceptación:**
- **RF-6.1:** Cuando el usuario cierra y vuelve a abrir la aplicación, el sistema deberá mostrar todas las actividades registradas, igual que si el usuario no hubiera salido de la pantalla.
- **RF-6.2:** Mientras el usuario no modifique el horario, el sistema deberá conservar las actividades indefinidamente, sin asociarlas a una semana concreta.
- **RF-6.3:** El sistema deberá mostrar el mismo horario a cualquiera que abra la aplicación, desde cualquier navegador o dispositivo.

### RF-7: Errores de conexión
**Criterios de aceptación:**
- **RF-7.1:** Si no se puede guardar una actividad porque no hay conexión con la base de datos, entonces el sistema deberá mostrar el mensaje "No se pudo guardar por fallas de conexión" y pedir al usuario que intente de nuevo. Se considera falta de conexión cuando la base de datos no está disponible para la aplicación en el momento de guardar.
- **RF-7.2:** Si falla el guardado, entonces el sistema no deberá mostrar la actividad en el horario como si estuviera registrada.
- **RF-7.3:** Si falla el guardado por conexión, entonces el sistema deberá conservar todos los datos escritos en el formulario para que el usuario pueda reintentar.
- **RF-7.4:** Si falla la carga inicial del horario, o no se logran cargar todas las actividades registradas, entonces el sistema deberá mostrar el mensaje "Ocurrió un fallo del sistema al cargar tus actividades, intenta de nuevo en 1 minuto." y no mostrar un horario vacío o incompleto como si fuera el real. Mientras las actividades cargan, el sistema deberá mostrar el mensaje "Cargando tus actividades".

### RF-8: Sincronización entre pestañas
**Criterios de aceptación:**
- **RF-8.1:** Cuando se registra una actividad en una pestaña, el sistema deberá mostrarla en todas las demás pestañas abiertas de la aplicación en menos de 2 segundos, sin que el usuario recargue.

## 5. Requisitos no funcionales

- **RNF-1 Usabilidad:** cualquier persona que entre por primera vez deberá entender qué debe hacer, sin instrucciones. Una persona nueva deberá poder registrar su primera actividad en menos de 1 minuto.
- **RNF-2 Rendimiento:** estando conectado a la base de datos (condiciones normales), la actividad registrada deberá aparecer en pantalla en menos de 2 segundos.
- **RNF-3 Idioma:** todos los textos y mensajes visibles al usuario deberán estar en español, con mensajes de error que indiquen qué corregir.
- **RNF-4 Mantenibilidad:** la funcionalidad deberá poder ser entendida y mantenida por un desarrollador junior sin ayuda externa.
- **RNF-5 Compatibilidad:** la pantalla deberá funcionar como página web en Chrome, Edge, Firefox y Safari de escritorio, en sus dos últimas versiones estables. No se exige adaptación a móvil ni a ventanas estrechas.
- **RNF-6 Fiabilidad:** una actividad confirmada como guardada no deberá perderse.
- **RNF-7 Zona horaria:** el sistema deberá interpretar siempre las horas en la misma zona horaria, sin conversiones.
- **RNF-8 Accesibilidad:** esta versión no define requisitos específicos de accesibilidad (teclado, lectores de pantalla).
- **RNF-9 Seguridad:** la aplicación deberá protegerse frente a inyección de consultas y de código. Las consultas a la base de datos se construyen solo con valores, nunca uniendo texto del usuario; ninguna clave que empiece por `$` llega a la base de datos; y todo texto del usuario se muestra como texto, nunca como código. Esto aplica también a los datos que llegan sin pasar por el formulario.

## 6. Casos límite

- **Nombre o categoría con espacios de más:** se normalizan antes de validar (RF-3.1); si solo había espacios, se tratan como vacíos (RF-3.2).
- **Hora de fin 00:00:** se interpreta como fin del día. Una actividad de 23:59 a 00:00 se admite (RF-3.4).
- **Actividad de 00:00 a 00:00:** se acepta como día completo (RF-3.4).
- **Actividad que cruza la medianoche (ej. 23:00 a 01:00):** se rechaza informando el motivo (RF-3.5).
- **Hora de fin igual a la de inicio (salvo 00:00 como fin de día):** se rechaza (RF-3.5).
- **Actividades contiguas:** se permiten (RF-4.2).
- **Mismo nombre en distintos días o franjas que no se solapan:** se permite.
- **Categorías que difieren solo en mayúsculas o tildes ("Estudio" y "estudio"):** son categorías distintas. Se guardan tal como se escriben y no cambian las reglas de choque ni de duplicado.
- **Doble clic o envío repetido:** se registra el primero; el segundo se rechaza como duplicado y solapamiento (RF-4.4).
- **Guardado exitoso cuyo resultado el usuario no llegó a ver:** el reintento se rechaza como duplicado y se le pide verificar en el horario (RF-4.4).
- **Dos pestañas o dispositivos registrando choques casi a la vez:** prevalece el primero (RF-4.5).
- **Pestaña con datos viejos:** todas las pestañas se actualizan cuando cambia el horario (RF-8.1).
- **Primer uso sin actividades:** se muestra el calendario semanal vacío (RF-1.3).
- **Horas o minutos fuera de rango:** no se pueden ingresar (RF-3.7).
- **Actividad de 1 minuto o de todo el día (00:00 a 23:59):** se aceptan.
- **Texto que intenta vulnerar la seguridad en nombre o categoría:** se rechaza (RF-3.8). Nombres de más de 30 caracteres: se rechazan (RF-3.6). Emojis y caracteres normales: se aceptan.
- **Tildes, ñ y caracteres normales:** se aceptan y se muestran tal cual.
- **Datos que llegan sin pasar por el formulario:** se validan igualmente al guardar (RF-3.9) y se protegen según RNF-9.
- **Datos inválidos en la base de datos al cargar:** no ocurren en el uso normal, porque solo se guardan datos válidos (RF-3.9). Si la base de datos se altera desde fuera de la aplicación, la carga falla con el mensaje de RF-7.4.
- **Carga parcial de actividades:** deben cargar todas; si no, se informa como fallo (RF-7.4).
- **Muchas actividades:** no hay límite de actividades por día ni en total.
- **Recarga o salida con el formulario a medio llenar:** el borrador se pierde.
- **Pérdida de conexión durante el guardado:** se aplica RF-7.

## 7. Fuera de alcance

- Marcar actividades como completadas, contador de cumplimientos e historial de días cumplidos y no cumplidos al hacer click (funcionalidades posteriores, ver regla de negocio en la sección 1).
- Editar y eliminar actividades: se incorporarán en la siguiente versión. Mientras tanto, una actividad mal registrada no puede corregirse.
- Asignar una actividad a varios días en un solo registro.
- Colores o iconos por categoría.
- Cuentas de usuario, inicio de sesión y múltiples usuarios.
- Recordatorios, notificaciones y alarmas.
- Navegación entre semanas con fechas concretas o vista de calendario mensual.
- Funcionamiento sin conexión con sincronización posterior.
- Importar o exportar el horario.
- Límite máximo de actividades.
- Requisitos de accesibilidad y de adaptación a móvil.
- Reintento automático de la carga: el usuario vuelve a intentarlo manualmente.

## 8. Criterios de finalización

La funcionalidad está terminada cuando:

1. Se cumplen todos los criterios de aceptación de RF-1 a RF-8.
2. Un usuario puede registrar una actividad, cerrar la aplicación, volver a abrirla y encontrarla en el mismo día y horario.
3. Se han comprobado los casos límite de la sección 6.
4. El resultado cumple los seis principios de `docs/constitution.md`.
