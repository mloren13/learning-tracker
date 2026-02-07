import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import './App.css'

const STORAGE_KEY = 'learning-tracker-data'

const defaultData = {
  topics: [
    {
      id: 'philosophy',
      name: 'Philosophy',
      description: 'Deep exploration of fundamental questions',
      phase: 2,
      status: 'in_progress',
      color: '#6366f1',
      icon: '🧠',
      entryQuestions: [
        { id: 'q1', text: 'What is good? (fixed vs relative)' },
        { id: 'q2', text: 'What is meaning? (found vs created)' }
      ],
      positions: {
        morality: 'Contextual relativism. We\'re shaped by context but can still condemn within our own context.',
        meaning: 'Found, not chosen. We discover what resonates. But we choose whether to look.'
      },
      keyIdeas: [
        { id: 'i1', text: 'Metaphysics asks "What is real?" Ethics asks "What is good?" - Different questions.' },
        { id: 'i2', text: 'Ethics can stand alone from metaphysics. Facts don\'t imply values.' },
        { id: 'i3', text: 'Ontology is a subset of metaphysics: "What categories of things exist?"' }
      ],
      connections: [],
      resources: [],
      branches: ['METAPHYSICS', 'EPISTEMOLOGY', 'ETHICS', 'LOGIC', 'PHILOSOPHY OF MIND', 'AESTHETICS'],
      phases: [
        { id: 1, name: 'The Map', status: 'complete', description: 'Major branches and connections understood' },
        { id: 2, name: 'Ethics Deep Dive', status: 'pending', description: 'Aristotle, Plato, Hume, Kant, Nietzsche' },
        { id: 3, name: 'Meaning and Existence', status: 'pending', description: 'Kierkegaard, Nietzsche, Heidegger, Sartre, Camus' }
      ],
      streak: 0,
      lastReview: null
    }
  ],
  cards: [
    { id: 'c1', topicId: 'philosophy', front: 'What is the difference between Metaphysics and Ethics?', back: 'Metaphysics asks "What is real?" Ethics asks "What is good?" - Different questions, different branches.', ease: 2.5, interval: 1, nextReview: Date.now(), reviews: 0 },
    { id: 'c2', topicId: 'philosophy', front: 'Can Ethics stand alone from Metaphysics?', back: 'Yes. Knowing metaphysical facts doesn\'t tell you moral values - you need a separate framework for ethics.', ease: 2.5, interval: 1, nextReview: Date.now(), reviews: 0 },
    { id: 'c3', topicId: 'philosophy', front: 'What is Ontology?', back: 'A subset of metaphysics that asks "What categories of things exist?"', ease: 2.5, interval: 1, nextReview: Date.now(), reviews: 0 }
  ],
  templates: [
    { id: 't1', name: 'Philosophy', icon: '🧠', description: 'Entry questions, positions, key ideas', phases: ['The Map', 'Deep Dive', 'Synthesis'] },
    { id: 't2', name: 'Coding', icon: '💻', description: 'Concepts, syntax, projects', phases: ['Basics', 'Practice', 'Build'] },
    { id: 't3', name: 'Language', icon: '🌍', description: 'Vocabulary, grammar, conversation', phases: ['Foundation', 'Expansion', 'Fluency'] },
    { id: 't4', name: 'Book Study', icon: '📚', description: 'Notes, insights, questions', phases: ['Reading', 'Reflection', 'Application'] },
    { id: 't5', name: 'Empty', icon: '📝', description: 'Start from scratch', phases: [] }
  ],
  sessions: [],
  settings: {
    darkMode: true,
    dailyGoal: 10,
    notifications: false
  },
  badges: {
    streakDays: 0,
    totalCards: 0,
    topicsCreated: 0,
    totalReviews: 0
  }
}

