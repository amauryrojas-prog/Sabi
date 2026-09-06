const { Client } = require('pg');
(async () => {
  const c = new Client({
    host: 'db.bfbqiocegzjqbogvjlux.supabase.co',
    port: 5432,
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });
  try {
    await c.connect();
    const j = await c.query(`select jobname, schedule, active, nodename from cron.job where jobname = 'refresh-china-catalog-cache';`);
    console.log('cron.job:', JSON.stringify(j.rows));
    const row = await c.query(`select count(*)::int as total, count(distinct category_id)::int as cats from public.china_catalog_cache;`);
    console.log('cache totals:', JSON.stringify(row.rows));
    await c.end();
  } catch (e) { console.error('ERR', e.message); process.exit(2); }
})();
