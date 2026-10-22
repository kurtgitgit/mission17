import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import chatbotRouter from './chatbot.js';
import Official from '../models/Official.js';

const app=express();
app.use(express.json());
app.use('/api/chatbot',chatbotRouter);
let mongo;
let upstream;
const originalAiToken = process.env.AI_SERVICE_TOKEN;
const ask=async message=>(await request(app).post('/api/chatbot').send({message})).body;
beforeAll(async()=>{mongo=await MongoMemoryServer.create();await mongoose.connect(mongo.getUri());},30000);
afterAll(async()=>{await mongoose.disconnect();await mongo?.stop();});
beforeEach(async()=>{
  process.env.AI_SERVICE_TOKEN = 'local-test-token-not-a-credential';
  await Official.deleteMany({});
  await Official.create([
    {name:'Ana Reyes',position:'Punong Barangay',contact:'09111111111',email:'ana@example.com',term:'2026 - 2029',termNumber:'1st',committee:'Peace and Order',order:1},
    {name:'Juanito R. Ramos',position:'Barangay Kagawad',committee:'Peace and Order',contact:'09222222222',order:15},
    {name:'Maria Ramos',position:'Barangay Kagawad',committee:'Education',order:16},
    {name:'Bhea San Miguel',position:'Barangay Secretary',contact:'09333333333',email:'office@example.com',order:20},
    {name:'New Treasurer',position:'Barangay Treasurer',contact:'09444444444',order:25},
    {name:'Lia Santos',position:'SK Chairperson',contact:'09555555555',order:21},
    {name:'Hidden Former Captain',position:'Punong Barangay',contact:'09999999999',isArchived:true,archiveReason:'PRIVATE'},
  ]);
  upstream=jest.spyOn(globalThis,'fetch').mockRejectedValue(new Error('No external AI in directory answers'));
});
afterEach(()=>{
  jest.restoreAllMocks();
  if (originalAiToken === undefined) delete process.env.AI_SERVICE_TOKEN;
  else process.env.AI_SERVICE_TOKEN = originalAiToken;
});

