import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { D1Database } from '@cloudflare/workers-types';
import { googleAuthorize, verifyGoogleToken } from '../lib/auth/google.ts';
import { resolveGoogleUser } from '../lib/auth/identities.ts';
import { consumeGoogleTransaction, saveGoogleTransaction } from '../lib/auth/google-transaction.ts';
import { isOwner } from '../lib/auth/owner.ts';

const sql = new DatabaseSync(':memory:');
sql.exec('PRAGMA foreign_keys=ON');
const migrations = readdirSync('migrations').filter(file => file.endsWith('.sql')).sort();
for (const file of migrations.filter(file => !file.startsWith('0008'))) sql.exec(readFileSync('migrations/' + file, 'utf8'));
sql.exec(`
 INSERT INTO users (id,github_id,github_login) VALUES ('existing',37183343,'owner');
 INSERT INTO sessions (id,user_id,expires_at) VALUES ('session','existing',9999999999);
 INSERT INTO snippets (id,user_id,title,body) VALUES ('s','existing','title','private');
 INSERT INTO user_settings (user_id,key,value) VALUES ('existing','test','value');
 INSERT INTO workspace_documents (user_id,kind,id,body,updated_at) VALUES ('existing','workspaces','w','private',1);
 INSERT INTO feedback (id,user_id,kind,message) VALUES ('f','existing','idea','private');
`);
const tables = ['users','sessions','snippets','user_settings','workspace_documents','feedback'];
const before = tables.map(table => sql.prepare('SELECT * FROM ' + table).all());
sql.exec('BEGIN');
sql.exec(readFileSync('migrations/0008_google_identity.sql','utf8'));
sql.exec('COMMIT');
tables.forEach((table,i) => assert.deepEqual(sql.prepare('SELECT * FROM ' + table).all(),before[i],table));
assert.deepEqual(sql.prepare('PRAGMA foreign_key_check').all(),[]);

function prepare(query: string) {
 const statement = sql.prepare(query);
 let values: (string|number|null)[] = [];
 return { bind(...args: (string|number|null)[]) { values = args; return this; },
   first() { return statement.get(...values) ?? null; }, run() { return statement.run(...values); } };
}
const db = { prepare, async batch(statements: ReturnType<typeof prepare>[]) {
  sql.exec('BEGIN');
  try { const result = statements.map(statement => statement.run()); sql.exec('COMMIT'); return result; }
  catch(error) { sql.exec('ROLLBACK'); throw error; }
} } as unknown as D1Database;
const fresh = await resolveGoogleUser(db,{sub:'google-1',name:'New'},null);
assert.equal(fresh.github_id,null); assert.equal(isOwner(fresh),false);
assert.equal((await resolveGoogleUser(db,{sub:'google-1',name:'Changed'},null)).id,fresh.id);
assert.equal(sql.prepare('SELECT COUNT(*) n FROM users').get()?.n,2);
await assert.rejects(resolveGoogleUser(db,{sub:'google-1',name:'Impostor'},'existing'));
assert.equal((await resolveGoogleUser(db,{sub:'google-owner',name:'Owner'},'existing')).id,'existing');
assert.equal((await resolveGoogleUser(db,{sub:'google-owner',name:null},null)).id,'existing');
await assert.rejects(resolveGoogleUser(db,{sub:'second-google',name:null},'existing'));

await saveGoogleTransaction(db,{id:'once',nonce:'nonce',verifier:'verifier',next_path:'/es',session_id:'session',user_id:'existing',expires_at:9999999999});
assert.equal((await consumeGoogleTransaction(db,'once'))?.user_id,'existing');
assert.equal(await consumeGoogleTransaction(db,'once'),null);
await saveGoogleTransaction(db,{id:'expired',nonce:'n',verifier:'v',next_path:'/',session_id:null,user_id:null,expires_at:1});
assert.equal(await consumeGoogleTransaction(db,'expired'),null);

process.env.GOOGLE_CLIENT_ID='test-client';
process.env.GOOGLE_CLIENT_SECRET='test-only';
process.env.AUTH_BASE_URL='https://openhios.dev';
const authorize = new URL(await googleAuthorize('state','nonce','verifier'));
assert.equal(authorize.origin,'https://accounts.google.com');
assert.equal(authorize.searchParams.get('scope'),'openid profile');
assert.equal(authorize.searchParams.get('code_challenge_method'),'S256');
assert.ok(authorize.searchParams.get('code_challenge'));
const { privateKey, publicKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
const key = createLocalJWKSet({ keys:[{...jwk,kid:'test'}] });
const claims = {sub:'subject',nonce:'nonce',name:'Sample'};
async function sign(overrides: Record<string,unknown>={}) {
 return new SignJWT({...claims,iss:'https://accounts.google.com',aud:'test-client',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+300,...overrides})
 .setProtectedHeader({alg:'RS256',kid:'test'}).sign(privateKey);
}
assert.deepEqual(await verifyGoogleToken(await sign(),'nonce',key),{sub:'subject',name:'Sample'});
for(const override of [{iss:'evil'}, {aud:'evil'}, {nonce:'evil'}, {exp:1}, {azp:'evil'}, {sub:''}, {iat:1}]) {
 await assert.rejects(verifyGoogleToken(await sign(override),'nonce',key));
}
const other = await generateKeyPair('RS256');
const forged = await new SignJWT(claims).setProtectedHeader({alg:'RS256',kid:'test'}).sign(other.privateKey);
await assert.rejects(verifyGoogleToken(forged,'nonce',key));
sql.exec("DELETE FROM users WHERE id = 'existing'");
for(const table of ['sessions','snippets','user_settings','workspace_documents']) assert.equal(sql.prepare('SELECT COUNT(*) n FROM '+table).get()?.n,0);
assert.equal(sql.prepare("SELECT user_id FROM feedback WHERE id='f'").get()?.user_id,null);
assert.deepEqual(sql.prepare('PRAGMA foreign_key_check').all(),[]);
sql.close();
console.log('Google identity, JWT, one-use state, migration preservation and cascades passed.');
