require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./src/config/db');
const { withBusinessLock, syncBusiness } = require('./src/utils/billingLifecycle');
const { archiveAccount } = require('./src/utils/archiveAccount');
const fs = require('fs/promises');
const path = require('path');

async function cleanupFiles() {
 const [rows] = await pool.query('SELECT user_id FROM billing_file_cleanup LIMIT 100');
 for (const row of rows) {
  if (!Number.isSafeInteger(row.user_id) || row.user_id <= 0) throw new Error('Invalid upload owner');
  const root = path.resolve(__dirname, 'uploads');
  const target = path.resolve(root, `user_${row.user_id}`);
  if (path.dirname(target) !== root) throw new Error('Unsafe upload path');
  await fs.rm(target, { recursive: true, force: true });
  await pool.query('DELETE FROM billing_file_cleanup WHERE user_id=?',[row.user_id]);
 }
}
async function cycle() {
 let cursor = 0;
 while (true) {
  const [businesses] = await pool.query('SELECT b.id FROM businesses b JOIN users u ON u.id=b.user_id WHERE u.is_admin=0 AND b.id>? ORDER BY b.id LIMIT 100',[cursor]);
  if (!businesses.length) break;
  for (const business of businesses) {
   cursor=business.id;
   try {
    const archived = await withBusinessLock(business.id,async(connection,current)=>{
     const state=await syncBusiness(connection,current);
     if (state.state==='expired' && process.env.BILLING_ARCHIVE_ENABLED==='true') {
      return archiveAccount(connection,current);
     }
     if (state.state === 'expired') console.log(`Business ${current.id} is eligible for archival; automatic removal is disabled`);
     return false;
    });
    if (archived) console.log(`Archived expired business ${business.id}`);
   } catch(error) { console.error(`Billing reconciliation blocked for business ${business.id}: ${error.message}`); }
  }
 }
 if (process.env.BILLING_ARCHIVE_ENABLED==='true') await cleanupFiles();
}
async function run() {
 try { await cycle(); } catch(error) { console.error('Billing worker cycle failed:',error.message); }
 if (process.argv.includes('--once')) { await pool.end(); return; }
 setTimeout(run, 5 * 60 * 1000);
}
run();
