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

type PlanId = 'split' | 'west' | 'hold';
type PlanRound = [string, string, string, string, PlanId, [string, string, string]];

const roleViews = {
  'Relay runner': 'You can see relay capacity, but not the full weather map.',
  'Weather reader': 'You can see weather marks, but not message priority.',
  'Harbor clerk': 'You can see message priority, but not cable condition.',
  'Signal keeper': 'You can see return flags, but not each relay queue.'
} as const;

const planIds: PlanId[] = ['split', 'west', 'hold'];

const makeRound = ([title, goal, partialIntel, teammate, correct, plans]: PlanRound): Round => ({
  title,
  goal,
  partialIntel,
  teammate,
  choices: planIds.map((id, index) => {
    const plan = plans[index];
    const isCorrect = id === correct;
    const delivered = isCorrect ? 2 : index === 2 ? 0 : 1;
    return {
      id,
      short: plan,
      label: `Choose ${plan.toLowerCase()}`,
      outcome: isCorrect ? `${plan} clears both signals.` : `${plan} leaves ${delivered === 1 ? 'one signal waiting' : 'both signals waiting'}.`,
      delivered,
      correct: isCorrect
    };
  })
});

const makeScenario = (
  id: string,
  name: string,
  focus: Scenario['focus'],
  role: keyof typeof roleViews,
  topology: string,
  debrief: string,
  rounds: PlanRound[]
): Scenario => ({ id, name, focus, role, roleView: roleViews[role], topology, debrief, rounds: rounds.map(makeRound) });

