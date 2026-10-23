const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(file, mocks) {
 const module = { exports: {} };
 vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), { module, exports: module.exports, require: id => {
  if (id in mocks) return mocks[id];
  return require(id);
 }, console, URL, Date });
 return module.exports;
}
const product = {title:'Album',price:12.99,image:'/album.png'};
const requested = {id:'4:0',quantity:2,title:'Album',image:'/album.png',price:0.01};
const catalog = [{id:4,content:JSON.stringify({products:[product]})}];
test('prices come from the artist catalog rather than browser prices',()=>{
 const {priceCart}=load('utils/storeCheckout.js',{'../config/db':{}});
 assert.equal(priceCart(catalog,[requested])[0].price,12.99);
 assert.throws(()=>priceCart(catalog,[{...requested,id:'5:0'}]));
 assert.throws(()=>priceCart(catalog,[requested,requested]));
 assert.throws(()=>priceCart(catalog,[{...requested,quantity:-1}]));
 assert.throws(()=>priceCart(catalog,[{...requested,title:'Different album'}]));
});
function fulfillmentFixture(overrides={}) {
 let inserts=0, rolledBack=false;
 const checkout={id:'retry',amount:2598,order_id:null,session_id:'cs_test',payload:JSON.stringify({items:[requested]}),...overrides};
 const connection={beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{rolledBack=true},release:()=>{},query:async(sql,args)=>{
  if(sql.startsWith('SELECT')) return [[checkout]];
  if(sql.startsWith('INSERT')) {inserts++;return [{insertId:17}]}
  if(sql.startsWith('UPDATE')) checkout.order_id=args[0];
  return [{}];
 }};
 const {fulfill}=load('utils/storeCheckout.js',{'../config/db':{getConnection:async()=>connection}});
 return {fulfill,get inserts(){return inserts},get rolledBack(){return rolledBack}};
}
const session={id:'cs_test',client_reference_id:'retry',amount_total:2598,currency:'usd',status:'complete',payment_status:'paid',payment_intent:'pi_test'};
test('webhook replay and browser confirmation create one order',async()=>{
 const fixture=fulfillmentFixture();
 assert.equal(await fixture.fulfill(session,'acct_artist'),17);
 assert.equal(await fixture.fulfill(session,'acct_artist'),17);
 assert.equal(fixture.inserts,1);
});
test('unpaid sessions never create orders',async()=>{
 const fixture=fulfillmentFixture();
 assert.equal(await fixture.fulfill({...session,payment_status:'unpaid'},'acct_artist'),null);
 assert.equal(fixture.inserts,0);
});
test('wrong amount, currency and session cannot fulfill an order',async()=>{
 for(const changed of [{amount_total:1},{currency:'eur'},{id:'cs_wrong'}]) {
  const fixture=fulfillmentFixture();
  await assert.rejects(fixture.fulfill({...session,...changed},'acct_artist'));
  assert.equal(fixture.inserts,0);assert.equal(fixture.rolledBack,true);
 }
});
test('invalid Connect signature cannot reach database or fulfillment',async()=>{
 let writes=0;
 const controller=load('controllers/connectWebhookController.js',{'../config/stripe':{webhooks:{constructEvent(){throw Error('invalid')}}},'../config/db':{query:async()=>{writes++}},'../utils/storeCheckout':{fulfill:async()=>{writes++}}});
 const response={status(n){this.statusCode=n;return this},json(){}};
 await controller.handleConnectWebhook({headers:{},body:Buffer.from('{}')},response);
 assert.equal(response.statusCode,400);assert.equal(writes,0);
});
test('checkout creates a direct charge only on the server-selected artist account',async()=>{
 let saved, options, params;
 const pool={query:async(sql,args)=>{
  if(sql.startsWith('SELECT * FROM store_checkouts')) return [saved?[saved]:[]];
  if(sql.startsWith('SELECT s.id')) return [catalog];
  if(sql.startsWith('SELECT id FROM pickup')) return [[{id:1}]];
  if(sql.startsWith('INSERT IGNORE')) saved={fan_id:args[1],business_id:args[2],artist_id:args[3],stripe_account_id:args[4],request_hash:args[5],payload:args[6],amount:args[7],created_at:new Date()};
  return [{}];
 }};
 const realUtil=load('utils/storeCheckout.js',{'../config/db':pool});
 const controller=load('controllers/stripeController.js',{
  '../config/db':pool,
  '../config/stripe':{accounts:{retrieve:async()=>({id:'acct_artist',type:'standard',charges_enabled:true,payouts_enabled:true})},checkout:{sessions:{create:async(p,o)=>{params=p;options=o;return {id:'cs_test',status:'open',url:'https://checkout.stripe.com/test'}}}}},
  '../models/business':{findBusinessBySubdomain:async()=>({id:3,user_id:9,is_active:1,stripe_account_id:'acct_artist'})},
  '../utils/onboardingValidation':{siteUrl:()=> 'https://artist.example/'},
  '../utils/storeCheckout':realUtil,
 });
 const body={requestId:'0d2f6ab5-7b62-4c22-8c29-bd541b745d79',items:[{id:'4:0',quantity:2,title:'Album',image:'/album.png'}],fanInfo:{firstName:'Test',lastName:'Fan',email:'fan@example.com',phone:'5551234',street:'1 Street',city:'City',postalCode:'12345',pickupLocation:'Venue'}};
 const response={status(n){this.statusCode=n;return this},json(data){this.body=data}};
 await controller.createPaymentIntent({params:{subdomain:'artist'},fan:{id:5,artist_id:9},body},response,error=>{throw error});
 assert.equal(options.stripeAccount,'acct_artist');
 assert.equal(options.idempotencyKey,'store-'+body.requestId);
 assert.equal(params.line_items[0].price_data.unit_amount,1299);
 assert.equal(params.transfer_data,undefined);
 assert.equal(params.payment_intent_data,undefined);
 assert.equal(response.body.url,'https://checkout.stripe.com/test');
 // Reusing the same retry ID as another fan must not create another session.
 await controller.createPaymentIntent({params:{subdomain:'artist'},fan:{id:6,artist_id:9},body},response,error=>{throw error});
 assert.equal(response.statusCode,409);
});
