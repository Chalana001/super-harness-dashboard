export const agentOrder = [
  'planner',
  'phase-controller',
  'code-writer-small',
  'code-reviewer',
  'frontend-ui-qa',
  'qa',
  'final-review',
  'git-agent',
]

const baseAgents = {
  planner: { label: 'Planner', short: 'PLANNER', model: 'GPT Luna', status: 'completed', elapsed: '02:14', input: 12400, output: 900, requests: 4 },
  'phase-controller': { label: 'Phase Controller', short: 'PHASE CTRL', model: 'GPT Luna', status: 'completed', elapsed: '00:31', input: 6800, output: 500, requests: 2 },
  'code-writer-small': { label: 'Code Writer', short: 'CODE WRITER', model: 'DeepSeek v4.1', status: 'running', activity: 'Reading frontend/pos-frontend/src/pages/POS.jsx', elapsed: '00:42', input: 18400, output: 2100, requests: 11 },
  'code-reviewer': { label: 'Code Review', short: 'CODE REVIEW', model: 'GPT Luna', status: 'waiting', input: 0, output: 0, requests: 0 },
  'frontend-ui-qa': { label: 'Frontend UI QA', short: 'FRONTEND UI QA', model: 'Kimi Coding', status: 'waiting', input: 0, output: 0, requests: 0, conditional: true },
  qa: { label: 'QA', short: 'QA', model: 'GLM 5.3', status: 'waiting', input: 0, output: 0, requests: 0 },
  'final-review': { label: 'Final Review', short: 'FINAL REVIEW', model: 'GPT Luna', status: 'waiting', input: 0, output: 0, requests: 0 },
  'git-agent': { label: 'Git', short: 'GIT', model: 'GPT Luna', status: 'waiting', input: 0, output: 0, requests: 0 },
}

const baseEvents = [
  { time: '22:41:03', icon: '✓', type: 'complete', agent: 'Planner', text: 'Planner completed' },
  { time: '22:41:04', icon: '✓', type: 'complete', agent: 'Phase Controller', text: 'Phase Controller selected SMALL' },
  { time: '22:41:06', icon: '●', type: 'running', agent: 'Code Writer', text: 'Code Writer started' },
  { time: '22:41:12', icon: '·', type: 'activity', agent: 'Code Writer', text: 'read POS.jsx' },
  { time: '22:41:19', icon: '·', type: 'activity', agent: 'Code Writer', text: 'search "saleMode"' },
  { time: '22:41:28', icon: '·', type: 'activity', agent: 'Code Writer', text: 'read AppConfigurationContext.jsx' },
  { time: '22:41:35', icon: '·', type: 'activity', agent: 'Code Writer', text: 'run npm test' },
]

const cloneAgents = () => Object.fromEntries(Object.entries(baseAgents).map(([id, agent]) => [id, { ...agent }]))
const cloneEvents = () => baseEvents.map((event) => ({ ...event }))

