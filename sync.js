(()=>{'use strict';
const C=window.MOAVOCA_SYNC_CONFIG||{},configured=!!(C.url&&C.publishableKey);
let api=null,user=null,rev=0,enabled=false,busy=false,pending=false,timer=0,status=configured?'로그인하지 않음':'클라우드 연결 설정 필요';
const B=()=>window.moaBridge, fp=()=>JSON.stringify(B().getState());
const metaKey=()=>('moavoca:cloud:'+user.id);
function metadata(){try{return JSON.parse(localStorage.getItem(metaKey()))||{}}catch{return {}}}
function remember(){localStorage.setItem(metaKey(),JSON.stringify({rev,fp:fp()}))}
function statusSet(v){status=v;if(B()?.isSettings())B().render()}
function html(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function panel(){
 let header='<div class="panel"><h2>☁ PC · 스마트폰 동기화</h2><p class="muted">같은 이메일 계정으로 로그인하여 단어·오답·학습 기록을 공유할 수 있습니다.</p><div class="help">상태: '+html(status)+'</div>';
 if(!configured)return header+'<p class="small-note">클라우드 프로젝트 설정 전입니다. 현재 단어와 기록은 이 기기에 안전하게 저장됩니다.</p></div>';
 if(!user)return header+'<div class="formgroup"><label class="formlabel">로그인 이메일</label><input type="email" id="cloudEmail" class="field wide" placeholder="name@example.com"></div><button class="btn" data-cloud="login">로그인 이메일 받기</button><p class="small-note">받은 편지함에서 로그인 링크를 누르세요.</p></div>';
 return header+'<p class="muted">계정: '+html(user.email)+'</p><div class="actions"><button class="btn" data-cloud="check">동기화 확인</button><button class="btn secondary" data-cloud="logout">로그아웃</button>'+
 (!enabled?'<button class="btn secondary" data-cloud="local">이 기기 내용으로 서버 저장</button><button class="btn secondary" data-cloud="remote">서버 데이터를 이 기기로 가져오기</button>':'')+
 '</div><p class="small-note">기기마다 내용이 다르면 자동으로 덮어쓰지 않습니다. 서버로 저장하거나 서버에서 가져올 데이터를 직접 선택하세요. 진행 전에 백업을 권장합니다.</p></div>';
}
async function read(){const {data,error}=await api.from('moavoca_data').select('payload,revision').eq('user_id',user.id).maybeSingle();if(error)throw error;return data}
function apply(data){B().replaceState(data.payload);rev=data.revision;remember();enabled=true;statusSet('동기화 완료')}
async function connect(){
 if(!user)return;statusSet('서버 데이터 확인 중');
 try{const r=await read(),local=fp(),prev=metadata();
 if(!r){rev=0;enabled=!B().getState().words.length;statusSet(enabled?'연결 완료 · 첫 저장 대기':'서버가 비어 있습니다. 이 기기 데이터를 저장할 수 있습니다.');return}
 rev=r.revision;
 if(local===JSON.stringify(r.payload)){remember();enabled=true;statusSet('동기화 완료');return}
 if(prev.rev&&prev.fp===local){apply(r);return}
 if(!B().getState().words.length&&!B().getState().sessions.length){apply(r);return}
 enabled=false;statusSet('기기와 서버 데이터가 다릅니다. 아래에서 사용할 데이터를 선택하세요.');
 }catch(e){enabled=false;statusSet('연결 실패: '+e.message)}
}
async function push(force=false){
 if(!user||busy||(!enabled&&!force))return;
 busy=true;
 try{const r=await read(),local=B().getState(),before=fp();
 if(!force&&(r?.revision||0)!==rev){enabled=false;statusSet('서버 데이터가 바뀌었습니다. 사용할 데이터를 다시 선택하세요.');return}
 if(!r){const {error}=await api.from('moavoca_data').insert({user_id:user.id,payload:local,revision:1});if(error)throw error;rev=1;}
 else{const {data,error}=await api.from('moavoca_data').update({payload:local,revision:r.revision+1,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('revision',r.revision).select('revision');if(error)throw error;if(!data?.length){enabled=false;statusSet('다른 기기에서 변경되었습니다. 데이터 선택이 필요합니다.');return}rev=data[0].revision}
 localStorage.setItem(metaKey(),JSON.stringify({rev,fp:before}));enabled=true;statusSet('동기화 완료');
 if(fp()!==before)setTimeout(markDirty,0);
 }catch(e){statusSet('클라우드 저장 실패 · 이 기기에는 저장됨: '+e.message)}finally{busy=false}
}
function markDirty(){if(!user)return;pending=true;clearTimeout(timer);if(!enabled)return;statusSet('클라우드 저장 대기');timer=setTimeout(async()=>{pending=false;await push()},1100)}
async function pull(){if(!user||!enabled||busy||pending)return;try{if(metadata().fp!==fp()){enabled=false;statusSet('이 기기에 저장하지 않은 변경 내용이 있습니다. 데이터를 선택하세요.');return}const r=await read();if(r&&r.revision!==rev)apply(r)}catch(e){statusSet('서버 확인 실패: '+e.message)}}
async function handle(action){
 if(action==='login'){const email=document.getElementById('cloudEmail')?.value.trim();if(!email){alert('이메일을 입력하세요.');return}const {error}=await api.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});statusSet(error?'메일 발송 실패: '+error.message:'로그인 링크를 이메일로 보냈습니다.');return}
 if(action==='logout'){await api.auth.signOut();user=null;enabled=false;rev=0;statusSet('로그아웃 · 로컬 기록 유지');return}
 if(action==='local'){if(!confirm('서버 단어장을 이 기기 데이터로 덮어씁니다. 계속하시겠습니까?'))return;enabled=true;await push(true);return}
 if(action==='remote'){if(!confirm('이 기기 데이터를 서버 데이터로 교체합니다. 먼저 백업하시길 권장합니다. 계속하시겠습니까?'))return;const r=await read();if(!r){statusSet('서버에 데이터가 없습니다.');return}apply(r);return}
 if(action==='check'){await pull();if(enabled&&metadata().fp!==fp())await push();else if(enabled)statusSet('동기화 완료')}
}
async function init(){
 if(!configured)return;
 if(!/^https:\/\/[^/]+\.supabase\.co$/.test(C.url)){statusSet('서버 URL을 확인해 주세요.');return}
 if(!window.supabase?.createClient){statusSet('클라우드 라이브러리를 불러오지 못했습니다.');return}
 api=window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data,error}=await api.auth.getSession();if(error){statusSet('로그인 확인 실패: '+error.message);return}
 if(data.session?.user){user=data.session.user;await connect()}
 api.auth.onAuthStateChange((event,session)=>{setTimeout(async()=>{if(session?.user&&user?.id!==session.user.id){user=session.user;enabled=false;await connect()}else if(!session?.user&&user){user=null;enabled=false;statusSet('로그아웃됨')}},0)});
 window.addEventListener('focus',pull);document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});
}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-cloud]');if(!b)return;e.preventDefault();e.stopPropagation();if(!api)return;try{await handle(b.dataset.cloud)}catch(err){statusSet('처리 실패: '+err.message)}},true);
window.moaSync={panel,markDirty};init();
})();