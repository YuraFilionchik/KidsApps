// Проверка правил безопасности Firestore на эмуляторе: npm run test:rules
'use strict';
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp } = require('firebase/firestore');

let env;

test.before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-kidsapp',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8') },
  });
});
test.after(async () => { await env.cleanup(); });
test.beforeEach(async () => { await env.clearFirestore(); });

const profile = (rev, over = {}) => ({
  data: { id: 'p1', name: 'Маша', fish: 10 },
  rev, updatedAt: serverTimestamp(), updatedBy: 'd1', schemaVersion: 1, pinHash: 'abc', ...over,
});
const P = 'families/alice/profiles/p1';

test('гость без входа не читает и не пишет', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, P)));
  await assertFails(setDoc(doc(db, P), profile(1)));
  await assertFails(setDoc(doc(db, 'anything/else'), { x: 1 }));
});

test('владелец семьи создаёт, читает и удаляет свой профиль', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(doc(db, 'families/alice'), { createdAt: serverTimestamp() }));
  await assertSucceeds(setDoc(doc(db, P), profile(1)));
  await assertSucceeds(getDoc(doc(db, P)));
  await assertSucceeds(deleteDoc(doc(db, P)));
});

test('чужая семья недоступна', async () => {
  await assertSucceeds(setDoc(doc(env.authenticatedContext('alice').firestore(), P), profile(1)));
  const bob = env.authenticatedContext('bob').firestore();
  await assertFails(getDoc(doc(bob, P)));
  await assertFails(setDoc(doc(bob, P), profile(2)));
  await assertFails(deleteDoc(doc(bob, P)));
  await assertFails(getDoc(doc(bob, 'families/alice')));
});

test('ревизия растёт строго на 1', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(doc(db, P), profile(1)));
  await assertFails(setDoc(doc(db, P), profile(1)));   // повтор той же ревизии — устаревшая запись
  await assertFails(setDoc(doc(db, P), profile(5)));   // перескок
  await assertSucceeds(setDoc(doc(db, P), profile(2)));
});

test('лишние поля, чужое время и длинное имя отклоняются', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db, P), profile(1, { hacked: true })));
  await assertFails(setDoc(doc(db, P), profile(1, { updatedAt: Timestamp.fromMillis(0) })));
  await assertFails(setDoc(doc(db, P), profile(1, { data: { name: 'О'.repeat(15) } })));
  await assertFails(setDoc(doc(db, P), profile(1, { rev: '1' })));
});

test('резервные копии: только формат даты в имени', async () => {
  const db = env.authenticatedContext('alice').firestore();
  const snap = { data: { name: 'Маша' }, rev: 1, createdAt: serverTimestamp(), expireAt: Timestamp.fromMillis(Date.now() + 864e5) };
  await assertSucceeds(setDoc(doc(db, P + '/snapshots/2026-10-12'), snap));
  await assertFails(setDoc(doc(db, P + '/snapshots/latest'), snap));
  await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(), P + '/snapshots/2026-10-12')));
});
