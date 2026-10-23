const { test } = require('node:test');
process.env.JWT_SECRET = 'isolated-test-secret-not-for-production';
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');
const { signupSchema, validateProfile, siteUrl } = require('../src/utils/onboardingValidation');
const { decodeProfilePicture } = require('../src/utils/profilePicture');
const picture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1sAAAAASUVORK5CYII=';
const profile = { artistName:'Artist',bio:'My bio',city:'Atlanta',state:'Georgia',country:'United States',primaryGenre:'Pop',artistType:'Singer',yearsActive:'1',experienceLevel:'beginner',signedStatus:'independent',profilePicture:picture };
const signup = { fullName:'Test Artist',email:'artist@example.com',phone:'5551234567',password:'password123',businessName:'Artist',subdomain:'test-artist',billingAddress:'123 Main St',paymentMethodId:'pm_test123',plan:'starter',billingCycle:'monthly' };
function load(file, mocks) {
 const filename=path.resolve(__dirname,file), module={exports:{}};
 const actual=createRequire(filename);
 const sandbox={module,exports:module.exports,require:id=>Object.hasOwn(mocks,id)?mocks[id]:actual(id),process,console:{log(){},error(){}},Buffer,URL,setTimeout};
 vm.runInNewContext(fs.readFileSync(filename,'utf8'),sandbox,{filename}); return module.exports;
}
function response(){return {statusCode:200,status(n){this.statusCode=n;return this},json(body){this.body=body;return this}};}
function controller(options={}) {
 const calls=[];
 const user={id:1,email:signup.email,password_hash:'hash',is_verified:1,is_onboarded:1,is_admin:0,...options.user};
 const conn={beginTransaction:async()=>calls.push('begin'),rollback:async()=>calls.push('rollback'),commit:async()=>calls.push('commit'),release:()=>calls.push('release'),execute:async()=>[[]]};
 const stripe={prices:{retrieve:async()=>({active:true,recurring:{interval:'month',interval_count:1}})},customers:{create:async()=>({id:'cus_test'})},paymentIntents:{create:async()=>({id:'pi_test',status:'succeeded'}),retrieve:async()=>({id:'pi_test',status:options.authenticationRequired?'requires_action':'succeeded',client_secret:'test-only-secret'})},subscriptions:{create:async data=>{calls.push(data.items[0].price);return {id:'sub_test',trial_end:Math.floor(Date.now()/1000)+14*86400}},cancel:async()=>calls.push('cancel')},refunds:{create:async()=>calls.push('refund')}};
 const model={findUserByEmail:async()=>user,findUserById:async()=>user,verifyOTP:async()=>true,completeOnboarding:async()=>calls.push('complete'),saveOnboardingDraft:async()=>calls.push('save'),getOnboardingDraft:async()=>({onboarding_step:0,onboarding_data:null}),createUser:async()=>{if(options.dbFailure)throw new Error('DB write failed');return {userId:1,otp:'123456'}}};
 const c=load('../src/controllers/authController.js',{'../utils/signupVerification':{issueVerificationToken:()=> 'verification-context'},'../utils/userSessions':{issueUserToken:async()=> 'access-token'},'bcrypt':{hash:async()=> 'dummy',compare:async()=>options.passwordValid!==false},'jsonwebtoken':{sign:()=> 'access-token'},'../config/stripe':stripe,'../config/db':{getConnection:async()=>conn},'../models/user':model,'../models/business':{findBusinessByUserId:async()=>options.noBusiness?null:{subdomain:'test-artist'},createBusiness:async()=>1},'../models/subscription':{createSubscription:async()=>1},'../utils/mailer':Object.fromEntries(['sendOTPEmail','sendPaymentSuccessEmail','sendPaymentFailureEmail','sendTrialStartedEmail'].map(k=>[k,async()=>{}]))});
 return {c,calls};
}
for(const name of ['www','admin','api','test','unavailable'])test(`reject reserved subdomain ${name}`,()=>assert.ok(signupSchema.validate({...signup,subdomain:name}).error));
test('normalize signup email and phone',()=>{const r=signupSchema.validate({...signup,email:' ARTIST@EXAMPLE.COM ',phone:'(555) 123-4567'});assert.ifError(r.error);assert.equal(r.value.email,signup.email);assert.equal(r.value.phone,signup.phone)});
test('reject malformed signup and missing billing address',()=>{assert.ok(signupSchema.validate({...signup,billingAddress:''}).error);assert.ok(signupSchema.validate({...signup,subdomain:'bad.name'}).error)});
test('validate complete profile and partial drafts',()=>{assert.ifError(validateProfile(profile,true).error);assert.ifError(validateProfile({}).error);assert.ok(validateProfile({},true).error)});
test('reject invalid profile fields and fake image',()=>{assert.ok(validateProfile({...profile,yearsActive:'100'},true).error);assert.ok(validateProfile({...profile,profilePicture:'data:image/png;base64,aGVsbG8='},true).error);assert.ok(validateProfile({...profile,experienceLevel:'invalid'},true).error)});
test('signed artist must provide label and management',()=>assert.ok(validateProfile({...profile,signedStatus:'signed'},true).error));
test('reject oversized and mismatched images',()=>{assert.throws(()=>decodeProfilePicture('data:image/png;base64,'+Buffer.alloc(2100000).toString('base64')));assert.throws(()=>decodeProfilePicture(picture.replace('image/png','image/jpeg')))});
test('live URLs support environment template',()=>{assert.equal(siteUrl({subdomain:'test-artist'}),'https://test-artist.artistnation.studio/');process.env.ARTIST_SITE_URL_TEMPLATE='http://{subdomain}.localhost:3001';try{assert.equal(siteUrl({subdomain:'test-artist'}),'http://test-artist.localhost:3001/')}finally{delete process.env.ARTIST_SITE_URL_TEMPLATE}assert.throws(()=>siteUrl(null));assert.throws(()=>siteUrl({subdomain:'admin'}))});
for(const [name,user,destination] of [['artist',{is_onboarded:1},'/admin/dashboard'],['unfinished artist',{is_onboarded:0},'/onboarding'],['admin',{is_admin:1},'/admin/dashboard']])test(`login redirects ${name}`,async()=>{const {c}=controller({user});const res=response();await c.login({body:{...signup,portal:user.is_admin?'admin':'artist'}},res,e=>{throw e});assert.equal(res.body.user.redirectUrl,destination)});
test('unverified login has no access token',async()=>{const {c}=controller({user:{is_verified:0}});const res=response();await c.login({body:signup},res,e=>{throw e});assert.equal(res.statusCode,403);assert.equal(res.body.code,'EMAIL_UNVERIFIED');assert.equal(res.body.token,undefined)});
test('invalid password is rejected',async()=>{const {c}=controller({passwordValid:false});const res=response();await c.login({body:signup},res,e=>{throw e});assert.equal(res.statusCode,401)});
test('completion saves then redirects to live site',async()=>{const {c,calls}=controller({user:{is_onboarded:0}});const res=response();await c.completeOnboarding({user:{id:1},body:profile},res,e=>{throw e});assert.ok(calls.includes('complete'));assert.equal(res.body.redirectUrl,'https://test-artist.artistnation.studio/')});
test('completion requires configured business',async()=>{const {c,calls}=controller({user:{is_onboarded:0},noBusiness:true});let error;await c.completeOnboarding({user:{id:1},body:profile},response(),e=>error=e);assert.ok(error);assert.ok(!calls.includes('complete'))});
for(const name of ['getOnboardingDraft','saveOnboardingDraft','completeOnboarding'])test(`${name} rejects unverified account`,async()=>{const {c}=controller({user:{is_verified:0,is_onboarded:0}});const res=response();await c[name]({user:{id:1},body:name==='completeOnboarding'?profile:{step:0,data:{}}},res,e=>{throw e});assert.equal(res.statusCode,403)});
test('invalid draft step is rejected',async()=>{const {c,calls}=controller({user:{is_onboarded:0}});const res=response();await c.saveOnboardingDraft({user:{id:1},body:{step:999,data:{}}},res,e=>{throw e});assert.equal(res.statusCode,400);assert.ok(!calls.includes('save'))});
test('DB failure cancels subscription and refunds setup fee',async()=>{process.env.STRIPE_MONTHLY_PRICE_ID='price_starter';const {c,calls}=controller({dbFailure:true});let error;await c.signup({body:signup},response(),e=>error=e);assert.ok(error);assert.ok(calls.includes('refund'));assert.ok(calls.includes('cancel'));assert.ok(calls.includes('rollback'));assert.ok(calls.includes('release'))});
test('selected plan uses its own price',async()=>{process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID='price_professional';const {c,calls}=controller();const res=response();await c.signup({body:{...signup,plan:'professional'}},res,e=>{throw e});assert.equal(res.statusCode,201);assert.ok(calls.includes('price_professional'))});
test('reset JWT cannot authenticate protected endpoints',async()=>{const jwt=require('jsonwebtoken');process.env.JWT_SECRET='test-only-secret';const auth=require('../src/middleware/auth');const res=response();let allowed=false;await auth({headers:{authorization:'Bearer '+jwt.sign({id:1,purpose:'reset'},process.env.JWT_SECRET)}},res,()=>allowed=true);assert.equal(res.statusCode,401);assert.equal(allowed,false)});
test('legacy access JWT without a server session is rejected',async()=>{const jwt=require('jsonwebtoken');const auth=require('../src/middleware/auth');let allowed=false;const res=response();await auth({headers:{authorization:'Bearer '+jwt.sign({id:1,purpose:'access'},process.env.JWT_SECRET)}},res,()=>allowed=true);assert.equal(allowed,false);assert.equal(res.statusCode,401)});

test("signup requests card authentication before creating a subscription",async()=>{process.env.STRIPE_MONTHLY_PRICE_ID="price_starter";const {c,calls}=controller({authenticationRequired:true});const res=response();await c.signup({body:signup},res,e=>{throw e});assert.equal(res.statusCode,402);assert.equal(res.body.code,"PAYMENT_AUTHENTICATION_REQUIRED");assert.ok(calls.includes("rollback"));assert.ok(!calls.includes("price_starter"));assert.ok(!calls.includes("refund"));});
