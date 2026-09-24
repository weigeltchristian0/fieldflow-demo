# Where things live

Use this to route a symptom to the code that causes it, before reading any of it.

| Symptom sounds like | Look in | Why |
|---|---|---|
| Wrong times, one region affected and not the other, slots offered outside working hours, a day that starts or ends at the wrong hour | `src/workingHours.ts` | It is the only place a local working day becomes a UTC window. Every timezone assumption in the app is here. |
| No slots at all, too many slots, a slot that collides with an existing visit, a rejection with a confusing reason | `src/suggest.ts` | It walks the grid and applies the collision rules. Reason codes come from here. |
| A region, role or reason-code message is wrong everywhere | `src/types.ts` | Region table and message strings. |
| A wrong number on screen, something not rendering, a filter not applying | `public/index.html` | The entire UI is this one file. |
| A 400 or 500 from the API, missing or malformed fields | `src/server.ts` | Request validation and response shaping. |
| A count that disagrees with the app, a row that seems missing | `warehouse/` | The mirror lags and soft-deletes. Read `warehouse/SCHEMA_GUIDE.md` before trusting a query. |

## Seams worth suspecting

Bugs cluster where two things meet.

- **Local time and UTC.** Visits are stored UTC-naive. The UI renders in each
  region's timezone. `workingHours.ts` converts between them. A symptom that
  hits one region and not the other is almost always this seam.
- **The app and the mirror.** `warehouse/demo.db` is not real time. A missing
  row may be an unsynced row. Check `max(_SYNCED_AT)` before concluding
  anything from an absence.
