import "dotenv/config";

// npm install -g tsx
// tsx --env-file=.env src/platforms/google-calendar/scripts/test-calendar-mapping.ts

const map = JSON.parse(process.env.GOOGLE_CALENDAR_MAPPING ?? "{}");
console.log(map);
