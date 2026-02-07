import { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import './App.css'

const STORAGE_KEY = 'learning-tracker-data'

const defaultData = {
  topics: [{
    id: 'philosophy', name: 'Philosophy', description: 'Deep exploration of fundamental questions',
    status: 'in_progress', icon: '🧠', isFavorite: true, streak: 5,
    entryQuestions: [
      { id: 'q1', text: 'What is good? (fixed vs relative)' },
      { id: 'q2', text: 'What is meaning? (found vs created)' }
    ],
    positions: {
      morality: 'Contextual relativism. We\'re shaped by context but can still condemn within our own context.',
      meaning: 'Found, not chosen. We discover what resonates. But we choose whether to look.'
    },
    keyIdeas: [
      { id: 'i1', text: 'Metaphysics asks "What is real?" Ethics asks "What is good?"' },
      { id: 'i2', text: 'Ethics can stand alone from metaphysics. Facts don\'t imply values.' },
      { id: 'i3', text: 'Ontology is a subset of metaphysics.' }
    ],
    connections: [],
    quotes: [],
    philosophers: [
      { id: 'plato', name: 'Plato', idea: 'Forms/Ideas', position: 'Objective realism' },
      { id: 'aristotle', name: 'Aristotle', idea: 'Golden mean', position: 'Virtue ethics' },
      { id: 'kant', name: 'Kant', idea: 'Categorical imperative', position: 'Deontology' },
      { id: 'hume', name: 'Hume', idea: 'Is-ought problem', position: 'Sentimentalism' },
      { id: 'nietzsche', name: 'Nietzsche', idea: 'Will to power', position: 'Nihilism/Affirmation' }
    ],
    thoughtExperiments: [
      { id: 't1', name: 'Trolley Problem', description: 'Pull lever to save 5 but kill 1?', implications: ['Utilitarianism vs deontology', 'Active vs passive harm'] },
      { id: 't2', name: 'Ship of Theseus', description: 'Replaced planks = same ship?', implications: ['Personal identity', 'Continuity vs composition'] },
      { id: 't3', name: 'Experience Machine', description: 'Infinite pleasure vs reality?', implications: ['Hedonism', 'Authenticity'] }
    ],
    phases: [
      { id: 1, name: 'The Map', status: 'complete' },
      { id: 2, name: 'Ethics Deep Dive', status: 'in_progress' },
      { id: 3, name: 'Meaning and Existence', status: 'pending' }
    ],
    tags: ['philosophy', 'ethics', 'morality'],
    createdAt: '2026-02-03'
  }],
  cards: [
    { id: 'c1', topicId: 'philosophy', front: 'Metaphysics vs Ethics?', back: 'Metaphysics asks "What is real?" Ethics asks "What is good?"', interval: 6, reviews: 3 },
    { id: 'c2', topicId: 'philosophy', front: 'Ethics standalone?', back: 'Yes. Facts don\'t imply values.', interval: 6, reviews: 2 },
    { id: 'c3', topicId: 'philosophy', front: 'What is Ontology?', back: 'Subset of metaphysics: "What categories exist?"', interval: 6, reviews: 2 }
  ],
  quotes: [
    { id: 'q1', text: 'The unexamined life is not worth living.', author: 'Socrates', category: 'wisdom' },
    { id: 'q2', text: 'He who has a why can bear almost any how.', author: 'Nietzsche', category: 'meaning' },
    { id: 'q3', text: 'Morality is how we make ourselves worthy of happiness.', author: 'Kant', category: 'ethics' }
  ],
  dailyPrompts: [],
  templates: [
    { id: 't1', name: 'Philosophy', icon: '🧠', phases: ['The Map', 'Deep Dive', 'Synthesis'] },
    { id: 't2', name: 'Coding', icon: '💻', phases: ['Basics', 'Practice', 'Build'] },
    { id: 't3', name: 'Language', icon: '🌍', phases: ['Foundation', 'Expansion', 'Fluency'] },
    { id: 't4', name: 'Book Study', icon: '📚', phases: ['Reading', 'Reflection', 'Application'] },
    { id: 't5', name: 'Empty', icon: '📝', phases: [] }
  ],
  settings: { darkMode: true, dailyGoal: 10, keyboardShortcuts: true },
  badges: { streakDays: 5, totalCards: 3, topicsCreated: 1, quotesSaved: 3, experimentsTried: 0 }
}

export default function App() {
  const [data, setData] = useState(defaultData)
  const [tab, setTab] = useState('topics')
  const [topic, setTopic] = useState(null)
  const [quizMode, setQuizMode] = useState(false)
  const [quizIdx, setQuizIdx] = useState(0)
  const [showAns, setShowAns] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(null)
  const [undoStack, setUndoStack] = useState([])
  const [notif, setNotif] = useState(null)

  useEffect(() => {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) { try { const p = JSON.parse(s); setData(p); if (p.topics?.[0]) setTopic(p.topics[0]) } catch {} }
  }, [])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [data])

  const notifShow = (m) => { setNotif(m); setTimeout(() => setNotif(null), 3000) }

  const pushUndo = (act) => { setUndoStack(u => [...u.slice(-4), act]) }
  const doUndo = () => { if (undoStack.length) { undoStack[undoStack.length-1]?.(); setUndoStack(u => u.slice(0,-1)); notifShow('Undo') } }

  const grade = (id, q) => {
    const c = data.cards.find(x => x.id === id)
    if (!c) return
    let int = c.interval, eas = Math.max(1.3, c.ease + (q-3)*0.1)
    if (q >= 3) { int = c.interval===1 ? 6 : Math.round(c.interval * eas) }
    else { int = 1; eas = Math.max(1.3, eas-0.2) }
    const up = data.cards.map(x => x.id===id ? {...x, interval: int, ease: eas, reviews: (x.reviews||0)+1, nextReview: Date.now()+int*86400000} : x)
    const today = new Date().toDateString()
    const upd = data.topics.map(t => {
      if (t.id === topic?.id) return {...t, lastReview: today, streak: t.lastReview===today ? t.streak : t.streak+1}
      return t
    })
    setData({...data, cards: up, topics: upd})
    const due = data.cards.filter(x => x.topicId===topic.id && x.nextReview<=Date.now())
    if (quizIdx+1 < due.length) { setQuizIdx(quizIdx+1); setShowAns(false) }
    else { setQuizMode(false); setQuizIdx(0); setShowAns(false); notifShow('All caught up!') }
  }

  const addCard = (f, b) => {
    if (!f||!b||!topic) return
    pushUndo(() => setData(d => ({...d, cards: d.cards.slice(0,-1)})))
    setData(d => ({...d, cards: [...d.cards, {id:'c'+Date.now(), topicId:topic.id, front:f, back:b, interval:1, reviews:0}]}))
    notifShow('Card added')
  }

  const cloneCard = (id) => {
    const c = data.cards.find(x => x.id===id)
    if (!c) return
    setData(d => ({...d, cards: [...d.cards, {...c, id:'c'+Date.now(), interval:1, reviews:0}]}))
    notifShow('Card cloned')
  }

  const delCard = (id) => {
    pushUndo(() => setData(d => ({...d, cards: [...d.cards, data.cards.find(x=>x.id===id)]})))
    setData(d => ({...d, cards: d.cards.filter(x => x.id!==id)}))
    notifShow('Card deleted')
  }

  const createTopic = (tpl=null) => {
    const name = tpl?.name || prompt('Topic name:')
    if (!name) return
    const nt = {
      id: 't'+Date.now(), name, description: tpl?.description||'', status:'not_started', icon:tpl?.icon||'📚',
      isFavorite:false, streak:0, entryQuestions:[], positions:{}, keyIdeas:[], connections:[], quotes:[], philosophers:[], thoughtExperiments:[],
      phases: (tpl?.phases||['Getting Started']).map((n,i)=>({id:i+1, name:n, status:'pending'})),
      tags:[], createdAt:new Date().toISOString()
    }
    pushUndo(() => setData(d => ({...d, topics: d.topics.slice(0,-1)})))
    setData(d => ({...d, topics: [...d.topics, nt]}))
    setTopic(nt)
    setShowModal(null)
    notifShow('Topic created')
  }

  const updTopic = (f, v) => {
    if (!topic) return
    pushUndo(() => {
      const old = data.topics.find(x=>x.id===topic.id)
      setData(d => ({...d, topics: d.topics.map(t=>t.id===topic.id?old:t)}))
    })
    setData(d => ({...d, topics: d.topics.map(t=>t.id===topic.id?{...t,[f]:v}:t)}))
    setTopic({...topic, [f]:v})
  }

  const addIdea = () => {
    const txt = prompt('Key idea:')
    if (!txt||!topic) return
    updTopic('keyIdeas', [...topic.keyIdeas, {id:'i'+Date.now(), text:txt}])
  }

  const addConn = () => {
    if (topic.keyIdeas.length<2) return alert('Need 2+ ideas')
    const f = parseInt(prompt('From #:\n'+topic.keyIdeas.map((x,i)=>`${i+1}. ${x.text.slice(0,40)}...`).join('\n')))
    const t = parseInt(prompt('To #:'))
    const l = prompt('Connection (builds on/contrasts/leads to):') || 'connects'
    if (f && t) updTopic('connections', [...(topic.connections||[]), {
      id:'conn'+Date.now(), from:topic.keyIdeas[f-1]?.id, to:topic.keyIdeas[t-1]?.id, 
      fromName:topic.keyIdeas[f-1]?.text, toName:topic.keyIdeas[t-1]?.text, label:l
    }])
  }

  const addQuote = () => {
    const txt = prompt('Quote:')
    if (!txt) return
    const auth = prompt('Author:')||'Unknown'
    const cat = prompt('Category (wisdom/ethics/meaning/other):')||'other'
    setData(d => ({...d, quotes: [...d.quotes, {id:'q'+Date.now(), topicId:topic?.id, text:txt, author:auth, category:cat}]}))
    notifShow('Quote saved')
  }

  const addPhil = () => {
    const n = prompt('Philosopher:')
    if (!n) return
    const i = prompt('Key idea:')
    const p = prompt('Position:')
    updTopic('philosophers', [...(topic.philosophers||[]), {id:'p'+Date.now(), name:n, idea:i, position:p}])
  }

  const addExp = () => {
    const n = prompt('Experiment name:')
    if (!n) return
    const d = prompt('Description:')
    const imp = prompt('Implications (comma):')
    setData(d => ({...d, thoughtExperiments: [...d.thoughtExperiments, {id:'e'+Date.now(), topicId:topic?.id, name:n, description:d, implications:imp.split(',').map(x=>x.trim())}]}))
    notifShow('Experiment added')
  }

  const addTag = () => {
    const t = prompt('Tag:')
    if (!t||!topic||topic.tags?.includes(t)) return
    updTopic('tags', [...(topic.tags||[]), t])
  }

  const delTopic = (id) => {
    if (!confirm('Delete topic?')) return
    pushUndo(() => setData(d => ({...d, topics: [...d.topics, data.topics.find(x=>x.id===id)]})))
    setData(d => ({...d, topics: d.topics.filter(t=>t.id!==id), cards: d.cards.filter(c=>c.topicId!==id)}))
    if (topic?.id===id) setTopic(data.topics[0]||null)
  }

  const expData = () => {
    const b = new Blob([JSON.stringify({exportDate:new Date().toISOString(), version:'2.0', data}, null, 2)],{type:'application/json'})
    const u = URL.createObjectURL(b)
    const a = document.createElement('a'); a.href=u; a.download=`learn-${new Date().toISOString().split('T')[0]}.json`; a.click()
    setShowModal(null); notifShow('Exported')
  }

  const impData = () => {
    try { const p = JSON.parse(prompt('Paste JSON:')||'')
      if (p.data?.topics) { setData(p.data); setTopic(p.data.topics[0]||null); setShowModal(null); notifShow('Imported') }
      else alert('Invalid')
    } catch(e) { alert('Error: '+e.message) }
  }

  const due = topic ? data.cards.filter(x=>x.topicId===topic.id && x.nextReview<=Date.now()) : []
  const allDue = data.cards.filter(x=>x.nextReview<=Date.now())

  const results = search ? [...data.topics.filter(t=>t.name.toLowerCase().includes(search.toLowerCase())), ...data.cards.filter(c=>c.front.toLowerCase().includes(search.toLowerCase())), ...data.quotes.filter(q=>q.text.toLowerCase().includes(search.toLowerCase()))] : []

  useEffect(() => {
    if (!data.settings.keyboardShortcuts) return
    const k = (e) => {
      if (e.ctrlKey||e.metaKey) {
        if (e.key==='z') { e.preventDefault(); doUndo() }
        if (e.key==='f') { e.preventDefault(); document.querySelector('.sb')?.focus() }
        if (e.key==='n') { e.preventDefault(); setShowModal('template') }
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [data.settings, undoStack])

  return (
    <div className={`app ${data.settings.darkMode?'dark':'light'}`}>
      {notif && <div className="notif">{notif}</div>}
      {undoStack.length>0 && <button className="undo" onClick={doUndo}>↩️</button>}
      {data.badges.streakDays%7===0 && data.badges.streakDays>0 && <div className="modal" onClick={()=>{}}><h2>🔥 {data.badges.streakDays} Day Streak!</h2><p>You're on fire!</p></div>}
      
      {showModal==='template' && <div className="modal" onClick={()=>setShowModal(null)}>
        <h2>Create Topic</h2>
        <div className="tplg">{data.templates.map(t=><div key={t.id} className="tpl" onClick={()=>createTopic(t)}><span>{t.icon}</span><b>{t.name}</b></div>)}</div>
        <button onClick={()=>setShowModal(null)}>✕</button>
      </div>}

      {showModal==='export' && <div className="modal" onClick={()=>setShowModal(null)}>
        <h2>Export / Import</h2>
        <button onClick={expData}>📥 Export</button>
        <button onClick={impData}>📤 Import</button>
        <button onClick={()=>setShowModal(null)}>✕</button>
      </div>}

      {showModal==='compare' && topic && <div className="modal big" onClick={()=>setShowModal(null)}>
        <h2>⚖️ Compare</h2>
        {Object.entries(topic.positions).map(([k,v])=><div key={k}><h3>{k}</h3><p className="pos">{v}</p><div className="philg">{topic.philosophers?.map(p=><div key={p.id}><b>{p.name}</b><i>{p.position}</i></div>)}</div></div>)}
        <button onClick={()=>setShowModal(null)}>✕</button>
      </div>}

      {showModal==='quotes' && <div className="modal" onClick={()=>setShowModal(null)}>
        <h2>📜 Quotes</h2>
        <button onClick={addQuote}>+ Add</button>
        <div className="ql">{data.quotes.map(q=><div key={q.id}><i>"{q.text}"</i><b>— {q.author}</b></div>)}</div>
        <button onClick={()=>setShowModal(null)}>✕</button>
      </div>}

      {showModal==='experiments' && <div className="modal" onClick={()=>setShowModal(null)}>
        <h2>🧪 Experiments</h2>
        <button onClick={addExp}>+ Add</button>
        <div className="exlg">{data.thoughtExperiments.map(e=><div key={e}><b>{e.name}</b><p>{e.description}</p><div className="tagg">{e.implications?.map((x,i)=><span key={i}>{x}</span>)}</div></div>)}</div>
        <button onClick={()=>setShowModal(null)}>✕</button>
      </div>}

      {showModal==='connections' && topic && <div className="modal" onClick={()=>setShowModal(null)}>
        <h2>🔗 Connections</h2>
        {topic.connections?.map(c=><div key={c.id}><span>{c.fromName?.slice(0,30)}...</span><b>{c.label}</b><span>{c.toName?.slice(0,30)}...</span></div>)}
        <button onClick={()=>setShowModal(null)}>✕</button>
      </div>}

      <header className="hdr">
        <h1>🧠 Learning Tracker</h1>
        <input className="sb" placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)} />
        <nav>{['topics','review','stats','tools'].map(t=><button key={t} className={tab===t?'act':''} onClick={()=>setTab(t)}>{t}</button>)}</nav>
      </header>

      {search && <div className="sr">
        {results.map((r,i)=><div key={i} onClick={()=>{if(r.front){setTopic(data.topics.find(x=>x.id===r.topicId));setTab('review')}else{setTopic(r)};setSearch('')}}>{r.icon||'📚'}{r.name||r.front?.slice(0,50)}</div>)}
      </div>}

      <main className="main">
        {tab==='topics' && <div className="tv">
          <aside className="sb">
            <button onClick={()=>setShowModal('template')}>+ New</button>
            {data.topics.map(t=><div key={t.id} className={topic?.id===t.id?'sel':''} onClick={()=>{setTopic(t);setQuizMode(false)}}>{t.isFavorite?'⭐':t.icon}{t.name}{t.streak>0&&` 🔥${t.streak}`}</div>)}
          </aside>
          {topic ? <div className="tc">
            <div className="th">
              <span className="bi">{topic.icon}</span>
              <input value={topic.name} onChange={e=>updTopic('name',e.target.value)} />
              <div className="btns">
                <button onClick={()=>updTopic('isFavorite',!topic.isFavorite)}>{topic.isFavorite?'⭐':'☆'}</button>
                <button onClick={addTag}>🏷️</button>
                <button onClick={()=>setShowModal('connections')}>🔗</button>
                <button onClick={()=>setShowModal('compare')}>⚖️</button>
                <button onClick={()=>setShowModal('quotes')}>📜</button>
                <button onClick={()=>setShowModal('experiments')}>🧪</button>
                <button onClick={()=>delTopic(topic.id)}>🗑️</button>
              </div>
            </div>
            {topic.tags?.length>0 && <div className="tg">{topic.tags.map((x,i)=><span key={i}>{x}</span>)}</div>}
            <textarea value={topic.description||''} onChange={e=>updTopic('description',e.target.value)} placeholder="Description..." />
            
            <div className="secg">
              <section><h3>🎯 Positions</h3>{Object.entries(topic.positions).map(([k,v])=><div key={k}><b>{k}</b><div contentEditable onBlur={e=>updTopic('positions',{...topic.positions,[k]:e.target.innerText})}>{v}</div></div>)}</section>
              <section><h3>❓ Questions</h3>{topic.entryQuestions.map(q=><div key={q.id}>❓ {q.text}</div>)}<button onClick={()=>updTopic('entryQuestions',[...topic.entryQuestions,{id:'q'+Date.now(),text:prompt('Question:')||''}])}>+ Add</button></section>
              <section><h3>💡 Ideas</h3>{topic.keyIdeas.map((x,i)=><div key={x.id}><span>{i+1}</span>{x.text}</div>)}<button onClick={addIdea}>+ Add</button></section>
            </div>

            {topic.philosophers?.length>0 && <section><h3>👤 Philosophers</h3><div className="pg">{topic.philosophers.map(p=><div key={p.id}><b>{p.name}</b><i>{p.position}</i></div>)}</div><button onClick={addPhil}>+ Add</button></section>}

            <section><h3>📊 Phases</h3><div className="phg">{topic.phases?.map((p,i)=><div key={p.id} className={p.status}><span>{p.status==='complete'?'✓':i+1}</span>{p.name}<select value={p.status} onChange={e=>updTopic('phases',topic.phases.map(x=>x.id===p.id?{...x,status:e.target.value}:x))}><option value="pending">Pending</option><option value="in_progress">→</option><option value="complete">✓</option></select></div>)}</div></section>

            <div className="qr">{due.length>0?<button className="pulse" onClick={()=>{setQuizMode(true);setQuizIdx(0);setShowAns(false)}}>Review {due.length} cards</button>:<span>🎉 All caught up!</span>}</div>
          </div>:<div className="es"><p>Select or create a topic</p><button onClick={()=>setShowModal('template')}>Get Started</button></div>}
        </div>}

        {tab==='review' && <div className="rv">
          <select value={topic?.id||''} onChange={e=>setTopic(data.topics.find(t=>t.id===e.target.value)||null)}>
            <option value="">Select topic...</option>
            {data.topics.map(t=><option key={t.id} value={t.id}>{t.name} ({data.cards.filter(c=>c.topicId===t.id && c.nextReview<=Date.now()).length} due)</option>)}
          </select>
          
          {topic && quizMode ? (() => {
            const dc = data.cards.filter(c=>c.topicId===topic.id && c.nextReview<=Date.now())
            if (!dc.length) return <div className="nc">No cards due!</div>
            const c = dc[quizIdx]||dc[0]
            return <div className="fc">
              <div className="cp">{quizIdx+1}/{dc.length}</div>
              <div className="cc">
                <div className="cf"><b>Q</b><p>{c.front}</p></div>
                {showAns && <div className="cb"><b>A</b><p>{c.back}</p></div>}
              </div>
              <div className="ca">
                {!showAns?<button onClick={()=>setShowAns(true)}>Show</button>:<><button onClick={()=>grade(c.id,1)}>Again</button><button onClick={()=>grade(c.id,3)}>Good</button><button onClick={()=>grade(c.id,5)}>Easy</button></>}
              </div>
              <div className="cm">
                <button onClick={()=>cloneCard(c.id)}>Clone</button>
                <button onClick={()=>delCard(c.id)}>Delete</button>
              </div>
            </div>
          })() : topic && <div className="ac">
            <h3>Add Card</h3>
            <input id="f" placeholder="Front" /><textarea id="b" placeholder="Back" />
            <button onClick={()=>addCard(document.getElementById('f').value,document.getElementById('b').value)}>Add</button>
            <button onClick={()=>{const t=prompt('Paste (Q | A):');if(t){const [f,b]=t.split('|');if(f&&b)addCard(f.trim(),b.trim())}}}>Bulk Import</button>
          </div>}
          
          {topic && <div className="allc"><h4>All Cards</h4>{data.cards.filter(c=>c.topicId===topic.id).map(c=><div key={c.id}><span>{c.front.slice(0,40)}...</span><b className={c.nextReview<=Date.now()?'due':'ok'}>{c.nextReview<=Date.now()?'Due':'OK'}</b></div>)}</div>}
        </div>}

        {tab==='stats' && <div className="st">
          <h2>📊 Statistics</h2>
          <div className="sg">
            <div><b>{data.topics.length}</b><span>Topics</span></div>
            <div><b>{data.cards.length}</b><span>Cards</span></div>
            <div><b>{allDue.length}</b><span>Due</span></div>
            <div><b>{data.cards.filter(c=>c.interval>7).length}</b><span>Mastered</span></div>
            <div><b>{data.badges.streakDays}</b><span>Streak</span></div>
            <div><b>{data.badges.quotesSaved}</b><span>Quotes</span></div>
          </div>
          <div className="cht"><ResponsiveContainer><BarChart data={[{n:'New',c:data.cards.filter(x=>x.interval===1).length},{n:'Learn',c:data.cards.filter(x=>x.interval>1&&x.interval<=7).length},{n:'Review',c:data.cards.filter(x=>x.interval>7&&x.interval<=30).length},{n:'Master',c:data.cards.filter(x=>x.interval>30).length}]}><XAxis dataKey="n"/><Tooltip/><Bar dataKey="c" fill="#6366f1"/></BarChart></ResponsiveContainer></div>
          <button className="exbtn" onClick={()=>setShowModal('export')}>📥 Export / Import</button>
        </div>}

        {tab==='tools' && <div className="tl">
          <h2>⚙️ Settings</h2>
          <label><span>Dark Mode</span><button onClick={()=>setData(d=>({...d,settings:{...d.settings,darkMode:!d.settings.darkMode}}))}>{data.settings.darkMode?'🌙':'☀️'}</button></label>
          <label><span>Keyboard Shortcuts</span><button onClick={()=>setData(d=>({...d,settings:{...d.settings,keyboardShortcuts:!d.settings.keyboardShortcuts}}))}>{data.settings.keyboardShortcuts?'✅':'⬜'}</button></label>
          <div className="kb"><h3>⌨️ Shortcuts</h3><ul><li>Ctrl+F - Search</li><li>Ctrl+N - New Topic</li><li>Ctrl+Z - Undo</li></ul></div>
        </div>}
      </main>
    </div>
  )
}
