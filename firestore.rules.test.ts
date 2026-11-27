import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const blueprint = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'firebase-blueprint.json'), 'utf8')
);
const rulesContent = fs.readFileSync(
  path.resolve(process.cwd(), 'firestore.rules'),
  'utf8'
);

test('firestore.rules enforces safety net, verified email, strict key guards, and all blueprint collections', () => {
  assert.ok(rulesContent.includes("rules_version = '2';"));
  assert.ok(rulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));

  for (const collectionPath of Object.keys(blueprint.firestore)) {
    const collectionName = collectionPath.split('/')[1];
    assert.ok(
      rulesContent.includes(`match /${collectionName}/{`),
      `Missing rule block for ${collectionName}`
    );
  }
});

test('firestore.rules blocks shadow fields and client timestamp spoofing across entities', () => {
  const requiredHelpers = [
    'isValidUserProfile',
    'isValidAdminGrant',
    'isValidScan',
    'isValidCopilotBrief',
    'isValidMitigationProfile',
    'isValidAssessmentRequest',
  ];
  for (const helper of requiredHelpers) {
    assert.ok(rulesContent.includes(`function ${helper}(data)`), `Missing helper ${helper}`);
  }
  assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
  assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
  assert.ok(rulesContent.includes('affectedKeys().hasOnly('));
});
