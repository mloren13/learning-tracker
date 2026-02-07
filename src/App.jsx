import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

// LocalStorage key
const STORAGE_KEY = 'learning-tracker-data'

// Default data structure
const defaultData = {
  topics: [
    {
      id: 'philosophy',
      name: 'Philosophy',
      description: 'Deep exploration of fundamental questions',
      phase: 2,
      status: 'in_progress',
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
      branches: ['METAPHYSICS', 'EPISTEMOLOGY', 'ETHICS', 'LOGIC', 'PHILOSOPHY OF MIND', 'AESTHETICS'],
      phases: [
        { id: 1, name: 'The Map', status: 'complete', description: 'Major branches and connections understood' },
        { id: 2, name: 'Ethics Deep Dive', status: 'pending', description: 'Aristotle, Plato, Hume, Kant, Nietzsche' },
        { id: 3, name: 'Meaning and Existence', status: 'pending', description: 'Kierkegaard, Nietzsche, Heidegger, Sartre, Camus' }
      ]
    }
  ],
  cards: [
    { id: 'c1', topicId: 'philosophy', front: 'What is the difference between Metaphysics and Ethics?', back: 'Metaphysics asks "What is real?" Ethics asks "What is good?" - Different questions, different branches.', ease: 2.5, interval: 1, nextReview: Date.now() },
    { id: 'c2', topicId: 'philosophy', front: 'Can Ethics stand alone from Metaphysics?', back: 'Yes. Knowing metaphysical facts doesn\'t tell you moral values - you need a separate framework for ethics.', ease: 2.5, interval: 1, nextReview: Date.now() },
    { id: 'c3', topicId: 'philosophy', front: 'What is Ontology?', back: 'A subset of metaphysics that asks "What categories of things exist?"', ease: 2.5, interval: 1, nextReview: Date.now() }
  ],
  sessions: [],
  currentView: 'dashboard'
}

