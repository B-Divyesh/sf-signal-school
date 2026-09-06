export type Choice = {
  id: string;
  label: string;
  short: string;
  outcome: string;
  delivered: number;
  correct: boolean;
};

export type Round = {
  title: string;
  goal: string;
  partialIntel: string;
  teammate: string;
  choices: Choice[];
};

export type Scenario = {
  id: string;
  name: string;
  focus: 'Queues' | 'Redundancy' | 'Feedback';
  role: string;
  roleView: string;
  topology: string;
  debrief: string;
  rounds: Round[];
};

export type RunPhase = 'lobby' | 'active' | 'paused' | 'ended';

export type RunState = {
  phase: RunPhase;
  scenarioIndex: number;
  roundIndex: number;
  delivered: number;
  choices: string[];
  secondsLeft: number;
  end: 'won' | 'lost' | null;
  note: string;
};

const choice = (id: string, label: string, short: string, outcome: string, delivered: number, correct = false): Choice => ({ id, label, short, outcome, delivered, correct });

const coreScenarios: Scenario[] = [
  {
    id: 'tide-lines',
    name: 'Tide Lines',
    focus: 'Queues',
    role: 'Relay runner',
    roleView: 'You can see relay capacity, but not the full weather map.',
    topology: 'Two parallel relays join at the harbor.',
    debrief: 'A queue exposes the slowest relay, so split work before the bottleneck fills.',
    rounds: [
      {
        title: 'Round 1: two tide notes',
        goal: 'Deliver two notes before the west relay fills.',
        partialIntel: 'West relay holds one note this round.',
        teammate: 'Practice weather reader: “East cable can take one note.”',
        choices: [
          choice('split', 'Split one note across each relay', 'Split', 'Both notes reach the harbor.', 2, true),
          choice('west', 'Send both notes through West', 'West', 'One note waits in the west queue.', 1),
          choice('hold', 'Hold both notes at Shore', 'Hold', 'The storm clock advances while both notes wait.', 0)
        ]
      },
      {
        title: 'Round 2: spare cable',
        goal: 'Deliver two route cards while one cable may fail.',
        partialIntel: 'The west cable is frayed, but its relay is ready.',
        teammate: 'Practice harbor clerk: “One copy on each cable gives us a route after a break.”',
        choices: [
          choice('split', 'Use both cables, one card each', 'Split', 'The cards arrive on separate cables.', 2, true),
          choice('west', 'Use West for both cards', 'West', 'One card is delayed when West frays.', 1),
          choice('hold', 'Wait for a perfect weather report', 'Wait', 'The storm consumes the useful window.', 0)
        ]
      },
      {
        title: 'Round 3: status flag',
        goal: 'Deliver two final notes after a delayed status flag.',
        partialIntel: 'The east relay sent a status flag, but its meaning is hidden from you.',
        teammate: 'Practice signal keeper: “The flag says East is clear. Use the update.”',
        choices: [
          choice('split', 'Read the status, then split the notes', 'Read + split', 'The updated route clears both final notes.', 2, true),
          choice('west', 'Route both notes by the old plan', 'Old plan', 'One note meets the new west queue.', 1),
          choice('hold', 'Discard the delayed status flag', 'Discard', 'The last signal is sent without feedback.', 0)
        ]
      }
    ]
  },
  {
    id: 'fog-junction',
    name: 'Fog Junction',
    focus: 'Redundancy',
    role: 'Weather reader',
    roleView: 'You can see weather marks, but not message priority.',
    topology: 'A triangle relay joins through a fogged junction.',
    debrief: 'Redundancy costs a path now, but keeps a route when one link disappears.',
    rounds: [
      {
        title: 'Round 1: fog marker',
        goal: 'Deliver two notices through a fogged junction.',
        partialIntel: 'North path has a coral fog marker. South path has no marker.',
        teammate: 'Practice relay runner: “Each path can carry one notice.”',
        choices: [
          choice('split', 'Send one notice down each path', 'Split', 'Both notices clear the junction.', 2, true),
          choice('west', 'Send both notices North', 'North', 'Fog leaves one notice at the junction.', 1),
          choice('hold', 'Wait for the fog to lift', 'Wait', 'The storm timer moves first.', 0)
        ]
      },
      {
        title: 'Round 2: link break',
        goal: 'Keep two notices moving after a link break.',
        partialIntel: 'A pale-gold flag says the lower link still answers.',
        teammate: 'Practice harbor clerk: “A second live path matters more than a fast first path.”',
        choices: [
          choice('split', 'Share the load across live links', 'Share', 'The remaining links carry both notices.', 2, true),
          choice('west', 'Chase the old fast link', 'Old link', 'The broken link returns one notice.', 1),
          choice('hold', 'Store notices until all links return', 'Store', 'The storm reaches the storage relay.', 0)
        ]
      },
      {
        title: 'Round 3: harbor check',
        goal: 'Send two route confirmations with a backup.',
        partialIntel: 'The violet mark is moving toward the direct cable.',
        teammate: 'Practice signal keeper: “Keep one confirmation on the alternate cable.”',
        choices: [
          choice('split', 'Keep one confirmation on each route', 'Backup', 'The harbor receives both confirmations.', 2, true),
          choice('west', 'Use the direct cable twice', 'Direct', 'The weather mark delays the second confirmation.', 1),
          choice('hold', 'Stop routing during the check', 'Stop', 'No confirmation leaves before the storm.', 0)
        ]
      }
    ]
  },
  {
    id: 'headland-loop',
    name: 'Headland Loop',
    focus: 'Feedback',
    role: 'Harbor clerk',
    roleView: 'You can see message priority, but not cable condition.',
    topology: 'A looping relay returns status flags before the harbor.',
    debrief: 'Feedback turns a delayed signal into a better next decision.',
    rounds: [
      {
        title: 'Round 1: return flag',
        goal: 'Deliver two high-priority messages after a return flag.',
        partialIntel: 'Both messages are high priority, but only one path is immediately visible.',
        teammate: 'Practice weather reader: “The return flag clears the loop route.”',
        choices: [
          choice('split', 'Read the flag, then use both paths', 'Read + split', 'The loop returns in time for both messages.', 2, true),
          choice('west', 'Use the visible path twice', 'Visible', 'The second message meets a full relay.', 1),
          choice('hold', 'Ignore the return flag', 'Ignore', 'The unobserved loop is never used.', 0)
        ]
      },
      {
        title: 'Round 2: harbor echo',
        goal: 'Use the harbor echo to route two updates.',
        partialIntel: 'The harbor echoed the last update, but did not name the route.',
        teammate: 'Practice relay runner: “The echo means the outer relay is empty.”',
        choices: [
          choice('split', 'Use the echo and split updates', 'Use echo', 'Both updates take the clear loop.', 2, true),
          choice('west', 'Repeat the first route', 'Repeat', 'One update has no relay space.', 1),
          choice('hold', 'Wait without reading the echo', 'Wait', 'The loop window passes.', 0)
        ]
      },
      {
        title: 'Round 3: final acknowledgement',
        goal: 'Deliver two acknowledgements with the newest status.',
        partialIntel: 'The newest status is arriving now; old status is still on your clipboard.',
        teammate: 'Practice signal keeper: “Clear the old plan and follow the new flag.”',
        choices: [
          choice('split', 'Use the new flag and split acknowledgements', 'New flag', 'The final acknowledgements land together.', 2, true),
          choice('west', 'Follow the old status', 'Old status', 'One acknowledgement returns from a closed relay.', 1),
          choice('hold', 'Send no acknowledgement', 'No send', 'The harbor closes before confirmation.', 0)
        ]
      }
    ]
  }
];