export const scenarios = {
  live: {
    label: 'Live implementation', taskStatus: 'IMPLEMENTING', currentAgent: 'code-writer-small', agents: cloneAgents(), events: cloneEvents(), loops: [], metrics: { inputTokens: 18400, outputTokens: 2100, requests: 11, elapsed: '03:27' },
  },
  success: {
    label: 'Normal success', taskStatus: 'COMPLETED', currentAgent: 'git-agent', agents: { ...cloneAgents(), 'code-writer-small': { ...baseAgents['code-writer-small'], status: 'completed', elapsed: '01:42', activity: 'Updated held-bills flow' }, 'code-reviewer': { ...baseAgents['code-reviewer'], status: 'completed', elapsed: '00:48' }, 'frontend-ui-qa': { ...baseAgents['frontend-ui-qa'], status: 'completed', elapsed: '01:06' }, qa: { ...baseAgents.qa, status: 'completed', elapsed: '01:18' }, 'final-review': { ...baseAgents['final-review'], status: 'completed', elapsed: '00:39' }, 'git-agent': { ...baseAgents['git-agent'], status: 'running', activity: 'Preparing commit', elapsed: '00:08' } }, events: [...cloneEvents(), { time: '22:42:11', icon: '✓', type: 'complete', agent: 'Code Review', text: 'Code Review passed' }, { time: '22:43:09', icon: '✓', type: 'complete', agent: 'Frontend UI QA', text: 'UI QA passed' }, { time: '22:44:27', icon: '✓', type: 'complete', agent: 'QA', text: 'QA passed' }, { time: '22:45:06', icon: '→', type: 'handoff', agent: 'Git', text: 'handoff to Git' }], loops: [], metrics: { inputTokens: 73300, outputTokens: 9400, requests: 42, elapsed: '06:11' },
  },
  'ui-loop': {
    label: 'UI QA retry loop', taskStatus: 'TESTING', currentAgent: 'code-writer-small', agents: { ...cloneAgents(), 'code-writer-small': { ...baseAgents['code-writer-small'], activity: 'Fixing responsive layout issue', elapsed: '00:18' }, 'code-reviewer': { ...baseAgents['code-reviewer'], status: 'completed', elapsed: '00:48' }, 'frontend-ui-qa': { ...baseAgents['frontend-ui-qa'], status: 'failed', elapsed: '00:32', loop: 1, activity: 'Responsive layout issue' } }, events: [...cloneEvents(), { time: '22:42:02', icon: '✕', type: 'failed', agent: 'Frontend UI QA', text: 'UI QA failed · Responsive layout issue', loop: 1 }, { time: '22:42:04', icon: '↻', type: 'retry', agent: 'Code Writer', text: 'Loop #1 · retrying writer' }], loops: [{ label: 'UI QA loop #1', from: 'frontend-ui-qa', to: 'code-writer-small', via: 'retry' }], metrics: { inputTokens: 38200, outputTokens: 5200, requests: 24, elapsed: '04:02' },
  },
  'qa-loop': {
    label: 'QA debug loop', taskStatus: 'TESTING', currentAgent: 'qa', agents: { ...cloneAgents(), 'code-writer-small': { ...baseAgents['code-writer-small'], status: 'completed', elapsed: '01:42' }, 'code-reviewer': { ...baseAgents['code-reviewer'], status: 'completed', elapsed: '00:48' }, 'frontend-ui-qa': { ...baseAgents['frontend-ui-qa'], status: 'completed', elapsed: '01:06' }, qa: { ...baseAgents.qa, status: 'running', activity: 'Running regression suite', elapsed: '00:27', loop: 1 }, 'final-review': { ...baseAgents['final-review'], status: 'waiting' } }, events: [...cloneEvents(), { time: '22:43:15', icon: '✕', type: 'failed', agent: 'QA', text: 'QA failed · Regression in held bills', loop: 1 }, { time: '22:43:20', icon: '↻', type: 'retry', agent: 'Debug/Fix', text: 'Debug/Fix completed · returning to QA' }], loops: [{ label: 'QA loop #1', from: 'qa', to: 'qa', via: 'debug' }], metrics: { inputTokens: 51400, outputTokens: 6300, requests: 31, elapsed: '05:14' },
  },
  blocked: {
    label: 'Blocked UI QA', taskStatus: 'BLOCKED', currentAgent: 'frontend-ui-qa', agents: { ...cloneAgents(), 'code-writer-small': { ...baseAgents['code-writer-small'], status: 'completed', elapsed: '01:42' }, 'code-reviewer': { ...baseAgents['code-reviewer'], status: 'completed', elapsed: '00:48' }, 'frontend-ui-qa': { ...baseAgents['frontend-ui-qa'], status: 'blocked', activity: 'Waiting for browser environment', elapsed: '00:55' } }, events: [...cloneEvents(), { time: '22:42:30', icon: '⊘', type: 'blocked', agent: 'Frontend UI QA', text: 'Blocked · browser environment unavailable' }], loops: [], metrics: { inputTokens: 29600, outputTokens: 3800, requests: 19, elapsed: '03:58' },
  },
}
