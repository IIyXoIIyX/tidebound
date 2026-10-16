// Usage: node examples/bot.mjs https://GAME_ORIGIN MATCH_CODE
// Joins a lobby, then waits for the host to start it.
const [base,code]=process.argv.slice(2);
if(!base||!code)throw Error('Usage: node examples/bot.mjs https://GAME_ORIGIN MATCH_CODE');
async function request(path,data,token){const r=await fetch(base+path,data===undefined?{}:{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});const body=await r.json();if(!r.ok){const err=Error(body.error);err.status=r.status;throw err}return body}
const joined=await request('/api/games/'+code+'/join',{name:'HTTP Driftbot'});
const {player,token}=joined;console.log('Joined seat',player,'in',code);
while(true){const g=await request('/api/games/'+code);if(g.phase==='finished'){console.log('Finished:',g.players.map(p=>({name:p.name,score:p.score})));break}if(g.phase==='playing'&&g.turn===player){const score=m=>{const t=g.tiles.find(t=>t.id===m.tile);return m.type==='harvest'?(g.players[player].energy<5?5:0):m.type==='fortify'?1:(m.type==='raid'?5:4)+(t.kind==='beacon'?5:t.kind==='grove'?2:0)};const chosen=[...g.legalMoves].sort((a,b)=>score(b)-score(a))[0];try{await request('/api/games/'+code+'/move',{version:g.version,move:chosen},token);console.log('Move:',chosen.type,chosen.tile??'')}catch(e){if(e.status!==409)throw e}}if(g.phase==='playing'&&g.turn!==player&&Date.now()-g.updatedAt>=15000){try{await request('/api/games/'+code+'/tick',{version:g.version},token)}catch(e){if(e.status!==409)throw e}}await new Promise(r=>setTimeout(r,1200))}