const additionalPracticeCards: Array<Pick<Scenario, 'id' | 'name' | 'focus' | 'role' | 'roleView' | 'topology' | 'debrief'>> = [
  { id: 'beacon-steps', name: 'Beacon Steps', focus: 'Queues', role: 'Signal keeper', roleView: 'You can see return flags, but not the relay queue.', topology: 'Stepped beacon relays meet at a narrow harbor cable.', debrief: 'Queues build at the narrowest relay, so share work before the last cable fills.' },
  { id: 'channel-fork', name: 'Channel Fork', focus: 'Redundancy', role: 'Harbor clerk', roleView: 'You can see message priority, but not the fog line.', topology: 'A channel forks around two weather-marked buoys.', debrief: 'A second route protects delivery when a weather mark closes the first.' },
  { id: 'rain-shelf', name: 'Rain Shelf', focus: 'Feedback', role: 'Weather reader', roleView: 'You can see moving rain marks, but not dispatch order.', topology: 'A shelf relay returns an updated status along the shore.', debrief: 'Feedback helps the team change route when the newest status arrives.' },
  { id: 'foghorn-bend', name: 'Foghorn Bend', focus: 'Queues', role: 'Relay runner', roleView: 'You can see cable capacity, but not message priority.', topology: 'A bent cable joins a ferry relay before the harbor.', debrief: 'Compare capacity before sending work into the route that is already waiting.' },
  { id: 'harbor-spur', name: 'Harbor Spur', focus: 'Redundancy', role: 'Signal keeper', roleView: 'You can see flag changes, but not which cable is damaged.', topology: 'A harbor spur keeps an alternate relay open behind the coast.', debrief: 'Keep an alternate path ready before one route becomes unavailable.' }
];

