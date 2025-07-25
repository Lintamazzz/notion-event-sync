import { listCalendars } from "../client.js";

// npm install -g tsx
// tsx --env-file=.env src/platforms/google-calendar/scripts/list.ts

// Returns the calendars on the user's calendar list.
const result = await listCalendars();
console.log(result.data.items);