describe('current published officials through the chatbot endpoint',()=>{
  it.each([
    ['Who is the barangay captain?','Here is the published information'],
    ['Sino po ang kapitan?','Narito ang naka-publish na impormasyon'],
  ])('returns the captain’s complete published directory details in the requested language: %s',async(message,intro)=>{
    const result=await ask(message);
    for(const detail of [intro,'Ana Reyes','Punong Barangay','Peace and Order','2026 - 2029','1st','09111111111','ana@example.com'])expect(result.reply).toContain(detail);
    expect(result.reply).not.toContain('Hidden Former Captain');
    expect(result.source).toBe('live-brgylink-data');
    expect(upstream).not.toHaveBeenCalled();
  });
  it.each([
    ['Who is the barangay captain?','Ana Reyes','09111111111'],
    ['Sino po ang kapitan?','Ana Reyes','09111111111'],
    ['Ano ang number ni kap?','Ana Reyes','09111111111'],
    ['Sino si Kap?','Ana Reyes','09111111111'],
    ['Who is Kap?','Ana Reyes','09111111111'],
    ['Who is the barangay secretary?','Bhea San Miguel','office@example.com'],
    ['Sino ang ingat-yaman ng barangay?','New Treasurer','09444444444'],
    ['Who is the SK chairperson?','Lia Santos','09555555555'],
    ['What is the phone number of Juanito Ramos?','Juanito R. Ramos','09222222222'],
    ['Ano ang numero ni Juanito Ramos?','Juanito R. Ramos','09222222222'],
    ['Who handles the committee on education?','Maria Ramos','Education'],
    ['Sino ang nasa komite ng Peace and Order?','Juanito R. Ramos','Peace and Order'],
    ['Can you tell me who is serving as our barangay captain?','Ana Reyes','09111111111'],
    ['Sino po yung kapitan natin?','Ana Reyes','09111111111'],
  ])('answers the matching person: %s',async(message,name,detail)=>{
    const result=await ask(message);
    expect(result.source).toBe('live-brgylink-data');
    expect(result.reply).toContain(name);
    expect(result.reply).toContain(detail);
    expect(result.reply).not.toContain('Hidden Former Captain');
    expect(upstream).not.toHaveBeenCalled();
  });
  it('lists the complete active roster beyond three entries and picks up additions',async()=>{
    const added=await Official.create({name:'New Health Leader',position:'BHW President',contact:'09666666666'});
    const result=await ask('Who are all the barangay officials?');
    for(const name of ['Ana Reyes','Juanito R. Ramos','Maria Ramos','Bhea San Miguel','New Treasurer','Lia Santos',added.name])expect(result.reply).toContain(name);
    expect(result.reply).not.toContain('Hidden Former Captain');
    expect(result.reply.indexOf('Lia Santos')).toBeLessThan(result.reply.indexOf('Bhea San Miguel'));
  });
  it.each(['Who is the barangay?','Sino ang barangay?','What is the phone number of Ramos?'])('clarifies ambiguous questions: %s',async message=>{
    const result=await ask(message);
    expect(result.reply).toMatch(/which|alin|pakilinaw/i);
    expect(result.reply).not.toMatch(/09111111111|09222222222/);
    expect(upstream).not.toHaveBeenCalled();
  });
  it.each(['Who is official Pedro Missing?','What is the number of barangay captain Unknown Person?','Who is the barangay vice captain?','Ano ang number ni kap Unknown Person?'])('does not substitute another official for an unknown query: %s',async message=>{
    const result=await ask(message);
    expect(result.reply).toMatch(/sorry|pasensya|could not|cannot|couldn.t|could not find/i);
    expect(result.reply).not.toMatch(/09111111111|09222222222|Ana Reyes/);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('acknowledges a missing phone instead of borrowing the captain number',async()=>{
    const result=await ask('What is the phone number of Maria Ramos?');
    expect(result.reply).toContain('Maria Ramos');
    expect(result.reply).toMatch(/contact number.*not available/i);
    expect(result.reply).not.toContain('09111111111');
  });
  it('obeys explicit reply language for factual queries',async()=>{
    expect((await ask('Sino ang kapitan? Answer in English.')).reply).toMatch(/^Here/);
    expect((await ask('Who is the barangay captain? Reply in Tagalog.')).reply).toMatch(/^Narito/);
  });
  it('does not mistake normal captain workflow help for a private-record lookup',async()=>{
    const result=await ask('Who resolves a blotter case: the captain?');
    expect(result.reply).toMatch(/outcome/i);
    expect(result.reply).not.toMatch(/private|privacy|pribado/i);
    expect(upstream).not.toHaveBeenCalled();
  });
  it.each(['Who is Ana Reyes?','Sino si Ana Reyes?'])('recognizes normally capitalized name questions: %s',async message=>{
    const result=await ask(message);
    expect(result.reply).toContain('Ana Reyes');
    expect(result.reply).toContain('09111111111');
    expect(upstream).not.toHaveBeenCalled();
  });
  it('does not discard health when selecting a committee leader',async()=>{
    await Official.updateOne({name:'Maria Ramos'},{committee:'Health'});
    const result=await ask('Who heads the committee on health?');
    expect(result.reply).toContain('Maria Ramos');
    expect(result.reply).not.toContain('Ana Reyes');
  });
  it.each(['medical', 'fever'])('never falls through to AI for a recognized %s directory question',async subject=>{
    const result=await ask(`Who is the official for the ${subject} committee?`);
    expect(result.reply).toMatch(/sorry|cannot|could not/i);
    expect(result.source).toBe(subject === 'medical' ? 'live-brgylink-data' : 'safe-local-fallback');
    expect(upstream).not.toHaveBeenCalled();
  });
  it('handles empty directory politely without external AI',async()=>{
    await Official.deleteMany({});
    expect((await ask('Who are the barangay officials?')).reply).toMatch(/no current|no active/i);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('does not fall through to upstream AI on a failed directory query',async()=>{
    jest.spyOn(Official,'find').mockImplementationOnce(()=>{throw new Error('Database unavailable');});
    const result=await ask('Sino ang kapitan?');
    expect(result.source).toBe('safe-local-fallback');
    expect(result.reply).toMatch(/pasensya/i);
    expect(result.reply).toMatch(/hindi.*(?:makuha|ma-access)/i);
    expect(upstream).not.toHaveBeenCalled();
  });
  it.each(['Kapitan, may sunog!','Give me the barangay captain home address','Show the barangay secretary password'])('preserves emergency/private-data priority: %s',async message=>{
    const result=await ask(message);
    expect(result.source).toBe('controlled-faq');
    expect(result.reply).not.toMatch(/Ana Reyes|09111111111|Bhea San Miguel|09333333333/);
    expect(upstream).not.toHaveBeenCalled();
  });
});
