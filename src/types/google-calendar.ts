// See: https://developers.google.com/workspace/calendar/api/v3/reference/events
export interface Event {
    id?: string;
    status?: "confirmed" | "cancelled";
    created?: string;
    updated?: string;
    summary?: string;
    description?: string;
    start?: {
        date?: string;
        dateTime?: string;
        timeZone?: string;
    };
    end?: {
        date?: string;
        dateTime?: string;
        timeZone?: string;
    };
}