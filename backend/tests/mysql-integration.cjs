const fs=require('fs');const assert=require('node:assert/strict');const mysql=require('mysql2/promise');const bcrypt=require('bcrypt');
require('dotenv').config({quiet:true});
if(!['localhost','127.0.0.1','::1'].includes(process.env.DB_HOST))throw new Error('Integration tests require a local database');
const database=`artistnation_qa_${process.pid}`;
const config={host:process.env.DB_HOST,port:process.env.DB_PORT,user:process.env.DB_USER,password:process.env.DB_PASSWORD};
async function main(){
 const admin=await mysql.createConnection(config);
 let pool;
 try {
  await admin.query(`CREATE DATABASE \`${database}\``);
  await admin.query(`USE \`${database}\``);
  const dump=fs.readFileSync('../artistnation_db.sql','utf8');
  for(const statement of dump.matchAll(/CREATE TABLE `[\s\S]*?;/g))await admin.query(statement[0]);
  for(const statement of dump.matchAll(/ALTER TABLE `[\s\S]*?;/g))await admin.query(statement[0]);
  const migration=fs.readFileSync('migrations/20261021-onboarding-transactions.sql','utf8').replace(/^--.*$/gm,'');
  for(const statement of migration.split(';').filter(s=>s.trim()))await admin.query(statement);
  process.env.DB_NAME=database;
  pool=require('../src/config/db');
  const model=require('../src/models/user');
  const {createBusiness}=require('../src/models/business');
  const {createSubscription}=require('../src/models/subscription');
  const connection=await pool.getConnection();
  const {userId,otp}=await model.createUser(connection,{fullName:'QA Artist',email:'qa@example.com',phone:'5551234567',password:'TestPassword123',stripeCustomerId:'cus_qa',stripePaymentIntentId:'sub_qa',plan:'starter',billingCycle:'monthly',billingAddress:'123 Test Street'});
  const businessId=await createBusiness(connection,{userId,businessName:'QA Music',subdomain:'qa-artist',billingAddress:'123 Test Street'});
  await createSubscription(connection,{businessId,plan:'starter',billingCycle:'monthly',stripeSubscriptionId:'sub_qa',stripeCustomerId:'cus_qa'});
  connection.release();
  assert.equal(await model.verifyOTP(userId,'000000'),false);
  assert.equal((await model.findUserById(userId)).is_verified,0);
  // Force an initialization failure after page insertion to prove rollback includes the consumed OTP.
  await admin.query('RENAME TABLE website_sections TO qa_sections_backup');
  await assert.rejects(model.verifyOTP(userId,otp));
  assert.equal((await model.findUserById(userId)).is_verified,0);
  const [[count]]=await admin.query('SELECT COUNT(*) AS total FROM website_pages');assert.equal(count.total,0);
  await admin.query('RENAME TABLE qa_sections_backup TO website_sections');
  assert.equal(await model.verifyOTP(userId,otp),true);
  assert.equal(await model.verifyOTP(userId,otp),false);
  const verified=await model.findUserById(userId);assert.equal(verified.is_verified,1);
  const [[subscription]]=await admin.query('SELECT expires_at FROM subscriptions WHERE business_id=?',[businessId]);
  assert.equal(+verified.trial_end_date,+subscription.expires_at);
  const [[before]]=await admin.query('SELECT COUNT(*) AS total FROM website_sections');
  await model.initializeWebsite(userId);
  const [[after]]=await admin.query('SELECT COUNT(*) AS total FROM website_sections');assert.equal(before.total,after.total);
  const picture='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1sAAAAASUVORK5CYII=';
  const input=require('../src/utils/onboardingValidation').validateProfile({artistName:'QA Stage Name',bio:'QA biography',city:'Atlanta',state:'Georgia',country:'United States',primaryGenre:'Pop',artistType:'Singer',yearsActive:'2',experienceLevel:'beginner',signedStatus:'independent',profilePicture:picture},true).value;
  await model.saveOnboardingDraft(userId,2,input);
  await model.completeOnboarding(userId,input);
  const complete=await model.findUserById(userId);
  assert.equal(complete.is_onboarded,1);assert.equal(complete.artist_name,'QA Stage Name');assert.match(complete.profile_picture_url,/\/uploads\/user_\d+\/profile-.*\.png$/);assert.equal(complete.onboarding_data,null);
  const relative=complete.profile_picture_url.split('/uploads/')[1];const filename=require('path').join(__dirname,'../uploads',relative);assert.ok(fs.existsSync(filename));
  const [[settings]]=await admin.query('SELECT site_name FROM website_settings WHERE user_id=?',[userId]);assert.equal(settings.site_name,'QA Stage Name');
  const [[hero]]=await admin.query("SELECT content FROM website_sections WHERE type='hero'");const content=typeof hero.content==='string'?JSON.parse(hero.content):hero.content;assert.equal(content.heading,'QA Stage Name');assert.equal(content.image,complete.profile_picture_url);
  await model.saveOnboardingDraft(userId,5,input);assert.equal((await model.findUserById(userId)).onboarding_data,null);
  await assert.rejects(model.completeOnboarding(userId,input));
  await fs.promises.unlink(filename);
  console.log('PASS: actual MySQL activation rollback, OTP reuse protection, website initialization, trial dates, image persistence, profile publication, completion and draft race guards');
 } finally {
  if(pool)await pool.end();
  await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await admin.end();
 }
}
main().catch(error=>{console.error(error.stack);process.exitCode=1});

