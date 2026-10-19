import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLatestRequest} from './latestRequest.js';
test('late response from a previous archive view cannot commit data or loading state',()=>{
 const requests=createLatestRequest();
 const current=requests.begin();const archived=requests.begin();
 assert.equal(requests.isCurrent(current),false);
 assert.equal(requests.isCurrent(archived),true);
 requests.invalidate();assert.equal(requests.isCurrent(archived),false);
});
