import { createInitialState, reduceEvent } from './harnessState.js'

export const CONTROL_COMMANDS = new Set(['pause', 'stop', 'retry', 'cancel'])
export function applyControl(previous, command, agentId = previous.currentAgent) {
  if (!CONTROL_COMMANDS.has(command)) return { state: previous, accepted: false }
  if (command === 'pause') return { state: reduceEvent(previous, { type: 'run.status', status: 'PAUSED' }), accepted: true }
  if (command === 'stop' || command === 'cancel') return { state: reduceEvent(previous, { type: 'run.status', status: 'CANCELLED' }), accepted: true }
  if (command === 'retry' && previous.agents[agentId]) return { state: reduceEvent(previous, { type: 'agent.started', agentId, activity: `Retrying ${previous.agents[agentId].label}` }), accepted: true }
  return { state: previous, accepted: false }
}
export function controlSmokeState() { return createInitialState({ task: { status: 'IMPLEMENTING' }, currentAgent: 'qa', agents: { qa: { label: 'QA', status: 'running' } } }) }
