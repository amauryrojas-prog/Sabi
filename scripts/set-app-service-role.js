const { Client } = require('pg');
const SVC = require('fs').readFileSync(process.env.SVC_FILE || '/tmp/svc.txt', 'utf8').trim();
const PWD = process.env.SUPABASE_DB_PASSWORD;
if (!PWD) { console.error('SUPABASE_DB_PASSWORD required'); process.exit(1); }
const c = new Client({
  host: 'db.bfbqiocegzjqbogvjlux.supabase.co',
  port: 5432,
  user: 'postgres',
  password: PWD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});
(async () => {
  try {
    await c.connect();
    const escaped = SVC.replace(/'/g, "''");
    await c.query(`alter database postgres set "app.service_role_key" = '${escaped}';`);
    const { rows } = await c.query(`select jobname, schedule, active from cron.job where jobname = 'refresh-china-catalog-cache';`);
    console.log('cron job row:', JSON.stringify(rows, null, 2));
    const r2 = await c.query(`select current_setting('app.service_role_key', true) is not null as configured;`);
    console.log('config_ok:', r2.rows[0]);
    await c.end();
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(2);
  }
})();