function App() {
  const [data, setData] = useState(defaultData)
  const [activeTab, setActiveTab] = useState('topics')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [quizMode, setQuizMode] = useState(false)
  const [quizCardIndex, setQuizCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showAddResource, setShowAddResource] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [exportModal, setExportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [quickAddMode, setQuickAddMode] = useState(false)
  const [streakModal, setStreakModal] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setData(parsed)
        if (parsed.topics?.length > 0) {
          setSelectedTopic(parsed.topics[0])
        }
      } catch (e) {
        console.error('Failed to load:', e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (data.badges?.streakDays > 0 && data.badges?.streakDays % 7 === 0 && !streakModal) {
      setStreakModal(true)
    }
  }, [data.badges])

  const gradeCard = (cardId, quality) => {
    const card = data.cards.find(c => c.id === cardId)
    if (!card) return

    let newEase = Math.max(1.3, card.ease + (quality - 3) * 0.1)
    let newInterval = card.interval

    if (quality >= 3) {
      if (card.interval === 1) newInterval = 6
      else if (card.interval < 30) newInterval = Math.round(card.interval * newEase)
      else newInterval = Math.round(card.interval * newEase * 1.2)
    } else {
      newInterval = 1
      newEase = Math.max(1.3, newEase - 0.2)
    }

    const updatedCards = data.cards.map(c =>
      c.id === cardId ? { ...c, ease: newEase, interval: newInterval, nextReview: Date.now() + newInterval * 24 * 60 * 60 * 1000, reviews: (c.reviews || 0) + 1 } : c
    )

    const today = new Date().toDateString()
    const lastReview = data.topics.find(t => t.id === selectedTopic?.id)?.lastReview
    const updatedTopics = data.topics.map(t => {
      if (t.id === selectedTopic?.id) {
        const isSameDay = lastReview === today
        return { ...t, lastReview: today, streak: isSameDay ? t.streak : t.streak + 1 }
      }
      return t
    })

    setData({ ...data, cards: updatedCards, topics: updatedTopics })

    const topicCards = data.cards.filter(c => c.topicId === selectedTopic.id && c.nextReview <= Date.now())
    const nextIndex = quizCardIndex + 1
    if (nextIndex < topicCards.length) {
      setQuizCardIndex(nextIndex)
      setShowAnswer(false)
    } else {
      setQuizMode(false)
      setQuizCardIndex(0)
      setShowAnswer(false)
    }
  }

  const addCard = (front, back) => {
    if (!front.trim() || !back.trim() || !selectedTopic) return
    const newCard = {
      id: 'c' + Date.now(),
      topicId: selectedTopic.id,
      front,
      back,
      ease: 2.5,
      interval: 1,
      nextReview: Date.now(),
      reviews: 0
    }
    setData({ ...data, cards: [...data.cards, newCard], badges: { ...data.badges, totalCards: data.badges.totalCards + 1 } })
  }

  const createTopic = (template = null) => {
    const name = template ? template.name : prompt('Topic name:')
    if (!name) return

    const newTopic = {
      id: 't' + Date.now(),
      name,
      description: template?.description || '',
      phase: 1,
      status: 'not_started',
      color: template?.color || '#6366f1',
      icon: template?.icon || '📚',
      entryQuestions: [],
      positions: {},
      keyIdeas: [],
      connections: [],
      resources: [],
      branches: [],
      phases: (template?.phases || ['Getting Started']).map((p, i) => ({ id: i + 1, name: p, status: 'pending', description: '' })),
      streak: 0,
      lastReview: null
    }

    setData({
      ...data,
      topics: [...data.topics, newTopic],
      badges: { ...data.badges, topicsCreated: data.badges.topicsCreated + 1 }
    })
    setSelectedTopic(newTopic)
    setShowTemplateModal(false)
  }

  const updateTopic = (field, value) => {
    if (!selectedTopic) return
    const updatedTopics = data.topics.map(t => t.id === selectedTopic.id ? { ...t, [field]: value } : t)
    setData({ ...data, topics: updatedTopics })
    setSelectedTopic({ ...selectedTopic, [field]: value })
  }

  const addEntryQuestion = () => {
    const text = prompt('Entry question:')
    if (!text || !selectedTopic) return
    updateTopic('entryQuestions', [...selectedTopic.entryQuestions, { id: 'q' + Date.now(), text }])
  }

  const addKeyIdea = () => {
    const text = prompt('Key idea:')
    if (!text || !selectedTopic) return
    updateTopic('keyIdeas', [...selectedTopic.keyIdeas, { id: 'i' + Date.now(), text }])
  }

  const addResource = () => {
    const title = prompt('Resource title:')
    if (!title) return
    const url = prompt('URL (optional):') || ''
    const type = prompt('Type (article/video/book/link):') || 'link'
    updateTopic('resources', [...(selectedTopic.resources || []), { id: 'r' + Date.now(), title, url, type }])
    setShowAddResource(false)
  }

  const updatePosition = (key, value) => {
    if (!selectedTopic) return
    updateTopic('positions', { ...selectedTopic.positions, [key]: value })
  }

  const deleteTopic = (topicId) => {
    if (!confirm('Delete this topic and all cards?')) return
    const updatedTopics = data.topics.filter(t => t.id !== topicId)
    const updatedCards = data.cards.filter(c => c.topicId !== topicId)
    setData({ ...data, topics: updatedTopics, cards: updatedCards })
    if (selectedTopic?.id === topicId) {
      setSelectedTopic(updatedTopics[0] || null)
    }
  }

  const getDueCards = () => {
    if (!selectedTopic) return []
    return data.cards.filter(c => c.topicId === selectedTopic.id && c.nextReview <= Date.now())
  }

  const getAllDueCards = () => {
    return data.cards.filter(c => c.nextReview <= Date.now())
  }

  const exportData = () => {
    const exportObj = { exportDate: new Date().toISOString(), version: '1.0', data }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `learning-tracker-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    setExportModal(false)
  }

  const importData = () => {
    try {
      const parsed = JSON.parse(importText)
      if (parsed.data && parsed.data.topics) {
        setData(parsed.data)
        setSelectedTopic(parsed.data.topics[0] || null)
        setImportText('')
        setExportModal(false)
        alert('Import successful!')
      } else {
        alert('Invalid format')
      }
    } catch (e) {
      alert('Failed to import: ' + e.message)
    }
  }

  const bulkImportCards = () => {
    const text = prompt('Paste cards (Front | Back, one per line):')
    if (!text) return
    const lines = text.split('\n').filter(l => l.includes('|'))
    lines.forEach(line => {
      const [front, back] = line.split('|').map(s => s.trim())
      if (front && back) addCard(front, back)
    })
  }

  const searchResults = searchQuery ? [
    ...data.topics.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())),
    ...data.cards.filter(c => c.front.toLowerCase().includes(searchQuery.toLowerCase()) || c.back.toLowerCase().includes(searchQuery.toLowerCase()))
  ] : []

  return (
    <div className={`app ${data.settings.darkMode ? 'dark' : 'light'}`}>
      {streakModal && (
        <div className="modal-overlay" onClick={() => setStreakModal(false)}>
          <div className="modal streak-modal" onClick={e => e.stopPropagation()}>
            <h2>🔥 {data.badges.streakDays} Day Streak!</h2>
            <p>You're on fire! Keep it up!</p>
            <button onClick={() => setStreakModal(false)}>Thanks!</button>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Topic</h2>
            <div className="template-grid">
              {data.templates.map(t => (
                <div key={t.id} className="template-card" onClick={() => createTopic(t)}>
                  <span className="template-icon">{t.icon}</span>
                  <h3>{t.name}</h3>
                  <p>{t.description}</p>
                </div>
              ))}
            </div>
            <button className="cancel-btn" onClick={() => setShowTemplateModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {exportModal && (
        <div className="modal-overlay" onClick={() => setExportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Export / Import</h2>
            <div className="export-section">
              <button className="export-btn" onClick={exportData}>📥 Export Data (JSON)</button>
              <p className="export-info">Download all your topics, cards, and progress</p>
            </div>
            <hr />
            <div className="import-section">
              <h3>Import</h3>
              <textarea placeholder='Paste JSON here...' value={importText} onChange={e => setImportText(e.target.value)} />
              <button className="import-btn" onClick={importData}>📤 Import Data</button>
            </div>
            <button className="cancel-btn" onClick={() => setExportModal(false)}>Close</button>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-left">
          <h1>🧠 Learning Tracker</h1>
          {data.badges.streakDays > 0 && <span className="streak-badge">🔥 {data.badges.streakDays} day streak</span>}
        </div>
        <div className="header-center">
          <input type="text" className="search-bar" placeholder="🔍 Search topics, cards..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <nav className="nav">
          <button className={activeTab === 'topics' ? 'active' : ''} onClick={() => setActiveTab('topics')}>Topics</button>
          <button className={activeTab === 'review' ? 'active' : ''} onClick={() => setActiveTab('review')}>Review {getAllDueCards().length > 0 && `(${getAllDueCards().length})`}</button>
          <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>Stats</button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>⚙️</button>
        </nav>
      </header>

      {searchQuery && (
        <div className="search-results">
          {searchResults.length > 0 ? searchResults.map((r, i) => (
            <div key={i} className="search-result-item" onClick={() => {
              if (r.front) { setSelectedTopic(data.topics.find(t => t.id === r.topicId)); setActiveTab('review'); }
              else { setSelectedTopic(r); }
              setSearchQuery('');
            }}>
              <span>{r.icon || '📚'}</span>
              <span>{r.name || r.front?.slice(0, 50)}</span>
            </div>
          )) : <div className="search-no-results">No results</div>}
        </div>
      )}

      <main className="main">
        {activeTab === 'topics' && (
          <div className="topics-view">
            <div className="topics-sidebar">
              <button className="new-topic-btn" onClick={() => setShowTemplateModal(true)}>+ New Topic</button>
              <div className="topic-list">
                {data.topics.map(topic => (
                  <div key={topic.id} className={`topic-item ${selectedTopic?.id === topic.id ? 'selected' : ''}`} onClick={() => { setSelectedTopic(topic); setQuizMode(false); }}>
                    <span className="topic-icon">{topic.icon}</span>
                    <span className="topic-name">{topic.name}</span>
                    <span className={`topic-status ${topic.status}`}>{topic.streak > 0 && `🔥${topic.streak}`}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedTopic ? (
              <div className="topic-content">
                <div className="topic-header">
                  <div className="topic-title-row">
                    <span className="topic-big-icon">{selectedTopic.icon}</span>
                    <input type="text" className="topic-title-input" value={selectedTopic.name} onChange={(e) => updateTopic('name', e.target.value)} />
                  </div>
                  <div className="topic-actions">
                    <button className="action-btn" onClick={addResource}>+ Resource</button>
                    <button className="action-btn" onClick={bulkImportCards}>📋 Bulk Import</button>
                    <button className="delete-btn" onClick={() => deleteTopic(selectedTopic.id)}>Delete</button>
                  </div>
                </div>

                <div className="topic-meta">
                  <select value={selectedTopic.status} onChange={(e) => updateTopic('status', e.target.value)}>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                  </select>
                  <input type="text" className="icon-picker" value={selectedTopic.icon} onChange={(e) => updateTopic('icon', e.target.value)} maxLength={2} placeholder="📚" />
                </div>

                <textarea className="topic-description" placeholder="Description..." value={selectedTopic.description} onChange={(e) => updateTopic('description', e.target.value)} />

                {selectedTopic.resources?.length > 0 && (
                  <section className="topic-section resources-section">
                    <h3>📎 Resources</h3>
                    <div className="resources-grid">
                      {selectedTopic.resources.map(r => (
                        <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="resource-card">
                          <span className="resource-type">{r.type}</span>
                          <span className="resource-title">{r.title}</span>
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                <div className="topic-sections">
                  <section className="topic-section">
                    <h3>❓ Entry Questions</h3>
                    {selectedTopic.entryQuestions.map(q => <div key={q.id} className="entry-question">❓ {q.text}</div>)}
                    <button className="add-btn" onClick={addEntryQuestion}>+ Add Question</button>
                  </section>

                  <section className="topic-section positions-section">
                    <h3>🎯 My Positions</h3>
                    <div className="positions-list">
                      {Object.entries(selectedTopic.positions).map(([key, value]) => (
                        <div key={key} className="position-card">
                          <div className="position-header">
                            <span className="position-icon">{key === 'morality' ? '⚖️' : key === 'meaning' ? '🎯' : '💭'}</span>
                            <span className="position-label">{key}</span>
                          </div>
                          <div 
                            className="position-content" 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updatePosition(key, e.target.innerText)}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="add-btn" onClick={() => {
                      const key = prompt('Position name (e.g., free will, consciousness):')
                      if (key) updatePosition(key, 'Your position...')
                    }}>+ Add Position</button>
                  </section>

                  <section className="topic-section">
                    <h3>💡 Key Ideas</h3>
                    {selectedTopic.keyIdeas.map((idea, idx) => (
                      <div key={idea.id} className="key-idea"><span className="idea-number">{idx + 1}</span><span>{idea.text}</span></div>
                    ))}
                    <button className="add-btn" onClick={addKeyIdea}>+ Add Key Idea</button>
                  </section>
                </div>

                <section className="phases-section">
                  <h3>📊 Phases</h3>
                  <div className="phases-track">
                    {selectedTopic.phases?.map((phase, idx) => (
                      <div key={phase.id} className={`phase-step ${phase.status}`}>
                        <div className="phase-dot">{phase.status === 'complete' ? '✓' : idx + 1}</div>
                        <span className="phase-name">{phase.name}</span>
                        <select value={phase.status} onChange={(e) => {
                          const updated = selectedTopic.phases.map(p => p.id === phase.id ? { ...p, status: e.target.value } : p)
                          updateTopic('phases', updated)
                        }}>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="complete">Complete</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="quick-review">
                  {getDueCards().length > 0 ? (
                    <button className="review-btn pulse" onClick={() => { setQuizMode(true); setQuizCardIndex(0); setShowAnswer(false); }}>
                      Review {getDueCards().length} cards due
                    </button>
                  ) : (
                    <p className="all-caught-up">🎉 All caught up for this topic!</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Select a topic or create a new one</p>
                <button className="start-btn" onClick={() => setShowTemplateModal(true)}>Get Started</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="review-view">
            <div className="review-header">
              <h2>🧠 Spaced Repetition</h2>
              <select value={selectedTopic?.id || ''} onChange={(e) => { const topic = data.topics.find(t => t.id === e.target.value); setSelectedTopic(topic); }}>
                <option value="">All Topics</option>
                {data.topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({data.cards.filter(c => c.topicId === t.id && c.nextReview <= Date.now()).length} due)</option>
                ))}
              </select>
            </div>

            {selectedTopic && quizMode ? (
              <div className="quiz-mode">
                {(() => {
                  const topicCards = data.cards.filter(c => c.topicId === selectedTopic.id && c.nextReview <= Date.now())
                  if (topicCards.length === 0) { return <div className="no-cards">No cards due for review!</div> }
                  const card = topicCards[quizCardIndex] || topicCards[0]
                  return (
                    <div className="flashcard">
                      <div className="card-progress">{quizCardIndex + 1} / {topicCards.length} due</div>
                      <div className="card-content">
                        <div className="card-front"><span className="card-label">Question</span><p>{card.front}</p></div>
                        {showAnswer && <div className="card-back"><span className="card-label">Answer</span><p>{card.back}</p></div>}
                      </div>
                      <div className="card-actions">
                        {!showAnswer ? (
                          <button className="show-answer-btn" onClick={() => setShowAnswer(true)}>Show Answer</button>
                        ) : (
                          <><button className="grade-btn hard" onClick={() => gradeCard(card.id, 1)}>Again</button>
                          <button className="grade-btn good" onClick={() => gradeCard(card.id, 3)}>Good</button>
                          <button className="grade-btn easy" onClick={() => gradeCard(card.id, 5)}>Easy</button></>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="add-card-area">
                <h3>{quickAddMode ? 'Quick Add Cards' : 'Add New Card'}</h3>
                {quickAddMode ? (
                  <div className="quick-add-form">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="quick-add-row">
                        <input id={`qfront${n}`} placeholder="Question" />
                        <span className="divider">|</span>
                        <input id={`qback${n}`} placeholder="Answer" />
                      </div>
                    ))}
                    <button className="add-cards-btn" onClick={() => {
                      [1, 2, 3].forEach(n => {
                        const front = document.getElementById(`qfront${n}`)?.value
                        const back = document.getElementById(`qback${n}`)?.value
                        if (front && back) addCard(front, back)
                      })
                      setQuickAddMode(false)
                    }}>Add All</button>
                    <button className="cancel-quick" onClick={() => setQuickAddMode(false)}>Cancel</button>
                  </div>
                ) : (
                  <div className="add-card-form">
                    <input id="newFront" placeholder="Front (question)" />
                    <textarea id="newBack" placeholder="Back (answer)" />
                    <div className="add-card-actions">
                      <button className="quick-add-btn" onClick={() => { const front = document.getElementById('newFront')?.value; const back = document.getElementById('newBack')?.value; if (front && back) { addCard(front, back); document.getElementById('newFront').value = ''; document.getElementById('newBack').value = ''; } }}>Add Card</button>
                      <button className="bulk-btn" onClick={() => setQuickAddMode(true)}>Quick Add (+3)</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTopic && (
              <div className="all-cards-preview">
                <h4>All Cards for {selectedTopic.name}</h4>
                <div className="cards-list">
                  {data.cards.filter(c => c.topicId === selectedTopic.id).map(card => (
                    <div key={card.id} className="mini-card">
                      <span className="mini-card-front">{card.front.slice(0, 40)}...</span>
                      <span className={`mini-card-status ${card.nextReview <= Date.now() ? 'due' : 'ok'}`}>{card.nextReview <= Date.now() ? 'Due' : 'OK'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-view">
            <h2>📊 Learning Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card"><span className="stat-number">{data.topics.length}</span><span className="stat-label">Topics</span></div>
              <div className="stat-card"><span className="stat-number">{data.cards.length}</span><span className="stat-label">Cards</span></div>
              <div className="stat-card"><span className="stat-number">{data.cards.filter(c => c.nextReview <= Date.now()).length}</span><span className="stat-label">Due Today</span></div>
              <div className="stat-card"><span className="stat-number">{data.cards.filter(c => c.interval > 7).length}</span><span className="stat-label">Mastered</span></div>
              <div className="stat-card"><span className="stat-number">{data.badges.streakDays}</span><span className="stat-label">Day Streak</span></div>
              <div className="stat-card"><span className="stat-number">{data.badges.totalReviews || data.cards.reduce((a, c) => a + (c.reviews || 0), 0)}</span><span className="stat-label">Total Reviews</span></div>
            </div>

            <div className="charts-row">
              <div className="chart-card">
                <h3>Cards Mastery Level</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={[
                    { name: 'New', count: data.cards.filter(c => c.interval === 1).length },
                    { name: 'Learning', count: data.cards.filter(c => c.interval > 1 && c.interval <= 7).length },
                    { name: 'Reviewing', count: data.cards.filter(c => c.interval > 7 && c.interval <= 30).length },
                    { name: 'Mastered', count: data.cards.filter(c => c.interval > 30).length }
                  ]}>
                    <XAxis dataKey="name" /><Tooltip /><Bar dataKey="count" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Topics Progress</h3>
                <div className="topic-progress-bars">
                  {data.topics.map(t => (
                    <div key={t.id} className="topic-progress-row">
                      <span className="topic-progress-icon">{t.icon}</span>
                      <span className="topic-progress-name">{t.name}</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(t.phases?.filter(p => p.status === 'complete').length || 0) / (t.phases?.length || 1) * 100}%` }} />
                      </div>
                      <span className="progress-pct">{Math.round((t.phases?.filter(p => p.status === 'complete').length || 0) / (t.phases?.length || 1) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="export-bar">
              <button className="export-main-btn" onClick={() => setExportModal(true)}>📥 Export / Import Data</button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-view">
            <h2>⚙️ Settings</h2>
            <div className="settings-section">
              <div className="setting-item">
                <label>Dark Mode</label>
                <button className={`toggle ${data.settings.darkMode ? 'on' : 'off'}`} onClick={() => setData({ ...data, settings: { ...data.settings, darkMode: !data.settings.darkMode } })}>
                  {data.settings.darkMode ? '🌙' : '☀️'}
                </button>
              </div>
              <div className="setting-item">
                <label>Daily Review Goal</label>
                <input type="number" value={data.settings.dailyGoal} onChange={(e) => setData({ ...data, settings: { ...data.settings, dailyGoal: parseInt(e.target.value) } })} />
              </div>
            </div>
            <div className="badges-section">
              <h3>🏆 Achievements</h3>
              <div className="badges-grid">
                <div className="badge"><span className="badge-icon">📚</span><span>Topics: {data.badges.topicsCreated}</span></div>
                <div className="badge"><span className="badge-icon">🃏</span><span>Cards: {data.badges.totalCards}</span></div>
                <div className="badge"><span className="badge-icon">🔥</span><span>Streak: {data.badges.streakDays} days</span></div>
                <div className="badge"><span className="badge-icon">✅</span><span>Reviews: {data.badges.totalReviews || data.cards.reduce((a, c) => a + (c.reviews || 0), 0)}</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
