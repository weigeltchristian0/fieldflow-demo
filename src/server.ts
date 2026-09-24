import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { query } from './db.ts';
import { suggestSlots } from './suggest.ts';
import { gapsBetween } from './gaps.ts';
import { REGIONS, type RegionId, type Visit } from './types.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.static(path.join(here, '..', 'public')));

function isRegionId(value: unknown): value is RegionId {
  return value === 'leeds' || value === 'munich';
}

function visitsFor(date: string, regionId: RegionId): Visit[] {
  const rows = query<{
    ID: string; TECHNICIAN_ID: string; NAME: string;
    STARTS_AT: string; ENDS_AT: string; STATUS: string;
  }>(
    `select v.ID, v.TECHNICIAN_ID, c.NAME, v.STARTS_AT, v.ENDS_AT, v.STATUS
       from APP_VISIT v
       join APP_CUSTOMER c on c.ID = v.CUSTOMER_ID
      where date(v.STARTS_AT) = ? and v.REGION_ID = ? and v._DELETED_AT is null
      order by v.STARTS_AT`,
    [date, regionId],
  );
  return rows.map((r) => ({
    id: r.ID,
    technicianId: r.TECHNICIAN_ID,
    customerName: r.NAME,
    regionId,
    startsAt: `${r.STARTS_AT.replace(' ', 'T')}Z`,
    endsAt: `${r.ENDS_AT.replace(' ', 'T')}Z`,
    status: r.STATUS as Visit['status'],
  }));
}

app.get('/api/regions', (_req, res) => {
  res.json(Object.values(REGIONS));
});

app.get('/api/visits', (req, res) => {
  const { date, region } = req.query;
  if (typeof date !== 'string' || !isRegionId(region)) {
    res.status(400).json({ error: 'date and region are required' });
    return;
  }
  res.json(visitsFor(date, region));
});

app.get('/api/gaps', (req, res) => {
  const { date, region } = req.query;
  if (typeof date !== 'string' || !isRegionId(region)) {
    res.status(400).json({ error: 'date and region are required' });
    return;
  }
  res.json(gapsBetween(visitsFor(date, region)));
});

app.get('/api/slots', (req, res) => {
  const { date, region } = req.query;
  if (typeof date !== 'string' || !isRegionId(region)) {
    res.status(400).json({ error: 'date and region are required' });
    return;
  }
  const duration = Number(req.query.duration ?? 120);
  res.json(suggestSlots(date, region, duration, visitsFor(date, region)));
});

const PORT = Number(process.env.PORT ?? 4001);
app.listen(PORT, () => {
  console.log(`FieldFlow running on http://localhost:${PORT}`);
});
