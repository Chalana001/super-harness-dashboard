const SECRET_KEYS = /pass(word)?|api[_-]?key|access[_-]?token|cookie|secret|authorization|private[_-]?key|env/i
const SECRET_VALUE = /(?:sk-[A-Za-z0-9_-]{12,}|(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+|[A-Za-z0-9+/]{32,}={0,2})/g

export const REDACTED = '[REDACTED]'

export function redact(value, key = '') {
  if (SECRET_KEYS.test(key)) return REDACTED
  if (typeof value === 'string') return value.replace(SECRET_VALUE, REDACTED)
  if (Array.isArray(value)) return value.map((item) => redact(item))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]))
  return value
}

export function createInitialState(snapshot) {
  return {
    task: snapshot.task,
    currentAgent: snapshot.currentAgent || null,
    agents: Object.fromEntries(Object.entries(snapshot.agents || {}).map(([id, agent]) => [id, { ...agent, events: agent.events || [] }])),
    events: [],
    loops: snapshot.loops ? [...snapshot.loops] : [],
    metrics: { inputTokens: 0, outputTokens: 0, requests: 0, elapsed: '00:00', ...(snapshot.metrics || {}) },
    selectedAgent: snapshot.currentAgent || null,
  }
}

const agentIdFor = (event) => event.agentId || event.agent || null
const statusFromEvent = (event) => event.status === 'passed' ? 'completed' : event.status

export function reduceEvent(previous, rawEvent) {
  const event = redact(rawEvent)
  const next = { ...previous, agents: { ...previous.agents }, events: [...previous.events], loops: [...previous.loops], metrics: { ...previous.metrics } }
  const id = agentIdFor(event)
  const agent = id ? next.agents[id] : null
  const timestamp = event.timestamp || event.time || null
  const activity = event.activity || event.file || event.command || event.operation || null
  const append = (entry) => {
    next.events.push({ ...entry, timestamp })
    if (entry.agentId && next.agents[entry.agentId]) {
      const current = next.agents[entry.agentId]
      next.agents[entry.agentId] = { ...current, events: [...(current.events || []), entry] }
    }
  }

  if (event.type === 'agent.started') {
    if (!agent) return next
    next.agents[id] = { ...agent, status: 'running', model: event.model || agent.model, startedAt: timestamp, activity: activity || agent.activity }
    next.currentAgent = id
    next.selectedAgent = id
    append({ type: 'started', agentId: id, agent: agent.label, text: `${agent.label} started`, icon: '●' })
  } else if (event.type === 'agent.handoff') {
    if (event.from && next.agents[event.from]) next.agents[event.from] = { ...next.agents[event.from], status: 'completed' }
    if (event.to && next.agents[event.to]) next.agents[event.to] = { ...next.agents[event.to], status: 'running' }
    next.currentAgent = event.to || next.currentAgent
    next.selectedAgent = next.currentAgent
    append({ type: 'handoff', agentId: event.to, agent: next.agents[event.to]?.label || event.to, text: `handoff to ${next.agents[event.to]?.label || event.to}`, icon: '→' })
  } else if (event.type === 'agent.completed' || event.type === 'agent.failed' || event.type === 'agent.blocked' || event.type === 'qa.failed') {
    const status = event.type === 'qa.failed' ? 'failed' : statusFromEvent(event) || event.type.split('.')[1]
    if (agent) next.agents[id] = { ...agent, status, activity: event.reason || agent.activity, loop: event.loop || agent.loop }
    if (event.type === 'qa.failed' || event.loop) {
      const loop = { label: `${agent?.label || id} loop #${event.loop || 1}`, from: id, to: event.retryTo || event.to || id, via: event.retryTo ? 'retry' : 'debug' }
      next.loops.push(loop)
    }
    append({ type: status, agentId: id, agent: agent?.label || id, text: event.reason || `${agent?.label || id} ${status}`, icon: status === 'completed' ? '✓' : status === 'failed' ? '✕' : '⊘', loop: event.loop })
  } else if (event.type === 'tool.file_read' || event.type === 'tool.search' || event.type === 'tool.command' || event.type === 'tool.test' || event.type === 'activity') {
    if (agent) next.agents[id] = { ...agent, activity: activity || agent.activity }
    append({ type: 'activity', agentId: id, agent: agent?.label || id, text: activity || event.type, icon: '·' })
  } else if (event.type === 'run.status') {
    next.task = { ...next.task, status: event.status }
  } else if (event.type === 'run.metrics') {
    next.metrics = { ...next.metrics, ...event.metrics }
  }
  return next
}

export function replayEvents(snapshot, events) {
  return events.reduce(reduceEvent, createInitialState(snapshot))
}

export function scenarioToEvents(scenario) {
  const events = []
  Object.entries(scenario.agents).forEach(([id, agent]) => {
    if (agent.status === 'running' || agent.status === 'completed') events.push({ type: 'agent.started', agentId: id, model: agent.model, activity: agent.activity })
    if (agent.activity) events.push({ type: 'activity', agentId: id, activity: agent.activity })
    if (agent.status === 'failed') events.push({ type: 'agent.failed', agentId: id, reason: agent.activity, loop: agent.loop })
    if (agent.status === 'blocked') events.push({ type: 'agent.blocked', agentId: id, reason: agent.activity })
    if (agent.status === 'completed') events.push({ type: 'agent.completed', agentId: id, status: 'passed', reason: agent.activity })
  })
  scenario.events.forEach((event) => events.push({ type: event.type === 'complete' ? 'agent.completed' : event.type === 'failed' ? 'agent.failed' : event.type === 'blocked' ? 'agent.blocked' : event.type === 'retry' ? 'qa.failed' : event.type === 'handoff' ? 'agent.handoff' : 'activity', agentId: Object.entries(scenario.agents).find(([, agent]) => agent.label === event.agent)?.[0], activity: event.text, reason: event.text, loop: event.loop }))
  return events
}
