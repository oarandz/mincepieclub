import {validateReview} from './domain.js';
const config = window.MPC_CONFIG || {};
export const demo = !config.supabaseUrl && !config.supabasePublishableKey;
const demoKey = 'mpc-demo-v1';
let session;
try { session = JSON.parse(sessionStorage.getItem('mpc-operator') || 'null'); } catch { session=null; }
const seed = () => {
  const pies = [
    {id:'sample-1',brand:'The Village Bakery',name:'All-butter classics',box_count:6,price_pence:350,description:'Golden shortcrust pastry with a traditional spiced fruit filling.',tag:'Traditional',archived:false},
    {id:'sample-2',brand:'Winter & Co.',name:'Rich & fruity mince pies',box_count:6,price_pence:275,description:'A generous helping of fruit beneath a snowy sugar dusting.',tag:'Traditional',archived:false},
    {id:'sample-3',brand:'The Sunday Kitchen',name:'Deep-filled favourites',box_count:4,price_pence:425,description:'A deep, buttery case with plenty of festive filling.',tag:'Luxury',archived:false},
    {id:'sample-4',brand:'Little Orchard',name:'Plant-based little stars',box_count:6,price_pence:300,description:'A crisp plant-based pastry with apple, vine fruit and warming spice.',tag:'Vegan',archived:false}
  ];
  const profiles=[{id:'taster-1',name:'Alex'},{id:'taster-2',name:'Sam'},{id:'taster-3',name:'Robin'}];
  const scores=[[4.5,4,4.5,4,4],[4,4.5,4,4,4.5],[4.5,4.5,4,4.5,4],[3.5,4,3.5,4,3.5],[4,3.5,4,4,3.5],[4,4.5,4,4.5,3.5],[4,4,4,4,4],[3.5,4,4,3.5,4]];
  const reviews=scores.map((s,i)=>({id:`review-${i}`,pie_id:pies[Math.floor(i/3)].id,profile_id:profiles[i%3].id,pastry:s[0],filling:s[1],ratio:s[2],portion:s[3],dusting:s[4],comments:['Lovely buttery pastry. Definitely a cup-of-tea companion.','A good balance of fruit and spice.','A very happy festive mouthful.'][i%3],updated_at:'2026-10-15T12:00:00Z'}));
  return {pies,profiles,reviews};
};
function readDemo() {
  try {const data=JSON.parse(localStorage.getItem(demoKey));if(data?.pies && data?.profiles && data?.reviews) return data;} catch {}
  const data=seed();localStorage.setItem(demoKey,JSON.stringify(data));return data;
}
function writeDemo(data) {try{localStorage.setItem(demoKey,JSON.stringify(data));}catch{throw new Error('This device’s demo storage is full. Try a smaller photo. The shared site uses Supabase storage.');}}
function saveSession(value) {session=value;if(value) sessionStorage.setItem('mpc-operator',JSON.stringify(value));else sessionStorage.removeItem('mpc-operator');}
async function request(path,{method='GET',body,prefer,auth=true}={}) {
  if (!config.supabaseUrl || !config.supabasePublishableKey) throw new Error('Supabase configuration is incomplete. Add both public settings in config.js.');
  if (auth && session && session.expires_at < Date.now()/1000+60) {
    try {
      const fresh=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},auth:false});
      saveSession({...fresh,expires_at:Date.now()/1000+fresh.expires_in});
    } catch(error) {saveSession(null);throw new Error('Your operator session expired. Please sign in again.');}
  }
  const headers={apikey:config.supabasePublishableKey,'Content-Type':'application/json'};
  if (auth && session?.access_token) headers.Authorization=`Bearer ${session.access_token}`;
  if(prefer) headers.Prefer=prefer;
  const response=await fetch(config.supabaseUrl.replace(/\/$/,'')+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  const payload=await response.text();let data;try{data=payload?JSON.parse(payload):null;}catch{throw new Error('The database returned an unexpected response.');}
  if(!response.ok) {
    if(data?.code==='23505') throw new Error('That name already exists. Choose it from the list or use a different name.');
    throw new Error(data?.message || data?.msg || data?.error_description || 'Could not reach the shared database. Please try again.');
  }
  return data;
}
async function allRows(table) {
  const rows=[];
  for(let start=0;;start+=1000){const batch=await request(`/rest/v1/${table}?select=*&order=id&offset=${start}&limit=1000`);rows.push(...batch);if(batch.length<1000)return rows;}
}
export async function load() {if(demo)return readDemo();const [pies,profiles,reviews]=await Promise.all(['pies','profiles','reviews'].map(allRows));return {pies,profiles,reviews};}
export async function createProfile(name) {
  const row={name:name.trim()};if(!row.name || row.name.length>40)throw new Error('Use a name between 1 and 40 characters.');
  if(demo){const data=readDemo();if(data.profiles.some(p=>p.name.toLowerCase()===row.name.toLowerCase()))throw new Error('That name already exists. Choose it from the list.');row.id=crypto.randomUUID();data.profiles.push(row);writeDemo(data);return row;}
  return (await request('/rest/v1/profiles',{method:'POST',body:row,prefer:'return=representation'}))[0];
}
export async function saveReview(row) {
  validateReview(row);
  if(demo){const data=readDemo();const index=data.reviews.findIndex(r=>r.profile_id===row.profile_id && r.pie_id===row.pie_id);const saved={...row,id:index<0?crypto.randomUUID():data.reviews[index].id,updated_at:new Date().toISOString()};if(index<0)data.reviews.push(saved);else data.reviews[index]=saved;writeDemo(data);return;}
  await request('/rest/v1/reviews?on_conflict=pie_id,profile_id',{method:'POST',body:row,prefer:'resolution=merge-duplicates'});
}
export async function savePie(row,id) {
  if(demo){const data=readDemo();if(id){const i=data.pies.findIndex(p=>p.id===id);data.pies[i]={...data.pies[i],...row};}else data.pies.push({...row,id:crypto.randomUUID(),archived:false});writeDemo(data);return;}
  await request('/rest/v1/pies'+(id?`?id=eq.${encodeURIComponent(id)}`:''),{method:id?'PATCH':'POST',body:row});
}
export function photoURL(path) {
  if(!path)return null;
  if(demo && /^data:image\/(jpeg|png|webp);base64,/.test(path))return path;
  if(!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(path))return null;
  return `${config.supabaseUrl.replace(/\/$/,'')}/storage/v1/object/public/pie-photos/${path}`;
}
export async function uploadPhoto(file) {
  const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  if(!types[file.type])throw new Error('Choose a JPG, PNG or WebP photo.');
  if(file.size>5242880)throw new Error('Choose a photo smaller than 5 MB.');
  try{const image=await createImageBitmap(file);image.close();}catch{throw new Error('That file could not be opened as a photo. Try another image.');}
  if(demo)return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read that photo.'));reader.readAsDataURL(file);});
  if(!await isOperator())throw new Error('Sign in as the operator to upload photos.');
  const path=`${crypto.randomUUID()}.${types[file.type]}`;
  const response=await fetch(`${config.supabaseUrl.replace(/\/$/,'')}/storage/v1/object/pie-photos/${path}`,{method:'POST',headers:{apikey:config.supabasePublishableKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':file.type,'x-upsert':'false'},body:file,signal:AbortSignal.timeout(30000)});
  if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.message || 'Photo upload failed. Please try again.');}
  return path;
}
export async function removeReview(id) {
  if(demo){const data=readDemo();data.reviews=data.reviews.filter(r=>r.id!==id);writeDemo(data);return;}
  await request(`/rest/v1/reviews?id=eq.${encodeURIComponent(id)}`,{method:'DELETE'});
}
export async function isOperator() {if(demo)return sessionStorage.getItem('mpc-demo-operator')==='yes';if(!session)return false;return await request('/rest/v1/rpc/is_operator',{method:'POST',body:{}});}
export async function operatorLogin(password) {
  if(!password)throw new Error('Enter the operator password.');
  if(demo){sessionStorage.setItem('mpc-demo-operator','yes');return;}
  const result=await request('/functions/v1/operator-login',{method:'POST',body:{password},auth:false});
  saveSession({...result,expires_at:Date.now()/1000+result.expires_in});
}

export async function operatorLogout() {
  sessionStorage.removeItem('mpc-demo-operator');
  try{if(!demo && session)await request('/auth/v1/logout?scope=local',{method:'POST'});}finally{saveSession(null);}
}
export async function captureLogin() {
  const hash=new URLSearchParams(location.hash.slice(1));
  if(hash.has('error_description')){const message=hash.get('error_description');history.replaceState(null,'',location.pathname+'#operator');throw new Error(message);}
  if(!hash.has('access_token'))return;
  const token=hash.get('access_token'),refresh=hash.get('refresh_token');
  history.replaceState(null,'',location.pathname+'#operator');
  if(demo)return;
  saveSession({access_token:token,refresh_token:refresh,expires_at:Date.now()/1000+Number(hash.get('expires_in') || 3600)});
  try {await request('/auth/v1/user');} catch(error){saveSession(null);throw error;}
}
