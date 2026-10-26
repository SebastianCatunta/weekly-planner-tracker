# Weekly Planner Tracker

Herramienta educativa para planificar la semana: una cuadrícula de 7 días por 24 horas donde se registran actividades con su horario. La especificación de la primera funcionalidad está en [specs/001-weeklyPlannerTracker-mvp/spec.md](specs/001-weeklyPlannerTracker-mvp/spec.md), y las reglas del proyecto en [docs/constitution.md](docs/constitution.md).

## Estructura

```
weekly-planner-tracker/
├── docs/constitution.md
├── specs/001-weeklyPlannerTracker-mvp/   # spec, plan y tareas
├── server/                               # Express + MongoDB (API y lógica en src/core/)
└── client/                               # React + Vite (interfaz)
```

## Dependencias

Cada dependencia está justificada según la constitución y la sección 8 del plan.

| Paquete | Dónde | Justificación |
|---|---|---|
| `express` | server | Definido por la constitución. Se añade en la tarea T-20. |
| `mongodb` | server | Driver oficial de MongoDB, sin ODM: las reglas viven en `core`, así que un esquema del ODM las duplicaría. Se añade en la tarea T-12. |
| `react`, `react-dom` | client | Definido por la constitución. |
| `vite`, `@vitejs/plugin-react` | client (desarrollo) | Compila y sirve el cliente en desarrollo. Create React App está descontinuado y configurar webpack a mano es complejidad innecesaria. |

No se usan otras librerías: los tests son `node --test` y la configuración de entorno se carga de forma nativa.

## Requisitos

- Node.js 20 o superior.
- MongoDB accesible desde el servidor (local o remoto).

## Configuración del servidor

1. Copia `server/.env.example` a `server/.env`.
2. Escribe en `MONGODB_URI` la dirección de tu MongoDB.

El archivo `.env` real no se sube al repositorio (está en `.gitignore`). No pongas contraseñas ni direcciones con credenciales en `.env.example`.

## Cómo arrancar

Servidor (escucha en el puerto 3001, o el de la variable `PORT`):

```bash
cd server
npm install
npm start
```

Si MongoDB est� apagado, el servidor arranca igual y responde 503 `DB_UNAVAILABLE` hasta que vuelva a estar disponible.

Cliente:

```bash
cd client
npm install
npm run dev
```

En desarrollo, el cliente reenvía las peticiones `/api` al servidor en el puerto 3001 (ver `client/vite.config.js`).

## Tests

Los tests de la lógica de negocio están en `server/tests/core/` y se ejecutan con `npm test` dentro de `server/`.
