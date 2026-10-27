const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const dates = require('../src/utils/billingDates');
function load(file, mocks) {
 const module = { exports: {} };
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),{module,exports:module.exports,require:id=>{
  if(id in mocks) return mocks[id];
  if(id==='./billingDates') return dates;
  if(id==='./billingClock') return { billingNow: async () => Date.now() };
  throw new Error('Unmocked dependency: '+id);
 },Date,console});
 return module.exports;
}
test('paid-through and thirty-day grace boundaries are exact',()=>{
 const end=Date.UTC(2026,0,1);
 assert.equal(dates.lifecycle(new Date(end),end-1).state,'active');
 assert.equal(dates.lifecycle(new Date(end),end).state,'grace');
 assert.equal(dates.lifecycle(new Date(end),end+30*dates.DAY-1).state,'grace');
 assert.equal(dates.lifecycle(new Date(end),end+30*dates.DAY).state,'expired');
 assert.equal(dates.lifecycle(null,end).state,'unavailable');
});
test('clock time is sandbox-only and normal accounts keep real time',async()=>{
 const previousFlag=process.env.STRIPE_TEST_CLOCK_ENABLED;
 const previousKey=process.env.STRIPE_SECRET_KEY;
 let customer={livemode:false,test_clock:'clock_test'};
 let clock={status:'ready',frozen_time:1900000000};
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/utils/billingClock.js'),'utf8'),{module,exports:module.exports,process,Date,require:id=>id==='../config/stripe'?{customers:{retrieve:async()=>customer},testHelpers:{testClocks:{retrieve:async()=>clock}}}:dates});
 const {billingNow}=module.exports;
 try {
  process.env.STRIPE_TEST_CLOCK_ENABLED='false';
  assert.ok(Math.abs(await billingNow('cus_test')-Date.now())<1000);
  process.env.STRIPE_TEST_CLOCK_ENABLED='true';process.env.STRIPE_SECRET_KEY='sk_test_fixture';
  assert.equal(await billingNow('cus_test'),1900000000000);
  clock.status='advancing';await assert.rejects(billingNow('cus_test'));
  clock.status='ready';customer={livemode:false,test_clock:null};
  assert.ok(Math.abs(await billingNow('cus_test')-Date.now())<1000);
  customer={livemode:true,test_clock:'clock_test'};await assert.rejects(billingNow('cus_test'));
  process.env.STRIPE_SECRET_KEY='sk_live_fixture';await assert.rejects(billingNow('cus_test'));
 } finally {
  if(previousFlag===undefined)delete process.env.STRIPE_TEST_CLOCK_ENABLED;else process.env.STRIPE_TEST_CLOCK_ENABLED=previousFlag;
  if(previousKey===undefined)delete process.env.STRIPE_SECRET_KEY;else process.env.STRIPE_SECRET_KEY=previousKey;
 }
});
test('only paid recurring invoice lines grant entitlement, including zero-dollar paid renewals',()=>{
 const invoice={status:'paid',parent:{subscription_details:{subscription:'sub_1'}},lines:{data:[{parent:{subscription_item_details:{subscription:'sub_1',proration:false}},period:{end:1000}}]}};
 assert.equal(dates.paidInvoiceEnd(invoice,'sub_1'),1000);
 assert.equal(dates.paidInvoiceEnd({...invoice,status:'open'},'sub_1'),0);
 assert.equal(dates.paidInvoiceEnd(invoice,'sub_other'),0);
 invoice.lines.data[0].parent.subscription_item_details.proration=true;
 assert.equal(dates.paidInvoiceEnd(invoice,'sub_1'),0);
});
test('modern item billing dates are read without inventing thirty extra days',()=>{
 assert.equal(dates.subscriptionPeriodEnd({items:{data:[{current_period_end:2000}]}}),2000);
 assert.equal(dates.subscriptionPeriodEnd({}),null);
});
function syncFixture({status='active',cancel=false,paidEnd,trialEnd,oldEnd,invoicesPaid=true,customer='cus_1'}={}) {
 const statements=[];
 const local={id:1,business_id:2,stripe_subscription_id:'sub_1',stripe_customer_id:'cus_1',expires_at:oldEnd,last_synced_at:oldEnd?new Date():null};
 const stripe={subscriptions:{retrieve:async()=>({id:'sub_1',customer,status,cancel_at_period_end:cancel,trial_end:trialEnd,items:{data:[{current_period_end:Math.floor(Date.now()/1000)+365*86400}]}})},invoices:{list:async()=>({data:paidEnd?[{id:'in_1',status:invoicesPaid?'paid':'open',customer:'cus_1',subscription:'sub_1',currency:'usd',amount_paid:1000,lines:{data:[{type:'subscription',subscription:'sub_1',period:{end:paidEnd}}]}}]:[]})}};
 const connection={query:async(sql,args)=>{
  statements.push({sql,args});
  if(sql.startsWith('SELECT session_id')) return [[]];
  if(sql.startsWith('SELECT * FROM subscriptions')) return [[local]];
  if(sql.startsWith('SELECT id FROM invoice_history')) return [[]];
  return [{}];
 }};
 const service=load('utils/billingLifecycle.js',{'../config/db':{},'../config/stripe':stripe});
 return {service,connection,statements};
}
test('cancellation preserves the paid-through date instead of granting or removing days',async()=>{
 const end=Math.floor(Date.now()/1000)+7*86400;
 const f=syncFixture({status:'canceled',paidEnd:end});
 const state=await f.service.syncBusiness(f.connection,{id:2,user_id:3,is_verified:1});
 assert.equal(state.paidThrough.getTime(),end*1000);assert.equal(state.state,'active');
 assert.equal(state.subscriptions[0].status,'pending_cancel');
});
test('failed renewal does not revoke an already paid period or extend it to the next unpaid period',async()=>{
 const end=new Date(Date.now()+2*dates.DAY);
 const f=syncFixture({status:'past_due',paidEnd:Math.floor(Date.now()/1000)+32*86400,invoicesPaid:false,oldEnd:end});
 const state=await f.service.syncBusiness(f.connection,{id:2,user_id:3,is_verified:1});
 assert.equal(state.paidThrough.getTime(),end.getTime());assert.equal(state.state,'active');
});
test('unknown customer or missing entitlement blocks reconciliation and automatic archival',async()=>{
 for(const options of [{customer:'cus_other'},{}]) {
  const f=syncFixture(options);
  await assert.rejects(f.service.syncBusiness(f.connection,{id:2,user_id:3,is_verified:1}));
  assert.ok(!f.statements.some(s=>s.sql.startsWith('UPDATE businesses')));
 }
});
test('trial end grants the actual Stripe trial and needs no paid invoice',async()=>{
 const end=Math.floor(Date.now()/1000)+3*86400;
 const f=syncFixture({status:'trialing',trialEnd:end});
 const state=await f.service.syncBusiness(f.connection,{id:2,user_id:3,is_verified:1});
 assert.equal(state.paidThrough.getTime(),end*1000);assert.equal(state.subscriptions[0].status,'trialing');
});
test('business mutex rolls back failures and releases the connection',async()=>{
 const calls=[];
 const connection={beginTransaction:async()=>calls.push('begin'),commit:async()=>calls.push('commit'),rollback:async()=>calls.push('rollback'),release:()=>calls.push('release'),query:async(sql)=>{
  calls.push(sql); if(sql.startsWith('SELECT GET_LOCK'))return [[{acquired:1}]];
  if(sql.startsWith('SELECT b.'))return [[{id:2}]];return [[]];
 }};
 const service=load('utils/billingLifecycle.js',{'../config/db':{getConnection:async()=>connection},'../config/stripe':{}});
 await assert.rejects(service.withBusinessLock(2,async()=>{throw new Error('failure')}));
 assert.ok(calls.includes('rollback'));assert.ok(!calls.includes('commit'));
 assert.ok(calls.some(c=>c.startsWith('SELECT RELEASE_LOCK')));assert.equal(calls.at(-1),'release');
});
test('paid recovery during grace prevents archival and admin accounts are excluded',async()=>{
 let deletes=0;
 const archive=load('utils/archiveAccount.js',{'../config/stripe':{},'./billingLifecycle':{syncBusiness:async()=>({state:'active'})}});
 assert.equal(await archive.archiveAccount({query:async()=>{deletes++}},{id:2,is_admin:0}),false);
 assert.equal(await archive.archiveAccount({query:async()=>{deletes++}},{id:2,is_admin:1}),false);
 assert.equal(deletes,0);
});
test('archive contains only account and billing data and releases identifiers last',async()=>{
 const statements=[];
 const stripe={subscriptions:{},invoices:{}};
 const archive=load('utils/archiveAccount.js',{'../config/stripe':stripe,'./billingLifecycle':{syncBusiness:async()=>({state:'expired',paidThrough:new Date(0),subscriptions:[]})}});
 const connection={query:async(sql,args)=>{
  statements.push({sql,args});
  if(sql.startsWith('SELECT session_id'))return [[]];
  if(sql.startsWith('SELECT id,full_name'))return [[{id:3,email:'old@example.com',full_name:'Old account'}]];
  if(sql.startsWith('SELECT * FROM subscriptions'))return [[{id:4,stripe_subscription_id:'sub_old'}]];
  if(sql.startsWith('SELECT ih.'))return [[{id:5,stripe_invoice_id:'in_old'}]];
  return [{}];
 }};
 assert.equal(await archive.archiveAccount(connection,{id:2,user_id:3,subdomain:'old',business_name:'Old site'}),true);
 const insert=statements.find(s=>s.sql.startsWith('INSERT INTO expired_account_records'));
 assert.ok(insert);assert.ok(insert.args[4].includes('old@example.com'));
 assert.ok(!insert.args[4].includes('password'));assert.ok(!insert.args[4].includes('website'));
 assert.ok(statements.findIndex(s=>s===insert)<statements.findIndex(s=>s.sql.startsWith('DELETE')));
 assert.equal(statements.at(-1).sql,'DELETE FROM users WHERE id=? AND is_admin=0');
});
test('invoice documents are restricted to the authenticated invoice owner',async()=>{
 let customer='cus_owner', owned=true, requests=0;
 const controller=load('controllers/billingController.js',{
  '../config/db':{query:async(sql,args)=>{assert.ok(sql.includes('b.user_id=?'));assert.equal(args[1],7);return [owned?[{stripe_invoice_id:'in_owned',stripe_customer_id:'cus_owner'}]:[]]}},
  '../config/stripe':{invoices:{retrieve:async()=>{requests++;return {customer,invoice_pdf:'https://pay.stripe.com/invoice/pdf'}}}},
  '../utils/billingLifecycle':{},'../utils/billingDates':dates,crypto:require('crypto')
 });
 const response=()=>({statusCode:200,status(n){this.statusCode=n;return this},sendStatus(n){this.statusCode=n;return this},json(data){this.body=data;return this}});
 let res=response();
 await controller.getInvoiceDocument({params:{id:'10'},user:{id:7}},res);
 assert.equal(res.body.type,'pdf');assert.equal(res.body.available,true);
 customer='cus_other';res=response();
 await controller.getInvoiceDocument({params:{id:'10'},user:{id:7}},res);
 assert.equal(res.statusCode,403);
 owned=false;res=response();
 await controller.getInvoiceDocument({params:{id:'11'},user:{id:7}},res);
 assert.equal(res.statusCode,404);assert.equal(requests,2);
});
