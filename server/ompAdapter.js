const AGENT_ALIASES = {
  planner: 'planner',
  'phase-controller': 'phase-controller',
  'phase controller': 'phase-controller',
  'code-writer-small': 'code-writer-small',
  'code writer': 'code-writer-small',
  'code-reviewer': 'code-reviewer',
  'code review': 'code-reviewer',
  'frontend-ui-qa': 'frontend-ui-qa',
  'frontend ui qa': 'frontend-ui-qa',
  'ui qa': 'frontend-ui-qa',
  qa: 'qa',
  'final-review': 'final-review',
  'final review': 'final-review',
  git: 'git-agent',
  'git-agent': 'git-agent',
}

const EVENT_TYPES = new Set(['agent.started', 'agent.completed', 'agent.failed', 'agent.blocked', 'agent.handoff', 'tool.file_read', 'tool.search', 'tool.command', 'tool.test', 'qa.failed', 'run.status', 'run.metrics', 'activity'])

const normalizeAgent = (value) => {
  if (!value) return null
  const key = String(value).trim().toLowerCase()
  return AGENT_ALIASES[key] || key
}

export function normalizeOmpEvent(input) {
  if (!input || typeof input !== 'object') return null
  const type = String(input.type || input.event || '').toLowerCase()
  if (!EVENT_TYPES.has(type)) return null
  const event = { ...input, type }
  if (event.agent) event.agentId = normalizeAgent(event.agent)
  if (event.from) event.from = normalizeAgent(event.from)
  if (event.to) event.to = normalizeAgent(event.to)
  if (event.agentId) event.agentId = normalizeAgent(event.agentId)
  if (type === 'agent.completed' && event.status === 'passed') event.status = 'passed'
  if (type === 'qa.failed' && !event.reason && event.message) event.reason = event.message
  return event
}

export function createOmpAdapter({ publishEvent, logger = () => {} } = {}) {
  if (typeof publishEvent !== 'function') throw new TypeError('publishEvent is required')
  return {
    ingest(input) {
      const event = normalizeOmpEvent(input)
      if (!event) {
        logger({ level: 'debug', message: 'Ignored unsupported OMP event', type: input?.type || input?.event })
        return false
      }
      publishEvent(event)
      return true
    },
  }
}