export const scenarios: Scenario[] = [
  ...coreScenarios,
  ...additionalPracticeCards.map((card, index) => {
    const template = coreScenarios[index % coreScenarios.length];
    return {
      ...template,
      ...card,
      rounds: template.rounds.map((round, roundIndex) => ({ ...round, title: `Round ${roundIndex + 1}: ${card.name.toLowerCase()}` }))
    };
  })
];

export const freeScenarioCount = scenarios.length;

const premiumCards: Array<Pick<Scenario, 'id' | 'name' | 'focus' | 'role' | 'roleView' | 'topology' | 'debrief'>> = [
  { id: 'glass-causeway', name: 'Glass Causeway', focus: 'Queues', role: 'Signal keeper', roleView: 'You can see return flags, but not the queue sizes.', topology: 'A long causeway feeds two short harbor relays.', debrief: 'Queues reveal where waiting accumulates, so share work before the narrow link fills.' },
  { id: 'red-buoys', name: 'Red Buoys', focus: 'Redundancy', role: 'Harbor clerk', roleView: 'You can see message priority, but not moving weather.', topology: 'Three buoy links converge at one harbor marker.', debrief: 'A second path can protect the whole route when weather removes the first.' },
  { id: 'north-spur', name: 'North Spur', focus: 'Feedback', role: 'Weather reader', roleView: 'You can see the fog line, but not dispatch order.', topology: 'A north spur returns weather flags through a loop.', debrief: 'Use the newest feedback, because an old route can become the bottleneck.' },
  { id: 'quiet-ferry', name: 'Quiet Ferry', focus: 'Queues', role: 'Relay runner', roleView: 'You can see ferry capacity, but not message priority.', topology: 'A ferry relay alternates with an inland cable.', debrief: 'A finite queue needs a shared plan before waiting turns into loss.' },
  { id: 'violet-bend', name: 'Violet Bend', focus: 'Redundancy', role: 'Signal keeper', roleView: 'You can see flag changes, but not which cargo is urgent.', topology: 'A bent cable splits around a violet weather mark.', debrief: 'Redundant routes let the team keep moving when one signal changes.' },
  { id: 'low-water', name: 'Low Water', focus: 'Feedback', role: 'Harbor clerk', roleView: 'You can see harbor demand, but not cable status.', topology: 'A low-water relay sends an acknowledgement around the bay.', debrief: 'Feedback converts a return signal into the next better route.' },
  { id: 'copper-gate', name: 'Copper Gate', focus: 'Queues', role: 'Weather reader', roleView: 'You can see storm marks, but not gate capacity.', topology: 'A copper gate links two incoming relay lines.', debrief: 'The bottleneck is the gate with the least room, not the path that looks longest.' },
  { id: 'salt-steps', name: 'Salt Steps', focus: 'Redundancy', role: 'Relay runner', roleView: 'You can see relay slots, but not the full tide map.', topology: 'Stepped relays offer one high and one low route.', debrief: 'A backup route gives the group an option when a fast route fails.' },
  { id: 'outer-lamp', name: 'Outer Lamp', focus: 'Feedback', role: 'Signal keeper', roleView: 'You can see the lamp status, but not the harbor queue.', topology: 'An outer lamp echoes status through two island relays.', debrief: 'The last status flag is useful only when the team changes its route with it.' },
  { id: 'coral-cut', name: 'Coral Cut', focus: 'Queues', role: 'Harbor clerk', roleView: 'You can see outgoing priority, but not coral weather marks.', topology: 'A coral cut narrows three paths into one short cable.', debrief: 'Queue work at the narrow cut, then keep the rest of the network clear.' },
  { id: 'spare-arc', name: 'Spare Arc', focus: 'Redundancy', role: 'Weather reader', roleView: 'You can see the moving storm, but not spare capacity.', topology: 'An arc cable parallels a direct shore line.', debrief: 'One extra route matters when the storm turns an expected path into a risk.' },
  { id: 'echo-station', name: 'Echo Station', focus: 'Feedback', role: 'Relay runner', roleView: 'You can see relay capacity, but not every echo message.', topology: 'An echo station loops acknowledgements back to shore.', debrief: 'Feedback closes the loop between a shared decision and its next correction.' }
];

