# Constitución del proyecto

**Regla de negocio:** el horario es semanal y recurrente (día de la semana + hora, sin fecha de calendario). Cada actividad muestra cuántas veces se ha cumplido. Al hacer click en una actividad se ve su historial: qué días se cumplió y cuáles no.

1. **Stack fijo y acotado:** Express.js (backend), React (frontend) y MongoDB (base de datos), todo en JavaScript. Cualquier librería adicional se justifica por escrito en el README.
2. **Spec manda:** `specs/<número-nombre>/spec.md` es la fuente de verdad de cada funcionalidad. Todo cambio de comportamiento actualiza primero su spec, y cada función de `core` referencia el requisito con el número de su spec (ej. `// 001/RF-3`).
3. **Lógica separada de interfaz:** la lógica de negocio (conteo de cumplimientos, días cumplidos/no cumplidos) vive en `server/core/` como funciones puras, sin Express, Mongo ni React. Las rutas y los componentes solo conectan y muestran.
4. **Tests obligatorios en `core`:** toda función de `core` tiene test con `node --test`. No se integra código con tests en rojo, y todo bug corregido añade un test que lo reproduce.
5. **Persistencia en MongoDB, plantilla separada del registro:** `activities` guarda el horario (nombre, categoría, día de la semana, hora de inicio y de fin) y `completions` guarda un registro por actividad y fecha. El contador y los días no cumplidos se calculan desde `completions`, nunca se guardan duplicados, y editar el horario no borra el historial.
6. **Idioma:** identificadores y comentarios en inglés; todo texto visible al usuario, en español y centralizado en un solo archivo.