function App() {
  const [data, setData] = useState(defaultData)
  const [activeTab, setActiveTab] = useState('topics')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [quizMode, setQuizMode] = useState(false)
  const [quizCardIndex, setQuizCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [newCardFront, setNewCardFront] = useState('')
  const [newCardBack, setNewCardBack] = useState('')
  const [showAddCard, setShowAddCard] = useState(false)

  // Load from localStorage
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
        console.error('Failed to load data:', e)
      }
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  // Spaced repetition grading
  const gradeCard = (cardId, quality) => {
    const card = data.cards.find(c => c.id === cardId)
    if (!card) return

    // SM-2 algorithm simplified
    let newEase = card.ease
    let newInterval = card.interval

    if (quality >= 3) {
      if (card.interval === 1) newInterval = 6
      else if (card.interval < 30) newInterval = Math.round(card.interval * card.ease)
      else newInterval = Math.round(card.interval * card.ease * 1.3)
    } else {
      newInterval = 1
      newEase = Math.max(1.3, card.ease - 0.2)
    }

    const updatedCards = data.cards.map(c =>
      c.id === cardId ? { ...c, ease: newEase, interval: newInterval, nextReview: Date.now() + newInterval * 24 * 60 * 60 * 1000 } : c
    )

    setData({ ...data, cards: updatedCards })

    // Move to next card
    const topicCards = data.cards.filter(c => c.topicId === selectedTopic?.id)
    const nextIndex = quizCardIndex + 1
    if (nextIndex < topicCards.length) {
      setQuizCardIndex(nextIndex)
      setShowAnswer(false)
    } else {
      setQuizMode(false)
      setQuizCardIndex(0)
    }
  }

  // Add new card
  const addCard = () => {
    if (!newCardFront.trim() || !newCardBack.trim() || !selectedTopic) return

    const newCard = {
      id: 'c' + Date.now(),
      topicId: selectedTopic.id,
      front: newCardFront,
      back: newCardBack,
      ease: 2.5,
      interval: 1,
      nextReview: Date.now()
    }

    setData({ ...data, cards: [...data.cards, newCard] })
    setNewCardFront('')
    setNewCardBack('')
    setShowAddCard(false)
  }

  // Create new topic
  const createTopic = () => {
    const name = prompt('Topic name:')
    if (!name) return

    const newTopic = {
      id: 't' + Date.now(),
      name,
      description: '',
      phase: 1,
      status: 'not_started',
      entryQuestions: [],
      positions: {},
      keyIdeas: [],
      branches: [],
      phases: [{ id: 1, name: 'Getting Started', status: 'pending', description: '' }]
    }

    setData({ ...data, topics: [...data.topics, newTopic] })
    setSelectedTopic(newTopic)
  }

  // Update topic
  const updateTopic = (field, value) => {
    if (!selectedTopic) return
    const updatedTopics = data.topics.map(t =>
      t.id === selectedTopic.id ? { ...t, [field]: value } : t
    )
    setData({ ...data, topics: updatedTopics })
    setSelectedTopic({ ...selectedTopic, [field]: value })
  }

  // Add entry question
  const addEntryQuestion = () => {
    const text = prompt('Entry question:')
    if (!text || !selectedTopic) return
    const newQ = { id: 'q' + Date.now(), text }
    updateTopic('entryQuestions', [...selectedTopic.entryQuestions, newQ])
  }

  // Add key idea
  const addKeyIdea = () => {
    const text = prompt('Key idea:')
    if (!text || !selectedTopic) return
    const newIdea = { id: 'i' + Date.now(), text }
    updateTopic('keyIdeas', [...selectedTopic.keyIdeas, newIdea])
  }

  // Update position
  const updatePosition = (key, value) => {
    if (!selectedTopic) return
    updateTopic('positions', { ...selectedTopic.positions, [key]: value })
  }

  // Delete topic
  const deleteTopic = (topicId) => {
    if (!confirm('Delete this topic and all its cards?')) return
    const updatedTopics = data.topics.filter(t => t.id !== topicId)
    const updatedCards = data.cards.filter(c => c.topicId !== topicId)
    setData({ ...data, topics: updatedTopics, cards: updatedCards })
    if (selectedTopic?.id === topicId) {
      setSelectedTopic(updatedTopics[0] || null)
    }
  }

  // Progress chart data
  const getProgressData = () => {
    const sessions = data.sessions.slice(-30)
    return sessions.map((s, i) => ({
      day: i + 1,
      cards: s.cardsReviewed || 0
    }))
  }

  // Get cards due for review
  const getDueCards = () => {
    if (!selectedTopic) return []
    return data.cards.filter(c =>
      c.topicId === selectedTopic.id && c.nextReview <= Date.now()
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🧠 Learning Tracker</h1>
        <nav className="nav">
          <button className={activeTab === 'topics' ? 'active' : ''} onClick={() => setActiveTab('topics')}>Topics</button>
          <button className={activeTab === 'review' ? 'active' : ''} onClick={() => setActiveTab('review')}>Review</button>
          <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>Stats</button>
        </nav>
      </header>

      <main className="main">
        {activeTab === 'topics' && (
          <div className="topics-view">
            <div className="topics-sidebar">
              <button className="new-topic-btn" onClick={createTopic}>+ New Topic</button>
              <div className="topic-list">
                {data.topics.map(topic => (
                  <div
                    key={topic.id}
                    className={`topic-item ${selectedTopic?.id === topic.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedTopic(topic); setQuizMode(false); }}
                  >
                    <span className="topic-name">{topic.name}</span>
                    <span className={`topic-status ${topic.status}`}>
                      {topic.status === 'complete' ? '✓' : topic.status === 'in_progress' ? '→' : '○'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedTopic ? (
              <div className="topic-content">
                <div className="topic-header">
                  <input
                    type="text"
                    className="topic-title-input"
                    value={selectedTopic.name}
                    onChange={(e) => updateTopic('name', e.target.value)}
                  />
                  <button className="delete-btn" onClick={() => deleteTopic(selectedTopic.id)}>Delete</button>
                </div>

                <textarea
                  className="topic-description"
                  placeholder="Topic description..."
                  value={selectedTopic.description}
                  onChange={(e) => updateTopic('description', e.target.value)}
                />

                <div className="topic-sections">
                  {/* Entry Questions */}
                  <section className="topic-section">
                    <h3>Entry Questions</h3>
                    {selectedTopic.entryQuestions.map(q => (
                      <div key={q.id} className="entry-question">
                        <span>❓ {q.text}</span>
                      </div>
                    ))}
                    <button className="add-btn" onClick={addEntryQuestion}>+ Add Question</button>
                  </section>

                  {/* Positions */}
                  <section className="topic-section">
                    <h3>My Positions</h3>
                    <div className="position-inputs">
                      {Object.entries(selectedTopic.positions).map(([key, value]) => (
                        <div key={key} className="position-field">
                          <label>{key}</label>
                          <textarea
                            value={value}
                            onChange={(e) => updatePosition(key, e.target.value)}
                            placeholder={`Your position on ${key}...`}
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Key Ideas */}
                  <section className="topic-section">
                    <h3>Key Ideas</h3>
                    <div className="key-ideas">
                      {selectedTopic.keyIdeas.map(idea => (
                        <div key={idea.id} className="key-idea">
                          <span>💡 {idea.text}</span>
                        </div>
                      ))}
                    </div>
                    <button className="add-btn" onClick={addKeyIdea}>+ Add Key Idea</button>
                  </section>

                  {/* Phases */}
                  <section className="topic-section">
                    <h3>Phases / Progress</h3>
                    <div className="phases">
                      {selectedTopic.phases?.map(phase => (
                        <div key={phase.id} className={`phase ${phase.status}`}>
                          <span className="phase-name">{phase.name}</span>
                          <span className="phase-status">{phase.status}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Quick Review */}
                <div className="quick-review">
                  <h3>Quick Review</h3>
                  {getDueCards().length > 0 ? (
                    <button className="review-btn" onClick={() => { setQuizMode(true); setQuizCardIndex(0); setShowAnswer(false); }}>
                      Review {getDueCards().length} cards due
                    </button>
                  ) : (
                    <p className="all-caught-up">All caught up! 🎉</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Select a topic or create a new one to get started</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="review-view">
            <div className="review-header">
              <h2>Spaced Repetition Review</h2>
              <select
                value={selectedTopic?.id || ''}
                onChange={(e) => {
                  const topic = data.topics.find(t => t.id === e.target.value)
                  setSelectedTopic(topic)
                }}
              >
                <option value="">Select topic...</option>
                {data.topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {selectedTopic && (
              <>
                {quizMode ? (
                  <div className="quiz-mode">
                    {(() => {
                      const topicCards = data.cards.filter(c => c.topicId === selectedTopic.id)
                      if (topicCards.length === 0) {
                        return <div className="no-cards">No cards for this topic. Add some first!</div>
                      }
                      const card = topicCards[quizCardIndex] || topicCards[0]
                      return (
                        <div className="flashcard">
                          <div className="card-progress">
                            {quizCardIndex + 1} / {topicCards.length}
                          </div>
                          <div className="card-content">
                            <div className="card-front">
                              <span className="card-label">Question</span>
                              <p>{card.front}</p>
                            </div>
                            {showAnswer && (
                              <div className="card-back">
                                <span className="card-label">Answer</span>
                                <p>{card.back}</p>
                              </div>
                            )}
                          </div>
                          <div className="card-actions">
                            {!showAnswer ? (
                              <button className="show-answer-btn" onClick={() => setShowAnswer(true)}>Show Answer</button>
                            ) : (
                              <>
                                <button className="grade-btn hard" onClick={() => gradeCard(card.id, 1)}>Hard</button>
                                <button className="grade-btn good" onClick={() => gradeCard(card.id, 3)}>Good</button>
                                <button className="grade-btn easy" onClick={() => gradeCard(card.id, 5)}>Easy</button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="add-card-form">
                    <h3>Add New Card</h3>
                    <input
                      type="text"
                      placeholder="Front (question)"
                      value={newCardFront}
                      onChange={(e) => setNewCardFront(e.target.value)}
                    />
                    <textarea
                      placeholder="Back (answer)"
                      value={newCardBack}
                      onChange={(e) => setNewCardBack(e.target.value)}
                    />
                    <button className="add-card-btn" onClick={addCard}>Add Card</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-view">
            <h2>Learning Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">{data.topics.length}</span>
                <span className="stat-label">Topics</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{data.cards.length}</span>
                <span className="stat-label">Cards</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {data.cards.filter(c => c.nextReview <= Date.now()).length}
                </span>
                <span className="stat-label">Due Today</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {data.cards.filter(c => c.interval > 7).length}
                </span>
                <span className="stat-label">Mastered</span>
              </div>
            </div>

            <div className="progress-chart">
              <h3>Cards Reviewed (Last 30 Sessions)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={getProgressData()}>
                  <XAxis dataKey="day" hide />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cards" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