export const premiumScenarioSet: Scenario[] = premiumCards.map((card, index) => {
  const template = scenarios[index % scenarios.length];
  return {
    ...template,
    ...card,
    rounds: template.rounds.map((round, roundIndex) => ({ ...round, title: `Round ${roundIndex + 1}: ${card.name.toLowerCase()}` }))
  };
});

export const allScenarios = [...scenarios, ...premiumScenarioSet];

export const freshRun = (scenarioIndex = 0): RunState => ({
  phase: 'lobby', scenarioIndex, roundIndex: 0, delivered: 0, choices: [], secondsLeft: 180, end: null,
  note: 'Choose a route when the round begins.'
});

export const startRun = (state: RunState): RunState => ({ ...state, phase: 'active', note: 'Round 1 is open. Compare your partial view with the practice team.' });

export const currentScenario = (state: RunState) => allScenarios[state.scenarioIndex % allScenarios.length];
export const currentRound = (state: RunState) => currentScenario(state).rounds[state.roundIndex];

export const chooseRoute = (state: RunState, choiceId: string): RunState => {
  if (state.phase !== 'active') return state;
  const round = currentRound(state);
  const selected = round.choices.find((choice) => choice.id === choiceId);
  if (!selected) return state;
  const delivered = state.delivered + selected.delivered;
  const choices = [...state.choices, selected.id];
  const isLast = state.roundIndex === currentScenario(state).rounds.length - 1;
  if (isLast) {
    const won = delivered === 6;
    return {
      ...state, delivered, choices, roundIndex: state.roundIndex + 1, phase: 'ended', end: won ? 'won' : 'lost',
      note: won ? 'All six signals arrived before the storm.' : 'The harbor received fewer than six signals before the storm.'
    };
  }
  return {
    ...state, delivered, choices, roundIndex: state.roundIndex + 1,
    note: `${selected.outcome} Round ${state.roundIndex + 2} is open.`
  };
};

export const expireRun = (state: RunState): RunState => state.phase === 'active'
  ? { ...state, phase: 'ended', end: 'lost', secondsLeft: 0, note: 'The storm closed the relay before the run was complete.' }
  : state;

export const tickRun = (state: RunState, seconds: number): RunState => {
  if (state.phase !== 'active') return state;
  const secondsLeft = Math.max(0, state.secondsLeft - seconds);
  return secondsLeft === 0 ? expireRun({ ...state, secondsLeft }) : { ...state, secondsLeft };
};

export const restartRun = (state: RunState): RunState => startRun(freshRun(state.scenarioIndex));

export const togglePause = (state: RunState): RunState => {
  if (state.phase === 'active') return { ...state, phase: 'paused', note: 'Run paused. The storm clock is stopped.' };
  if (state.phase === 'paused') return { ...state, phase: 'active', note: 'Run resumed.' };
  return state;
};
