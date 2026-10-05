import WebSocket from 'ws'
import { createDashboardServer } from '../server/index.js'

const app = createDashboardServer({ port: 8799 })
const client = new WebSocket('ws://127.0.0.1:8799')
const messages = []
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('websocket smoke timeout')), 3000)
  client.on('message', (raw) => {
    const message = JSON.parse(raw.toString())
    messages.push(message)
    if (message.type === 'state.snapshot') {
      client.send(JSON.stringify({ type: 'event', event: { type: 'agent.started', agentId: 'code-writer-small', model: 'DeepSeek', apiKey: 'sk-secret-value' } }))
    }
    if (message.type === 'state.update') {
      clearTimeout(timeout)
      if (message.state.currentAgent !== 'code-writer-small') reject(new Error('state update failed'))
      if (JSON.stringify(message).includes('sk-secret-value')) reject(new Error('secret leaked'))
      resolve()
    }
  })
  client.on('error', reject)
})
client.close()
app.server.close()
console.log(`websocket smoke: passed (${messages.length} messages)`)
