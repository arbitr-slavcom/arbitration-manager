import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import{createClient,type Session}from'@supabase/supabase-js';
import './style.css';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const db=url&&key?createClient(url,key):null;
const sections=[
['cases','Арбитражные дела','case_number','court_name','procedure_type','status'],
['debtors','Должники','display_name','debtor_type','inn','ogrn'],
['creditors','Кредиторы','display_name','creditor_type','inn','ogrn'],
['creditor_claims','Требования кредиторов','claim_amount','admitted_amount','paid_amount','status'],
['assets','Имущество','asset_name','asset_type','estimated_value','status'],
['documents','Документы','title','document_type','processing_status','created_at'],
['tasks','Задачи','title','due_at','priority','status'],
['hearings','Заседания','subject','scheduled_at','court_room','outcome'],
['procedural_deadlines','Процессуальные сроки','title','deadline_at','deadline_kind','status'],
['deadline_reminders','Напоминания','remind_at','channel','status','created_at'],
['financial_transactions','Финансы','transaction_date','direction','amount','currency']
]as const;
type Row=Record<string,unknown>;
const display=(x:unknown)=>x===null||x===undefined||x===''?'—':String(x);
function App(){
const[session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[section,setSection]=useState(0),[rows,setRows]=useState<Row[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[search,setSearch]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
useEffect(()=>{if(!db){setLoading(false);return;}db.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});const{data:{subscription}}=db.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[]);
useEffect(()=>{if(!db||!session){setRows([]);return;}let active=true;setBusy(true);setError('');setRows([]);db.schema('au').from(sections[section][0]).select('*').limit(200).then(({data,error})=>{if(active){setRows((data??[])as Row[]);setError(error?.message??'');setBusy(false)}});return()=>{active=false}},[section,session]);
async function signIn(e:React.FormEvent){e.preventDefault();if(!db)return;setError('');const{error}=await db.auth.signInWithPassword({email,password});if(error)setError(error.message)}
if(!db)return <main className="center"><section className="panel"><h1>Arbitration Manager</h1><p>Настройте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в .env.</p></section></main>;
if(loading)return <main className="center">Загрузка…</main>;
if(!session)return <main className="center"><form className="panel login" onSubmit={signIn}><h1>⚖ Arbitration Manager</h1><p>Вход через Supabase Auth</p><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Пароль<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button>Войти</button>{error&&<p className="error">{error}</p>}</form></main>;
const current=sections[section],cols=current.slice(2),filtered=rows.filter(r=>cols.some(k=>display(r[k]).toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru'))));
return <div className="layout"><aside><div className="brand">⚖ Arbitration Manager</div><p className="nav-title">РАБОЧЕЕ ПРОСТРАНСТВО</p><nav>{sections.map((s,i)=><button key={s[0]} className={i===section?'active':''} onClick={()=>{setSection(i);setSearch('')}}>{s[1]}</button>)}</nav><div className="account"><small>{session.user.email}</small><button onClick={()=>db.auth.signOut()}>Выйти</button></div></aside><main className="content"><header><div><span className="eyebrow">УПРАВЛЕНИЕ БАНКРОТСТВОМ</span><h1>{current[1]}</h1><p>Данные из схемы au в Supabase</p></div><span className="pill">● Авторизован</span></header><div className="stats"><div className="stat"><span>Загружено записей</span><strong>{rows.length}</strong></div><div className="stat"><span>Источник</span><strong>Supabase</strong></div><div className="stat"><span>Режим</span><strong>Просмотр</strong></div></div><section className="table-panel"><div className="table-head"><h2>Реестр</h2><input placeholder="Поиск по загруженным записям…" value={search} onChange={e=>setSearch(e.target.value)}/></div>{error?<p className="error">Ошибка загрузки: {error}. Проверьте GRANT и RLS схемы au.</p>:busy?<p className="empty">Загрузка…</p>:<div className="scroll"><table><thead><tr>{cols.map(c=><th key={c}>{c.replaceAll('_',' ')}</th>)}</tr></thead><tbody>{filtered.map((r,i)=><tr key={String(r.id??i)}>{cols.map(c=><td key={c}>{display(r[c])}</td>)}</tr>)}</tbody></table>{!filtered.length&&<p className="empty">Записей нет или доступ ограничен.</p>}</div>}</section><footer>Arbitration Manager · MVP 0.1 · Только просмотр</footer></main></div>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
