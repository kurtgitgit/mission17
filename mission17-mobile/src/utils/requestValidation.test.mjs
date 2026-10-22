import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('./requestValidation.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {validateDocumentRequest:doc,validateBlotterRequest:blotter,validateFeedbackRequest:feedback}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const document={docType:'Barangay Clearance',fullName:'José Dela Cruz',address:'Purok 2, Bagong Pag-asa',contact:'09123456789',purpose:'Para sa school enrollment.'};
test('accepts real multilingual names and punctuation',()=>assert.deepEqual(doc(document),{}));
test('accepts names with initials, accents, hyphens and apostrophes in both forms',()=>{
 for(const fullName of ['Juan C. dela Cruz','Anne-Marie O’Neil','María José Núñez']){
  assert.equal(doc({...document,fullName}).fullName,undefined,`document request should accept ${fullName}`);
  assert.equal(blotter({fullName,contactNumber:'09123456789',incidentType:'Disturbance',location:'Purok 2',description:'Please assist with this incident.',incidentDateSelected:true,incidentTimeSelected:true,incidentDateTime:new Date('2020-01-01')}).fullName,undefined,`blotter should accept ${fullName}`);
 }
});
test('rejects digit-bearing or unsupported-character names in document requests',()=>{
 for(const fullName of ['Juan123','Maria2 Reyes','Ana@Reyes','---','.Juan','Juan.','Ana--Reyes'])assert.ok(doc({...document,fullName}).fullName,`${fullName} should be rejected`);
});

test('accepts common name suffixes in both request forms without allowing arbitrary trailing periods',()=>{
 const report={contactNumber:'09123456789',incidentType:'Disturbance',location:'Purok 2',description:'Please assist with this incident.',incidentDateSelected:true,incidentTimeSelected:true,incidentDateTime:new Date('2020-01-01')};
 for(const fullName of ['Juan Dela Cruz Jr.','José C. Reyes Sr.','Ana Santos jr.','Juan Reyes II','Juan Reyes III']){
  assert.equal(doc({...document,fullName}).fullName,undefined,`document should accept ${fullName}`);
  assert.equal(blotter({...report,fullName}).fullName,undefined,`blotter should accept ${fullName}`);
 }
 for(const fullName of ['Juan123 Jr.','Juan Dela Cruz.','Jr. Juan Reyes','Juan Reyes Jr..']){
  assert.ok(doc({...document,fullName}).fullName,`document should reject ${fullName}`);
  assert.ok(blotter({...report,fullName}).fullName,`blotter should reject ${fullName}`);
 }
});
test('rejects digit-bearing or unsupported-character names in blotter reports',()=>{
 const report={contactNumber:'09123456789',incidentType:'Disturbance',location:'Purok 2',description:'Please assist with this incident.',incidentDateSelected:true,incidentTimeSelected:true,incidentDateTime:new Date('2020-01-01')};
 for(const fullName of ['Juan123','Maria2 Reyes','Ana@Reyes','---','.Juan','Juan.','Ana--Reyes'])assert.ok(blotter({...report,fullName}).fullName,`${fullName} should be rejected`);
});
test('blocks blank, overlong, repeated and malformed document inputs',()=>{
 for(const value of ['   ','111111','aaaaaa','A'.repeat(121)])assert.ok(doc({...document,fullName:value}).fullName);
 assert.ok(doc({...document,docType:'unlisted'}).docType);
 assert.ok(doc({...document,contact:'123'}).contact);
 assert.ok(doc({...document,purpose:'x'.repeat(501)}).purpose);
 assert.ok(doc({...document,docType:'Other',customDocumentType:''}).customDocumentType);
});
test('feedback rejects invalid category and repeated text',()=>{
 assert.ok(feedback({title:'aaaaaa',description:'12345678910',category:'invalid'}).title);
 assert.ok(feedback({title:'A drainage concern',description:'Please inspect our drainage.',category:'invalid'}).category);
 assert.deepEqual(feedback({title:'Kailangan ng tulong',description:'Pakitingnan po ang ilaw sa aming purok.',category:'Infrastructure'}),{});
});
test('blotter checks narrative, selected date/time and final combined field lengths',()=>{
 const data={fullName:'Ana Reyes',contactNumber:'09123456789',incidentType:'Disturbance',location:'Purok 2',description:'Please assist with this incident.',incidentDateSelected:true,incidentTimeSelected:true,incidentDateTime:new Date('2020-01-01')};
 assert.deepEqual(blotter(data),{});
 assert.ok(blotter({...data,incidentDateTime:new Date(Date.now()+86400000)}).incidentTime);
 assert.ok(blotter({...data,incidentDateSelected:false}).incidentDate);
 assert.ok(blotter({...data,location:'a'.repeat(245),incidentPurok:'Purok 1'}).location);
 assert.ok(blotter({...data,description:'111111111111'}).description);
});