// Each card has its own goals, partial information, teammate report, plans,
// and outcomes. A name or topology is never a cosmetic wrapper around another
// card's playable rounds.
export const scenarios: Scenario[] = [
  makeScenario('tide-lines', 'Tide Lines', 'Queues', 'Relay runner', 'Two parallel relays join at the harbor.', 'A queue exposes the slowest relay, so split work before the bottleneck fills.', [
    ['Round 1: two tide notes', 'Deliver two notes before the west relay fills.', 'West relay holds one note this round.', 'Practice weather reader: “East cable can take one note.”', 'split', ['Split', 'Fill West', 'Hold shore']],
    ['Round 2: spare cable', 'Deliver two route cards while one cable may fail.', 'The west cable is frayed, but its relay is ready.', 'Practice harbor clerk: “One copy on each cable gives us a route after a break.”', 'split', ['Use both cables', 'Trust West', 'Wait for calm']],
    ['Round 3: status flag', 'Deliver two final notes after a delayed status flag.', 'The east relay sent a status flag, but its meaning is hidden from you.', 'Practice signal keeper: “The flag says East is clear. Use the update.”', 'split', ['Read + split', 'Old plan', 'Discard flag']]
  ]),
  makeScenario('fog-junction', 'Fog Junction', 'Redundancy', 'Weather reader', 'A triangle relay joins through a fogged junction.', 'Redundancy costs a path now, but keeps a route when one link disappears.', [
    ['Round 1: fog marker', 'Deliver two notices through a fogged junction.', 'North path has a coral fog marker. South path has no marker.', 'Practice relay runner: “Each path can carry one notice.”', 'split', ['Share paths', 'Use North', 'Wait for fog']],
    ['Round 2: link break', 'Keep two notices moving after a link break.', 'A pale-gold flag says the lower link still answers.', 'Practice harbor clerk: “A second live path matters more than a fast first path.”', 'split', ['Share live links', 'Chase old link', 'Store notices']],
    ['Round 3: harbor check', 'Send two route confirmations with a backup.', 'The violet mark is moving toward the direct cable.', 'Practice signal keeper: “Keep one confirmation on the alternate cable.”', 'split', ['Keep backup', 'Use direct twice', 'Stop routing']]
  ]),
  makeScenario('headland-loop', 'Headland Loop', 'Feedback', 'Harbor clerk', 'A looping relay returns status flags before the harbor.', 'Feedback turns a delayed signal into a better next decision.', [
    ['Round 1: return flag', 'Deliver two high-priority messages after a return flag.', 'Both messages are high priority, but only one path is immediately visible.', 'Practice weather reader: “The return flag clears the loop route.”', 'split', ['Read + split', 'Use visible path', 'Ignore loop']],
    ['Round 2: harbor echo', 'Use the harbor echo to route two updates.', 'The harbor echoed the last update, but did not name the route.', 'Practice relay runner: “The echo means the outer relay is empty.”', 'split', ['Use echo', 'Repeat first route', 'Wait silently']],
    ['Round 3: final acknowledgement', 'Deliver two acknowledgements with the newest status.', 'The newest status is arriving now; old status is still on your clipboard.', 'Practice signal keeper: “Clear the old plan and follow the new flag.”', 'split', ['Follow new flag', 'Use old status', 'Send nothing']]
  ]),
  makeScenario('beacon-steps', 'Beacon Steps', 'Queues', 'Signal keeper', 'Stepped beacon relays meet at a narrow harbor cable.', 'Queues build at the narrowest relay, so share work before the last cable fills.', [
    ['Round 1: lower lantern', 'Move two lantern reports before the lower step closes.', 'Your green return flag says the lower step has only one open slot.', 'Practice relay runner: “The upper step is empty, even though it looks longer.”', 'split', ['Use both steps', 'Fill lower step', 'Keep reports']],
    ['Round 2: lamp queue', 'Route two lamp changes while the middle beacon is busy.', 'The status flag from the middle beacon is already amber.', 'Practice weather reader: “The outer cable is clear for this minute.”', 'west', ['Divide lamps', 'Use outer cable', 'Wait at beacon']],
    ['Round 3: harbor flash', 'Send two final flashes before the harbor cable fills.', 'Your latest flag says the harbor cable is taking a return signal.', 'Practice harbor clerk: “Send the urgent flash on the inland branch first.”', 'split', ['Pair branches', 'Use harbor cable', 'Hold flashes']]
  ]),
  makeScenario('channel-fork', 'Channel Fork', 'Redundancy', 'Harbor clerk', 'A channel forks around two weather-marked buoys.', 'A second route protects delivery when a weather mark closes the first.', [
    ['Round 1: buoy priority', 'Deliver one medical and one weather message around the fork.', 'The medical message must reach Harbor first.', 'Practice weather reader: “The red buoy is drifting into the north channel.”', 'split', ['Cover both channels', 'Send north first', 'Wait for buoy']],
    ['Round 2: crossing wake', 'Keep two messages moving after a ferry wake cuts one channel.', 'Harbor can accept a message from the south channel now.', 'Practice relay runner: “The north rope has slack but the south rope is live.”', 'west', ['Duplicate routes', 'Use south channel', 'Park messages']],
    ['Round 3: clear-water flag', 'Deliver two confirmations while one buoy goes dark.', 'The confirmation for the ferry is lower priority.', 'Practice signal keeper: “The clear-water flag is on the east branch.”', 'split', ['Use each branch', 'Repeat east', 'Hold confirmations']]
  ]),
  makeScenario('rain-shelf', 'Rain Shelf', 'Feedback', 'Weather reader', 'A shelf relay returns an updated status along the shore.', 'Feedback helps the team change route when the newest status arrives.', [
    ['Round 1: rain edge', 'Send two shelf reports before the rain edge crosses shore.', 'The rain edge moved away from the outer shelf.', 'Practice harbor clerk: “Harbor needs the tide report before the cargo report.”', 'west', ['Use both shelves', 'Use outer shelf', 'Wait for rain']],
    ['Round 2: returned reading', 'Deliver two readings after a delayed gauge report.', 'Your gauge update says the inner shelf has flooded.', 'Practice relay runner: “The shore cable has room for both readings.”', 'west', ['Split shelves', 'Use shore cable', 'Trust old gauge']],
    ['Round 3: changing line', 'Route two closing signals using the latest rain line.', 'The new rain line makes the outer shelf unsafe again.', 'Practice signal keeper: “The return flag was raised after the weather update.”', 'hold', ['Use outer shelf', 'Send by shore', 'Wait for flag']]
  ]),
  makeScenario('foghorn-bend', 'Foghorn Bend', 'Queues', 'Relay runner', 'A bent cable joins a ferry relay before the harbor.', 'Compare capacity before sending work into the route that is already waiting.', [
    ['Round 1: ferry bell', 'Deliver two bell notices before the ferry relay loads.', 'The ferry relay has one free hook.', 'Practice weather reader: “The inland bend has no fog mark.”', 'split', ['Share ferry + bend', 'Load ferry twice', 'Hold bells']],
    ['Round 2: bent cable', 'Move two dock cards while the bend is under repair.', 'The bend can carry a single card safely.', 'Practice harbor clerk: “The second card is not urgent.”', 'west', ['Use both routes', 'Send urgent by bend', 'Store dock cards']],
    ['Round 3: last crossing', 'Deliver two final crossing passes before tide turn.', 'The ferry queue now has two empty hooks.', 'Practice signal keeper: “The inland flag is down.”', 'west', ['Split crossings', 'Use ferry queue', 'Wait for tide']]
  ]),
  makeScenario('harbor-spur', 'Harbor Spur', 'Redundancy', 'Signal keeper', 'A harbor spur keeps an alternate relay open behind the coast.', 'Keep an alternate path ready before one route becomes unavailable.', [
    ['Round 1: spur flag', 'Deliver two cargo marks while the coast cable flickers.', 'Your flag shows the harbor spur is still answering.', 'Practice relay runner: “The coast cable has one reliable slot.”', 'split', ['Use coast + spur', 'Trust coast', 'Hold cargo']],
    ['Round 2: alternate mark', 'Keep two route marks moving after the coast cable goes dark.', 'The status flag changed from gold to coral on the coast.', 'Practice weather reader: “The inland spur is dry.”', 'west', ['Send both ways', 'Use inland spur', 'Wait for coast']],
    ['Round 3: return pennant', 'Send two final pennants before the backup closes.', 'Your return pennant says the spur closes after this pass.', 'Practice harbor clerk: “The urgent pennant is for Harbor.”', 'split', ['Pair coast + spur', 'Use spur twice', 'Keep pennants']]
  ])
];

