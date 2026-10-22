import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('./documentFees.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { getDocumentPaymentNotice } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('shows the two document fees and payment at pickup', () => {
  for (const [documentType, amount] of [['Barangay Clearance', '₱20'], ['Business Clearance', '₱300']]) {
    const notice = getDocumentPaymentNotice(documentType);
    assert.ok(notice.includes(amount));
    assert.match(notice, /Barangay Hall.*pickup/i);
  }
});

test('all other offered documents are free', () => {
  for (const documentType of ['Certificate of Indigency', 'Certificate of Residency', 'Certificate of Good Moral Character', 'Barangay ID', 'Certificate of Tree Planting', 'Certificate for First-Time Job Seeker', 'Oath of Undertaking', 'Certificate of Low Income', 'Other']) {
    assert.match(getDocumentPaymentNotice(documentType), /Free.*no payment required/i);
  }
});

test('an Other request naming a paid document still shows its fee', () => {
  assert.match(getDocumentPaymentNotice('Other', ' barangay clearance '), /₱20/);
  assert.match(getDocumentPaymentNotice('Other', 'BUSINESS CLEARANCE'), /₱300/);
});
