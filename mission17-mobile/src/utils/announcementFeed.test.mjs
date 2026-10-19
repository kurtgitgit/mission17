import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('./announcementFeed.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {loadAnnouncementFeed}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
test('an expired notification link shows an unavailable notice while preserving current news',async()=>{
 const result=await loadAnnouncementFeed(async url=>url.endsWith('/old')?new Response('{}',{status:404}):Response.json([{_id:'current'}]),'/news','old');
 assert.match(result.message,/no longer available/i);assert.deepEqual(result.posts,[{_id:'current'}]);
});
test('a current linked post outside the feed page is still readable',async()=>{
 const result=await loadAnnouncementFeed(async url=>Response.json(url.endsWith('/linked')?{_id:'linked',title:'Current notice'}:[{_id:'other'}]),'/news','linked');
 assert.equal(result.posts[0]._id,'linked');assert.equal(result.message,'');
});