const premiumScenarioSetData: Scenario[] = [
  makeScenario('glass-causeway', 'Glass Causeway', 'Queues', 'Signal keeper', 'A long causeway feeds two short harbor relays.', 'Queues reveal where waiting accumulates, so share work before the narrow link fills.', [
    ['Round 1: causeway slots', 'Deliver two glass-case notes before the near relay fills.', 'Your flag shows one open slot at the near relay.', 'Practice relay runner: “The far relay is empty but slower.”', 'split', ['Use near + far', 'Fill near relay', 'Keep cases']],
    ['Round 2: cracked pane', 'Route two repair slips while a pane blocks the direct cable.', 'The return flag marks the direct cable as unstable.', 'Practice weather reader: “The far relay has clear air.”', 'west', ['Split repair slips', 'Use far relay', 'Wait for repair']],
    ['Round 3: shore queue', 'Deliver two closing slips before the causeway queue reaches three.', 'The flag from shore says two messages are already queued there.', 'Practice harbor clerk: “Harbor can accept one slip from each relay.”', 'split', ['Share relays', 'Use shore queue', 'Hold closing slips']]
  ]),
  makeScenario('red-buoys', 'Red Buoys', 'Redundancy', 'Harbor clerk', 'Three buoy links converge at one harbor marker.', 'A second path can protect the whole route when weather removes the first.', [
    ['Round 1: priority buoy', 'Deliver a rescue note and a supply note through the buoys.', 'The rescue note must arrive before the supply note.', 'Practice weather reader: “The west buoy is red but the south buoy is clear.”', 'west', ['Send both by buoys', 'Use south buoy', 'Wait for color']],
    ['Round 2: drifting pair', 'Route two checks as two buoys drift together.', 'Harbor has room for both checks if they arrive apart.', 'Practice relay runner: “The east rope still has one slot.”', 'split', ['Use east + south', 'Use east twice', 'Store checks']],
    ['Round 3: marker loss', 'Deliver two final calls after one buoy marker disappears.', 'The supply call can take the longer safe line.', 'Practice signal keeper: “The south flag is raised.”', 'split', ['Keep two lines', 'Repeat south', 'Wait for marker']]
  ]),
  makeScenario('north-spur', 'North Spur', 'Feedback', 'Weather reader', 'A north spur returns weather flags through a loop.', 'Use the newest feedback, because an old route can become the bottleneck.', [
    ['Round 1: cold front', 'Send two front notices before the north wind shifts.', 'The fresh weather mark is north of the loop, not on it.', 'Practice harbor clerk: “Harbor needs the wind notice before the dock notice.”', 'west', ['Divide notices', 'Use loop route', 'Wait for wind']],
    ['Round 2: loop reply', 'Deliver two updates after the spur returns a reply.', 'The reply says the direct spur is closed.', 'Practice relay runner: “The coastal branch is empty.”', 'west', ['Use both branches', 'Use coastal branch', 'Repeat direct']],
    ['Round 3: late flag', 'Route two final updates while the old map is still visible.', 'The newest flag moves the safe line inland.', 'Practice signal keeper: “The old green flag is no longer current.”', 'hold', ['Follow old map', 'Use direct spur', 'Wait for latest flag']]
  ]),
  makeScenario('quiet-ferry', 'Quiet Ferry', 'Queues', 'Relay runner', 'A ferry relay alternates with an inland cable.', 'A finite queue needs a shared plan before waiting turns into loss.', [
    ['Round 1: silent deck', 'Deliver two deck passes before the ferry leaves.', 'The ferry deck accepts one pass this crossing.', 'Practice weather reader: “The inland cable has no rain mark.”', 'split', ['Use ferry + inland', 'Use ferry twice', 'Keep passes']],
    ['Round 2: inland load', 'Move two manifest cards while the inland cable is busy.', 'The inland cable holds one card at a time.', 'Practice harbor clerk: “One manifest can arrive after the ferry return.”', 'west', ['Split manifests', 'Use ferry first', 'Wait at dock']],
    ['Round 3: return slot', 'Deliver two last tags as the ferry returns.', 'The ferry now has two empty deck slots.', 'Practice signal keeper: “The inland cable flag is red.”', 'west', ['Use both routes', 'Load ferry deck', 'Hold tags']]
  ]),
  makeScenario('violet-bend', 'Violet Bend', 'Redundancy', 'Signal keeper', 'A bent cable splits around a violet weather mark.', 'Redundant routes let the team keep moving when one signal changes.', [
    ['Round 1: violet marker', 'Deliver two bend notes while the violet mark approaches.', 'Your flag says the outer bend remains open.', 'Practice relay runner: “The inner bend has room for only one note.”', 'split', ['Use inner + outer', 'Use inner twice', 'Wait at bend']],
    ['Round 2: cable shadow', 'Keep two notices moving as the violet mark covers the inner bend.', 'The status flag confirms the inner bend is blocked.', 'Practice weather reader: “The outer cable is dry.”', 'west', ['Copy on both bends', 'Use outer bend', 'Wait for mark']],
    ['Round 3: spare route', 'Send two confirmations before the outer bend also narrows.', 'Your final flag says Harbor accepts one direct confirmation.', 'Practice harbor clerk: “The backup confirmation can use the shore cable.”', 'split', ['Direct + shore', 'Use outer twice', 'Hold confirmations']]
  ]),
  makeScenario('low-water', 'Low Water', 'Feedback', 'Harbor clerk', 'A low-water relay sends an acknowledgement around the bay.', 'Feedback converts a return signal into the next better route.', [
    ['Round 1: depth report', 'Deliver two depth reports after an acknowledgement.', 'Harbor needs the shallow-channel report first.', 'Practice weather reader: “The acknowledgement opens the bay loop.”', 'split', ['Read + pair routes', 'Use channel twice', 'Ignore reply']],
    ['Round 2: bay echo', 'Move two tide notices using the latest bay echo.', 'The echo confirms the shallow channel has closed.', 'Practice relay runner: “The offshore line has two open slots.”', 'west', ['Use both lines', 'Use offshore line', 'Use old channel']],
    ['Round 3: return current', 'Route two final notices after the current changes.', 'The newest acknowledgement reverses the preferred order.', 'Practice signal keeper: “The prior flag was replaced.”', 'hold', ['Repeat prior order', 'Use bay loop', 'Wait for new reply']]
  ]),
  makeScenario('copper-gate', 'Copper Gate', 'Queues', 'Weather reader', 'A copper gate links two incoming relay lines.', 'The bottleneck is the gate with the least room, not the path that looks longest.', [
    ['Round 1: gate rain', 'Deliver two gate keys before rain reaches the copper lock.', 'Rain is falling on the west approach, not the east approach.', 'Practice relay runner: “The gate accepts one key from each approach.”', 'split', ['Use both approaches', 'Use west approach', 'Keep keys']],
    ['Round 2: crowded lock', 'Move two access slips while the gate queue is full.', 'Your weather mark shows the east approach remains dry.', 'Practice harbor clerk: “One slip is urgent; Harbor can take it now.”', 'west', ['Share approaches', 'Use east approach', 'Wait at lock']],
    ['Round 3: final latch', 'Deliver two latch reports before the gate closes.', 'The rain mark now covers the east approach.', 'Practice signal keeper: “The west return flag is clear.”', 'west', ['Use both approaches', 'Use west approach', 'Hold reports']]
  ]),
  makeScenario('salt-steps', 'Salt Steps', 'Redundancy', 'Relay runner', 'Stepped relays offer one high and one low route.', 'A backup route gives the group an option when a fast route fails.', [
    ['Round 1: high step', 'Deliver two salt notices while the high step is windy.', 'The high relay has one dry slot.', 'Practice weather reader: “The low route has no spray mark.”', 'split', ['Use high + low', 'Use high twice', 'Wait on shore']],
    ['Round 2: low step', 'Keep two samples moving when the high rope snaps.', 'The high relay capacity has dropped to zero.', 'Practice harbor clerk: “The first sample must reach Harbor now.”', 'west', ['Use both steps', 'Use low route', 'Keep samples']],
    ['Round 3: braided rope', 'Send two final sample tags with one route as backup.', 'The high relay is back but its flag is uncertain.', 'Practice signal keeper: “The low route flag is steady.”', 'split', ['Braided routes', 'Use high twice', 'Wait for certainty']]
  ]),
  makeScenario('outer-lamp', 'Outer Lamp', 'Feedback', 'Signal keeper', 'An outer lamp echoes status through two island relays.', 'The last status flag is useful only when the team changes its route with it.', [
    ['Round 1: lamp echo', 'Deliver two lamp settings after the outer lamp replies.', 'Your lamp flag shows the island relay has power.', 'Practice weather reader: “The inner island has fog.”', 'west', ['Use both islands', 'Use outer island', 'Wait for lamp']],
    ['Round 2: faded flag', 'Route two repair requests after a flag fades.', 'The faded flag belongs to the inner island, not the outer one.', 'Practice relay runner: “The outer relay can carry both requests.”', 'west', ['Split requests', 'Use outer relay', 'Repeat inner route']],
    ['Round 3: final pulse', 'Deliver two pulses using the last lamp update.', 'Your newest flag says the outer lamp will blink once more.', 'Practice harbor clerk: “Harbor can read one pulse from each island.”', 'split', ['Use both islands', 'Use outer twice', 'Keep pulses']]
  ]),
  makeScenario('coral-cut', 'Coral Cut', 'Queues', 'Harbor clerk', 'A coral cut narrows three paths into one short cable.', 'Queue work at the narrow cut, then keep the rest of the network clear.', [
    ['Round 1: cut priority', 'Deliver an urgent coral survey and a routine log.', 'The coral survey is urgent at Harbor.', 'Practice weather reader: “The south inlet has no coral mark.”', 'west', ['Use two inlets', 'Use south inlet', 'Wait at cut']],
    ['Round 2: narrow cable', 'Move two records before the short cable queue fills.', 'Harbor can receive one record from the long inlet.', 'Practice relay runner: “The north inlet has only one free slot.”', 'split', ['Use long + north', 'Use north twice', 'Store records']],
    ['Round 3: outgoing tide', 'Send two final logs as the coral cut narrows again.', 'The routine log can take the long inlet.', 'Practice signal keeper: “The north flag turned coral.”', 'split', ['Share the inlets', 'Use long twice', 'Hold logs']]
  ]),
  makeScenario('spare-arc', 'Spare Arc', 'Redundancy', 'Weather reader', 'An arc cable parallels a direct shore line.', 'One extra route matters when the storm turns an expected path into a risk.', [
    ['Round 1: arc weather', 'Deliver two arc notices before the direct line floods.', 'A weather mark is moving toward the direct shore line.', 'Practice relay runner: “The arc cable has one spare slot.”', 'split', ['Use arc + direct', 'Use direct twice', 'Wait for weather']],
    ['Round 2: flooded line', 'Keep two notices moving after the shore line floods.', 'Your latest mark covers the direct line completely.', 'Practice harbor clerk: “Harbor can wait for the second notice.”', 'west', ['Use each route', 'Use spare arc', 'Hold notices']],
    ['Round 3: returning spray', 'Deliver two final checks while spray reaches the arc.', 'The new mark leaves the direct line briefly clear.', 'Practice signal keeper: “The arc flag is lowering.”', 'split', ['Use direct + arc', 'Use direct twice', 'Wait for calm']]
  ]),
  makeScenario('echo-station', 'Echo Station', 'Feedback', 'Relay runner', 'An echo station loops acknowledgements back to shore.', 'Feedback closes the loop between a shared decision and its next correction.', [
    ['Round 1: first echo', 'Deliver two station notes after the first echo.', 'The outer relay has room only after the echo returns.', 'Practice weather reader: “The inner route has a fog mark.”', 'west', ['Use both relays', 'Use outer relay', 'Send before echo']],
    ['Round 2: corrected path', 'Route two corrections after the station changes its echo.', 'The corrected echo removes the inner route.', 'Practice harbor clerk: “The first correction must arrive now.”', 'west', ['Split corrections', 'Use outer relay', 'Follow old echo']],
    ['Round 3: loop close', 'Send two final acknowledgements with the closing echo.', 'The last echo says Harbor opened the shore relay.', 'Practice signal keeper: “The outer flag is now red.”', 'west', ['Use both relays', 'Use shore relay', 'Keep acknowledgements']]
  ])
];

export const freeScenarioCount = scenarios.length;
export const premiumScenarioSet = premiumScenarioSetData;
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
    return { ...state, delivered, choices, roundIndex: state.roundIndex + 1, phase: 'ended', end: won ? 'won' : 'lost', note: won ? 'All six signals arrived before the storm.' : 'The harbor received fewer than six signals before the storm.' };
  }
  return { ...state, delivered, choices, roundIndex: state.roundIndex + 1, note: `${selected.outcome} Round ${state.roundIndex + 2} is open.` };
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
