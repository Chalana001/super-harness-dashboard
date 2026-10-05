import { WebSocketServer } from 'ws'
import { createInitialState, reduceEvent, redact } from '../src/state/harnessState.js'
import { applyControl } from '../src/state/controls.js'
import { scenarios } from '../src/data/mockRun.js'
import { createOmpAdapter } from './ompAdapter.js'

export const PORT = Number(process.env.PORT || 8787)

export function createRunState() {
  const scenario = scenarios.live
  return createInitialState({ task: { title: 'Add Quick Sale Held Bills', status: scenario.taskStatus }, currentAgent: scenario.currentAgent, agents: scenario.agents, metrics: scenario.metrics })
}

export function createDashboardServer({ port = PORT, initialState = createRunState() } = {}) {
  const server = new WebSocketServer({ port })
  let state = initialState
  const broadcast = (message) => {
    const payload = JSON.stringify(redact(message))
    server.clients.forEach((client) => { if (client.readyState === 1) client.send(payload) })
  }
  const publishEvent = (event) => { state = reduceEvent(state, event); broadcast({ type: 'state.update', state, event }) }
  const publishControl = (command, agentId) => {
    const result = applyControl(state, command, agentId)
    if (!result.accepted) return false
    state = result.state
    broadcast({ type: 'state.update', state, control: command })
    return true
  }
  const omp = createOmpAdapter({ publishEvent })
  server.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'state.snapshot', state: redact(state) }))
    socket.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString())
        if (message.type === 'event' && message.event) publishEvent(message.event)
        if (message.type === 'control' && !publishControl(message.command, message.agentId)) socket.send(JSON.stringify({ type: 'error', error: 'Unsupported control command' }))
        if (message.type === 'omp.event' && message.event) omp.ingest(message.event)
      } catch { socket.send(JSON.stringify({ type: 'error', error: 'Invalid websocket message' })) }
    })
  })
  return { server, publishEvent, publishControl, ingestOmpEvent: omp.ingest, getState: () => state }
}

if (process.argv[1]?.endsWith('server/index.js')) createDashboardServer()
