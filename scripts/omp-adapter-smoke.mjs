import { createOmpAdapter, normalizeOmpEvent } from '../server/ompAdapter.js'

const received = []
const adapter = createOmpAdapter({ publishEvent: (event) => received.push(event) })
if (!adapter.ingest({ type: 'agent.started', agent: 'code writer', model: 'DeepSeek' })) throw new Error('known event rejected')
if (received[0].agentId !== 'code-writer-small') throw new Error('agent mapping failed')
if (adapter.ingest({ type: 'unknown.event', agent: 'qa' })) throw new Error('unknown event accepted')
if (normalizeOmpEvent({ type: 'tool.file_read', agent: 'qa', file: 'secret=sk-abc123456789' }).type !== 'tool.file_read') throw new Error('tool event normalization failed')
console.log('OMP adapter smoke: passed')
