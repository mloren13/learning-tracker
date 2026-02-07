import { useState, useEffect } from 'react'
import './App.css'

const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i); return 'h' + (h >>> 0).toString(16) }
const PASS_KEY = 'lt_pass'
const PASS = 'learning'

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('topics')
  const [topic, setTopic] = useState(null)
  const [quiz, setQuiz] = useState(false)
  const [qIdx, setQIdx] = useState(0)
  const [showA, setShowA] = useState(false)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('lt_data')
    const pass = localStorage.getItem(PASS_KEY)
    if (pass && pass !== hash(PASS)) {
      setUnlocked(false)
    } else if (saved) {
      setData(JSON.parse(saved))
      setUnlocked(true)
    } else {
      setData(defaultData)
      setUnlocked(true)
    }
  }, [])

  useEffect(() => { if (data && unlocked) localStorage.setItem('lt_data', JSON.stringify(data)) }, [data, unlocked])

  const show = m => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const login = () => {
    const pass = localStorage.getItem(PASS_KEY)
    if (!pass) { localStorage.setItem(PASS_KEY, hash(PASS)); setUnlocked(true); show('Welcome') }
    else if (hash(password) === pass) {
      const saved = localStorage.getItem('lt_data')
      setData(saved ? JSON.parse(saved) : defaultData)
      setUnlocked(true); show('Welcome back')
    } else setError('Incorrect password')
  }

  const createTopic = () => {
    const n = prompt('Topic name:')
    if (!n) return
    setData({ ...data, topics: [...data.topics, { id: 't' + Date.now(), name: n, desc: '', status: 'active', phases: [{ id: 1, name: 'Getting Started', status: 'pending' }], positions: {}, ideas: [], connections: [], philosophers: [], quotes: [], experiments: [], tags: [], streak: 0 }] })
    show('Created')
  }

  const delTopic = id => { if (!confirm('Delete topic?')) return; setData({ ...data, topics: data.topics.filter(t => t.id !== id), cards: data.cards.filter(c => c.topicId !== id) }); if (topic?.id === id) setTopic(null); show('Deleted') }

  const addIdea = () => { if (!topic) return; const txt = prompt('Key idea:'); if (!txt) return; setData({ ...data, topics: data.topics.map(t => t.id === topic.id ? { ...t, ideas: [...t.ideas, { id: 'i' + Date.now(), text: txt }] } : t) }); show('Added') }

  const addConn = () => {
    if (!topic || topic.ideas.length < 2) return alert('Add 2+ ideas first')
    const f = parseInt(prompt('From #:\n' + topic.ideas.map((x, i) => `${i + 1}. ${x.text.slice(0, 40)}`).join('\n')))
    const t = parseInt(prompt('To #:'))
    const l = prompt('Connection:', 'builds on')
    if (f && t) { setData({ ...data, topics: data.topics.map(p => p.id === topic.id ? { ...p, connections: [...p.connections, { from: topic.ideas[f - 1]?.id, to: topic.ideas[t - 1]?.id, fromName: topic.ideas[f - 1]?.text, toName: topic.ideas[t - 1]?.text, label: l }] } : p) }); show('Connected') }
  }

  const addPos = () => { if (!topic) return; const k = prompt('Position name:'); const v = prompt('Your position:'); if (k && v) { setData({ ...data, topics: data.topics.map(t => t.id === topic.id ? { ...t, positions: { ...t.positions, [k]: v } } : t) }); show('Added') } }

  const addCard = (f, b) => { if (!f || !b || !topic) return; setData({ ...data, cards: [...data.cards, { id: 'c' + Date.now(), topicId: topic.id, front: f, back: b, interval: 1, reviews: 0 }] }); show('Added') }

  const grade = (cid, q) => {
    const card = data.cards.find(c => c.id === cid)
    if (!card) return
    const int = q >= 3 ? (card.interval === 1 ? 6 : card.interval * 2) : 1
    setData({ ...data, cards: data.cards.map(c => c.id === cid ? { ...c, interval: int, reviews: c.reviews + 1 } : c), topics: data.topics.map(t => { if (t.id === topic?.id) { const today = new Date().toDateString(); return t.lastReview === today ? t : { ...t, streak: t.streak + 1, lastReview: today } } return t }) })
    const due = data.cards.filter(c => c.topicId === topic.id && c.interval <= 6)
    if (qIdx + 1 < due.length) { setQIdx(qIdx + 1); setShowA(false) }
    else { setQuiz(false); setQIdx(0); setShowA(false); show('All caught up') }
  }

  const exportData = () => { const b = new Blob([JSON.stringify(data)], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `learn-${Date.now()}.json`; a.click(); show('Exported') }

  const due = topic ? data.cards.filter(c => c.topicId === topic.id && c.interval <= 6) : []
  const comp = topic?.phases?.filter(p => p.status === 'complete').length || 0
  const total = topic?.phases?.length || 1

  // Locked screen
  if (!unlocked) {
    return (
      <div className="locked">
        <div className="card locked-card">
          <h1>Learning Tracker</h1>
          <p>Enter password to continue</p>
          <input type="password" className="input" placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && login()} autoFocus />
          {error && <small style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem' }}>{error}</small>}
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={login}>Continue</button>
          <small style={{ display: 'block', marginTop: '1.5rem' }}>Default password: <strong>{PASS}</strong></small>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Learning Tracker</h1>
        <nav className="nav">
          {['Topics', 'Review', 'Stats'].map(t => <button key={t} className={tab === t.toLowerCase() ? 'active' : ''} onClick={() => setTab(t.toLowerCase())}>{t}</button>)}
        </nav>
      </header>

      <main className="main">
        {toast && <div className="toast">{toast}</div>}

        {tab === 'topics' && (
          <div>
            <div className="section-header">
              <h2>Your Topics</h2>
              <button className="btn btn-primary" onClick={createTopic}>+ New</button>
            </div>

            {!topic ? (
              <div className="grid">
                {data.topics.map(t => (
                  <div key={t.id} className="card topic-card" onClick={() => setTopic(t)}>
                    <h3>{t.name}</h3>
                    <p>{t.desc || 'No description'}</p>
                    <div className="progress"><div className="progress-fill" style={{ width: `${(t.phases?.filter(p => p.status === 'complete').length || 0) / (t.phases?.length || 1) * 100}%` }} /></div>
                    <small style={{ marginTop: '0.5rem', display: 'block' }}>{t.phases?.filter(p => p.status === 'complete').length || 0}/{t.phases?.length || 1} phases {t.streak > 0 && `• ${t.streak} day streak`}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button className="btn btn-ghost" onClick={() => setTopic(null)} style={{ marginBottom: '1rem' }}>← Back to topics</button>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div><h2>{topic.name}</h2><p>{topic.desc}</p></div>
                    <button className="btn btn-ghost" onClick={() => delTopic(topic.id)}>Delete</button>
                  </div>

                  <h3 style={{ marginBottom: '0.75rem' }}>Progress</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.5rem' }}>
                    {topic.phases?.map((p, i) => (
                      <div key={p.id} style={{ padding: '0.75rem 1rem', background: p.status === 'in_progress' ? 'var(--bg3)' : 'transparent', border: p.status === 'in_progress' ? '1px solid var(--text2)' : '1px solid transparent', borderRadius: '8px', minWidth: '120px', opacity: p.status === 'pending' ? 0.5 : 1 }}>
                        <small style={{ display: 'block', marginBottom: '0.25rem' }}>{p.status === 'complete' ? '✓' : i + 1}</small>
                        <small>{p.name}</small>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <button className="btn btn-ghost" onClick={addPos}>+ Position</button>
                    <button className="btn btn-ghost" onClick={addIdea}>+ Key Idea</button>
                    <button className="btn btn-ghost" onClick={addConn}>+ Connect</button>
                  </div>

                  {Object.entries(topic.positions).map(([k, v]) => (
                    <div key={k} style={{ marginBottom: '1rem' }}>
                      <small style={{ textTransform: 'capitalize', display: 'block', marginBottom: '0.25rem', color: 'var(--text)' }}>{k}</small>
                      <div contentEditable onBlur={e => setData({ ...data, topics: data.topics.map(t => t.id === topic.id ? { ...t, positions: { ...t.positions, [k]: e.target.innerText } } : t) })} style={{ padding: '0.75rem', background: 'var(--bg3)', borderRadius: '8px', outline: 'none' }}>{v}</div>
                    </div>
                  ))}

                  {topic.ideas.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h3 style={{ marginBottom: '0.75rem' }}>Key Ideas {topic.connections?.length > 0 && `(${topic.connections.length})`}</h3>
                      {topic.ideas.map((id, i) => (
                        <div key={id.id} className="list-item">
                          <span className="list-num">{i + 1}</span>
                          <span>{id.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {due.length > 0 && (
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => { setQuiz(true); setQIdx(0); setShowA(false) }}>
                      Review {due.length} cards
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'review' && (
          <div>
            <h2>Review</h2>
            {!topic && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <label>Select topic</label>
                <select className="input" style={{ marginTop: '0.5rem' }} value={topic?.id || ''} onChange={e => setTopic(data.topics.find(t => t.id === e.target.value))}>
                  <option value="">Choose...</option>
                  {data.topics.map(t => <option key={t.id} value={t.id}>{t.name} ({data.cards.filter(c => c.topicId === t.id && c.interval <= 6).length} due)</option>)}
                </select>
              </div>
            )}

            {quiz && topic && (() => {
              const due = data.cards.filter(c => c.topicId === topic.id && c.interval <= 6)
              if (!due.length) return <div className="empty"><p>No cards due</p></div>
              const card = due[qIdx] || due[0]
              return (
                <div className="card flashcard">
                  <small style={{ marginBottom: '1rem', display: 'block' }}>{topic.name} • {qIdx + 1}/{due.length}</small>
                  <div className="flashcard-label">Question</div>
                  <div className="flashcard-content" style={{ marginBottom: showA ? '2rem' : 0 }}>{card.front}</div>
                  {showA && (
                    <>
                      <div className="flashcard-label">Answer</div>
                      <div className="flashcard-content">{card.back}</div>
                    </>
                  )}
                  <div className="flashcard-actions">
                    {!showA ? (
                      <button className="btn btn-primary" onClick={() => setShowA(true)}>Show</button>
                    ) : (
                      <>
                        <button className="btn" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }} onClick={() => grade(card.id, 1)}>Again</button>
                        <button className="btn" style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }} onClick={() => grade(card.id, 3)}>Good</button>
                        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => grade(card.id, 5)}>Easy</button>
                      </>
                    )}
                  </div>
                </div>
              )
            })()}

            {!quiz && topic && (
              <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Add Card</h3>
                <input id="cf" className="input" placeholder="Question" style={{ marginBottom: '0.5rem' }} />
                <input id="cb" className="input" placeholder="Answer" style={{ marginBottom: '0.5rem' }} />
                <button className="btn btn-primary" onClick={() => addCard(document.getElementById('cf').value, document.getElementById('cb').value)}>Add</button>
              </div>
            )}
          </div>
        )}

        {tab === 'stats' && (
          <div>
            <h2>Statistics</h2>
            <div className="stats">
              <div className="card stat"><div className="stat-value">{data.topics.length}</div><div className="stat-label">Topics</div></div>
              <div className="card stat"><div className="stat-value">{data.cards.length}</div><div className="stat-label">Cards</div></div>
              <div className="card stat"><div className="stat-value">{data.cards.filter(c => c.interval <= 6).length}</div><div className="stat-label">Due</div></div>
              <div className="card stat"><div className="stat-value">{data.cards.filter(c => c.interval > 7).length}</div><div className="stat-label">Mastered</div></div>
              <div className="card stat"><div className="stat-value">{data.topics.reduce((a, t) => a + t.streak, 0)}</div><div className="stat-label">Streak</div></div>
              <div className="card stat"><div className="stat-value">{data.cards.reduce((a, c) => a + c.reviews, 0)}</div><div className="stat-label">Reviews</div></div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Progress</h2>
              {data.topics.map(t => (
                <div key={t.id} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <small>{t.name}</small>
                    <small>{Math.round((t.phases?.filter(p => p.status === 'complete').length || 0) / (t.phases?.length || 1) * 100)}%</small>
                  </div>
                  <div className="progress"><div className="progress-fill" style={{ width: `${(t.phases?.filter(p => p.status === 'complete').length || 0) / (t.phases?.length || 1) * 100}%` }} /></div>
                </div>
              ))}
            </div>

            <button className="btn" style={{ marginTop: '1rem' }} onClick={exportData}>Export data</button>
          </div>
        )}
      </main>

      {modal === 'compare' && topic && (
        <div className="modal" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Compare</h2>
            {Object.entries(topic.positions).map(([k, v]) => (
              <div key={k} style={{ marginBottom: '1.5rem' }}>
                <small style={{ textTransform: 'capitalize', display: 'block', marginBottom: '0.5rem' }}>{k}</small>
                <div style={{ padding: '0.75rem', background: 'var(--bg3)', borderRadius: '8px' }}>{v}</div>
                {topic.philosophers?.map((p, i) => (
                  <div key={i} style={{ marginTop: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <small style={{ display: 'block', color: 'var(--text)' }}>{p.name}</small>
                    <small>{p.position}</small>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const defaultData = {
  topics: [{
    id: 'phil', name: 'Philosophy', desc: 'Deep exploration of fundamental questions',
    status: 'in_progress', streak: 5,
    phases: [
      { id: 1, name: 'The Map', status: 'complete' },
      { id: 2, name: 'Ethics Deep Dive', status: 'in_progress' },
      { id: 3, name: 'Meaning & Existence', status: 'pending' }
    ],
    positions: { morality: 'Contextual relativism', meaning: 'Found, not chosen' },
    ideas: [
      { id: 'i1', text: 'Metaphysics asks "What is real?" Ethics asks "What is good?"' },
      { id: 'i2', text: 'Ethics can stand alone from metaphysics' },
      { id: 'i3', text: 'Ontology is a subset of metaphysics' }
    ],
    connections: [{ from: 'i1', to: 'i2', label: 'builds on' }],
    philosophers: [
      { name: 'Plato', position: 'Objective realism', idea: 'Forms/Ideas' },
      { name: 'Aristotle', position: 'Virtue ethics', idea: 'Golden mean' },
      { name: 'Kant', position: 'Deontology', idea: 'Categorical imperative' },
      { name: 'Hume', position: 'Sentimentalism', idea: 'Is-ought problem' },
      { name: 'Nietzsche', position: 'Nihilism/Affirmation', idea: 'Will to power' }
    ],
    quotes: [
      { text: 'The unexamined life is not worth living', author: 'Socrates' },
      { text: 'He who has a why can bear almost any how', author: 'Nietzsche' },
      { text: 'Morality is how we make ourselves worthy', author: 'Kant' }
    ],
    experiments: [
      { name: 'Trolley Problem', desc: 'Pull lever to save 5 but kill 1?', impl: ['Utilitarianism', 'Active vs passive'] },
      { name: 'Ship of Theseus', desc: 'Replaced planks = same ship?', impl: ['Identity', 'Continuity'] },
      { name: 'Experience Machine', desc: 'Infinite pleasure vs reality?', impl: ['Hedonism', 'Authenticity'] }
    ],
    tags: ['philosophy', 'ethics', 'morality']
  }],
  cards: [
    { id: 'c1', front: 'Metaphysics vs Ethics?', back: 'Metaphysics asks "What is real?" Ethics asks "What is good?"', interval: 6, reviews: 3 },
    { id: 'c2', front: 'Ethics standalone?', back: 'Yes. Facts dont imply values.', interval: 6, reviews: 2 },
    { id: 'c3', front: 'What is Ontology?', back: 'Subset of metaphysics', interval: 6, reviews: 2 }
  ]
}
