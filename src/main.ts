import './styles.css';
import './repairs.css';
import { chooseRoute, currentRound, currentScenario, freeScenarioCount, freshRun, premiumScenarioSet, restartRun, startRun, tickRun, togglePause, type RunState } from './lib/game';
import { clearRun, loadRun, loadSettings, saveRun, saveSettings, type Settings } from './lib/storage';
import { RoomClient, type RoomState } from './lib/realtime';
import { captureLicenseFromUrl, loadLicenseState, verifyLicense, type LicenseState } from './lib/license';

const app = document.querySelector<HTMLDivElement>('#app')!;
let settings: Settings = loadSettings();
let roomClient: RoomClient | null = null;
let roomState: RoomState | null = null;
let roomStatus = '';
let gameState: RunState | null = null;
let demoMode = false;
let accumulator = 0;
let lastFrame = performance.now();
let frameId = 0;
let licenseState: LicenseState;

const isDemoRoute = () => location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char));

function setTitle(title: string, description: string) {
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://signal-school.sociobot.in${location.pathname}`);
}

function navigate(path: string) {
  history.pushState({}, '', path);
  renderRoute(true);
}

function copyDemoBanner() {
  return demoMode ? `<aside class="demo-banner" aria-label="Demo status"><strong>Demo — sample data, nothing is saved</strong><span>Practice teammates are simulated.</span><button class="quiet-button" data-action="reset-demo">Reset demo</button><a href="/" data-route>Start for real</a></aside>` : '';
}

function header() {
  return `<header class="site-header"><a class="wordmark" href="/" data-route aria-label="Signal School home"><span aria-hidden="true">⚑</span> Signal School</a><nav aria-label="Main navigation"><a href="/demo" data-route>Demo</a><a href="#how-to-play">How to play</a><a href="#scenario-set">Scenario set</a><a href="/privacy" data-route>Privacy</a></nav></header>`;
}

function footer() {
  return `<footer><p>Signal routing for small groups. No profiles or default analytics.</p><nav aria-label="Footer"><a href="/privacy" data-route>Privacy</a><a href="/terms" data-route>Terms</a><span>Built by Param Factory</span></nav><p class="build">Build 1.0.0</p></footer>`;
}

function gameBoard(state: RunState) {
  const scenario = currentScenario(state);
  const active = state.phase === 'active';
  const paused = state.phase === 'paused';
  const ended = state.phase === 'ended';
  const round = state.roundIndex < scenario.rounds.length ? currentRound(state) : scenario.rounds[scenario.rounds.length - 1];
  const remaining = `${Math.floor(state.secondsLeft / 60)}:${String(Math.floor(state.secondsLeft % 60)).padStart(2, '0')}`;
  const choices = active ? round.choices.map((choice, index) => `<button class="route-choice choice-${choice.id}" data-choice="${choice.id}" aria-keyshortcuts="${index + 1}"><b><span>${index + 1}</span> ${choice.short}</b><small>${choice.label}</small></button>`).join('') : '';
  const endHtml = ended ? `<section class="end-card ${state.end}" aria-live="assertive"><p class="eyebrow">${state.end === 'won' ? 'Harbor reached' : 'Storm reached the board'}</p><h2>${state.end === 'won' ? 'Six signals delivered' : 'Run ended'}</h2><p>${state.note}</p><p class="debrief"><strong>Debrief:</strong> ${scenario.debrief}</p><button class="primary-button" data-action="restart">Run this topology again</button><button class="secondary-button" data-action="next-scenario">Try another topology</button></section>` : '';
  return `<section class="game-shell" aria-labelledby="game-heading">
    <div class="game-topline"><div><p class="eyebrow">${demoMode ? 'Sample practice run' : 'Practice run'}</p><h2 id="game-heading">${escapeHtml(scenario.name)}</h2><p>${scenario.focus} · ${scenario.topology}</p></div><div class="storm-clock" aria-label="Storm clock: ${remaining} remaining"><span>Storm clock</span><b>${remaining}</b></div></div>
    <div class="board-layout">
      <section class="storm-board" aria-label="Partial relay network for ${scenario.role}">
        <div class="weather weather-a" aria-hidden="true">✦</div><div class="weather weather-b" aria-hidden="true">✦</div><div class="weather weather-c" aria-hidden="true">✦</div>
        <svg viewBox="0 0 640 360" role="img" aria-labelledby="map-title map-desc"><title id="map-title">Partial storm relay map</title><desc id="map-desc">Shore, two relays, and a harbor connected by signal lines. Only the ${scenario.role.toLowerCase()} view is shown.</desc><path class="wire wire-west" d="M110 260 L290 120 L510 220"/><path class="wire wire-east" d="M110 260 L312 278 L510 220"/><path class="wire wire-loop" d="M290 120 L312 278"/><g class="node shore"><circle cx="110" cy="260" r="38"/><text x="110" y="267">SHORE</text></g><g class="node west"><circle cx="290" cy="120" r="38"/><text x="290" y="127">WEST</text></g><g class="node east"><circle cx="312" cy="278" r="38"/><text x="312" y="285">EAST</text></g><g class="node harbor"><circle cx="510" cy="220" r="43"/><text x="510" y="227">HARBOR</text></g></svg>
        <div class="signal-flag flag-west" aria-label="West signal flag">⚑</div><div class="signal-flag flag-east" aria-label="East signal flag">⚑</div>
        <p class="map-caption">Your partial view: ${scenario.roleView}</p>
      </section>
      <aside class="round-panel" aria-live="polite">
        <p class="round-count">Round ${Math.min(state.roundIndex + 1, 3)} of 3</p>
        <h3>${ended ? 'Run summary' : paused ? 'Run paused' : round.title}</h3>
        <p>${ended ? `${state.delivered} of 6 signals delivered.` : paused ? 'Resume when the team is ready.' : round.goal}</p>
        ${!ended ? `<div class="intel"><p><b>Your partial view</b>${round.partialIntel}</p><p><b>Practice teammates</b>${round.teammate}</p></div>` : ''}
        ${choices ? `<div class="route-choices" aria-label="Route choices">${choices}</div>` : ''}
        ${state.phase === 'lobby' ? `<button class="primary-button" data-action="start">Start three rounds</button>` : ''}
        ${paused ? `<button class="primary-button" data-action="pause">Resume run</button>` : ''}
        ${active ? `<button class="secondary-button compact" data-action="pause">Pause run</button>` : ''}
        <p class="status-note">${state.note}</p>
      </aside>
    </div>
    ${endHtml}
    <div class="game-tools"><button class="quiet-button" data-action="toggle-motion" aria-pressed="${settings.reducedMotion}">Motion: ${settings.reducedMotion ? 'reduced' : 'standard'}</button><span>Keys: 1, 2, 3 choose a route.</span></div>
  </section>`;
}

function roomPanel() {
  const playerRows = roomState?.players.map((player) => `<li><span>${escapeHtml(player.name)}</span><small>${player.role}${player.connected ? '' : ' · reconnecting'}</small></li>`).join('') || '';
  const isHost = roomState?.players.find((player) => player.isHost)?.id === localStorage.getItem('signal-school:room-client');
  const ready = roomState && roomState.players.filter((player) => player.connected).length >= 2;
  const roundChoices = roomState?.phase === 'active' ? `<div class="route-choices online-choices">${['split', 'west', 'hold'].map((id, index) => `<button class="route-choice choice-${id}" data-room-choice="${id}"><b><span>${index + 1}</span> ${id === 'split' ? 'Split' : id === 'west' ? 'Direct' : 'Hold'}</b><small>Submit this plan to the room.</small></button>`).join('')}</div>` : '';
  const result = roomState?.phase === 'ended' ? `<section class="room-result ${roomState.end}" aria-live="assertive"><h3>${roomState.end === 'won' ? 'Six signals delivered' : 'Shared run ended'}</h3><p>${roomState.note}</p></section>` : '';
  return `<section class="room-panel" aria-labelledby="room-title"><p class="eyebrow">Online room</p><h2 id="room-title">${roomState ? `Room ${roomState.code}` : 'Play with real teammates'}</h2>${roomState ? `<p>Your role: <b>${roomState.ownRole}</b>. ${roomState.ownIntel}</p><p>${roomState.note}</p><ul class="room-players">${playerRows}</ul>${roomState.phase === 'lobby' ? `<p>${ready ? 'Two or more players are connected.' : 'Invite one teammate before starting.'}</p>${isHost ? `<button class="primary-button" data-room-action="start" ${ready ? '' : 'disabled'}>Start shared run</button>` : '<p>Waiting for the room host to start.</p>'}` : ''}${roundChoices}${result}${roomState.phase === 'ended' && isHost ? '<button class="primary-button" data-room-action="restart">Restart shared run</button>' : ''}<button class="quiet-button" data-room-action="leave">Leave room</button>` : `<p>Create a short-code room, then share the code. Each player gets a different role view.</p><form class="room-form" data-form="create-room"><label>Your name<input name="name" maxlength="24" required value="Signal keeper" /></label><button class="primary-button">Create room</button></form><form class="room-form" data-form="join-room"><label>Room code<input name="code" maxlength="6" required autocapitalize="characters" /></label><label>Your name<input name="name" maxlength="24" required value="Signal keeper" /></label><button class="secondary-button">Join room</button></form>`}<p class="status-note" aria-live="polite">${roomStatus}</p></section>`;
}

function landing() {
  demoMode = isDemoRoute();
  if (!gameState) {
    gameState = loadRun(demoMode) || freshRun(demoMode ? 0 : 0);
    if (demoMode && gameState.phase === 'lobby') gameState = startRun(gameState);
  }
  const state = gameState;
  const premiumCards = premiumScenarioSet.map((scenario, index) => `<li data-role-view="${escapeHtml(scenario.role)}">${licenseState.status === 'valid' ? `<button class="quiet-button" data-premium="${index}">${scenario.name}</button>` : `<b>${scenario.name}</b>`}<small>${scenario.role} view: ${scenario.roleView}</small></li>`).join('');
  const premiumAccess = licenseState.status === 'valid' ? '<p class="unlock-note">Your verified license opens the Scenario Set.</p>' : '<p>The offer is not registered yet, so checkout and activation are unavailable.</p>';
  const online = demoMode ? '' : `<section class="online-section" aria-labelledby="online-heading"><div><p class="eyebrow">Real multiplayer</p><h2 id="online-heading">Coordinate in a room</h2><p>Share a short code. Your teammates see different network details.</p></div>${roomPanel()}</section>`;
  return `${header()}${copyDemoBanner()}<main id="main" tabindex="-1"><section class="first-screen"><div class="intro-copy"><p class="eyebrow">Cooperative browser game</p><h1 tabindex="-1">Route signals together before the storm</h1><p class="lede">For small groups who want to discuss queues, bottlenecks, redundancy, and feedback while they play.</p><div class="intro-actions"><a class="primary-button" href="/demo" data-route>Try it with sample data</a><span>Opens a three-round practice run.</span></div><ul class="facts"><li>Two to four players</li><li>Three finite rounds</li><li>No profiles or default analytics</li></ul></div>${gameBoard(state)}</section>${online}<section id="how-to-play" class="how-section" aria-labelledby="how-heading"><p class="eyebrow">How to play</p><h2 id="how-heading">How a run works</h2><ol><li><b>Read your view.</b> Each role sees one part of the network.</li><li><b>Talk through routes.</b> Choose a route before the storm advances.</li><li><b>Review the result.</b> Three rounds end with one short debrief.</li></ol></section><section class="limits-section" aria-labelledby="limits-heading"><h2 id="limits-heading">What Signal School does not do</h2><p>It does not grade people, create learner profiles, connect to an LMS, or claim to certify skills.</p><p>Practice runs are stored in this browser. The sample run uses a separate storage area.</p></section><section id="scenario-set" class="scenario-section" aria-labelledby="set-heading"><p class="eyebrow">One-time scenario set</p><h2 id="set-heading">Twelve more topologies</h2><p>The built-in Scenario Set adds twelve topology cards and rotating role views. It is a one-time purchase when the offer is registered.</p>${premiumAccess}<ul class="scenario-cards" aria-label="Scenario Set topology cards">${premiumCards}</ul><p><a href="/terms" data-route>Read the offer terms</a></p></section></main>${footer()}`;
}

function legalPage(kind: 'privacy' | 'terms') {
  const privacy = kind === 'privacy';
  const title = privacy ? 'Privacy — Signal School' : 'Terms — Signal School';
  setTitle(title, privacy ? 'How Signal School stores practice and room data.' : 'Terms for Signal School.');
  return `${header()}<main id="main" tabindex="-1" class="legal"><p class="eyebrow">Signal School</p><h1 tabindex="-1">${privacy ? 'Privacy' : 'Terms'}</h1>${privacy ? `<h2>What is stored</h2><p>Practice-run progress and your motion setting stay in this browser. Sample data uses keys that begin with <code>demo:signal-school:</code> and does not change your practice run.</p><h2>Online rooms</h2><p>Online rooms store a room code, player-selected names, role assignment, shared choices, and room state on the Signal School room service. Rooms are for gameplay, not profiles.</p><h2>What is not used</h2><p>Signal School has no default analytics, advertising tracker, learner profile, or third-party font or script.</p><h2>Delete local data</h2><p>Use your browser storage controls to delete local practice data. Leave a room to stop reconnecting.</p>` : `<h2>Game access</h2><p>Signal School provides a free practice run and online rooms. It is a game, not training certification.</p><h2>Scenario Set</h2><p>The one-time Scenario Set is built into this release. It is not registered for sale yet. There is no checkout, license activation, or current price.</p><h2>Future purchase</h2><p>When registered, the Scenario Set will use Sociobot billing. The merchant will provide the price, refund terms, and a license token. The game verifies that token at the documented product endpoint.</p><h2>Restore a license</h2><p>After registration, paste a license token from the purchase email to restore access on this browser.</p><form class="license-form" data-form="restore-license"><label for="license-token">License token</label><input id="license-token" name="license" autocomplete="off" required><button class="primary-button">Restore license</button></form><p class="status-note" aria-live="polite">${licenseState.status === 'unavailable' ? 'License verification is unavailable because the offer is not registered.' : ''}</p><h2>Contact</h2><p>Contact the Param Factory through the product catalogue for support.</p>`}</main>${footer()}`;
}

function notFound() {
  setTitle('Page not found — Signal School', 'The requested Signal School page was not found.');
  return `${header()}<main id="main" tabindex="-1" class="legal"><p class="eyebrow">Signal School</p><h1>Page not found</h1><p>This route is not on the relay board.</p><p><a class="primary-button" href="/" data-route>Return to the game</a></p></main>${footer()}`;
}

function renderRoute(moveFocus = false) {
  const path = location.pathname;
  if (isDemoRoute() && roomClient) {
    roomClient.close();
    roomClient = null;
    roomState = null;
    roomStatus = '';
  }
  if (path === '/' || path === '/demo') {
    setTitle(path === '/demo' ? 'Demo — Signal School' : 'Signal School — route signals together', 'A cooperative signal-routing game for two to four players.');
    app.innerHTML = landing();
  } else if (path === '/privacy') app.innerHTML = legalPage('privacy');
  else if (path === '/terms') app.innerHTML = legalPage('terms');
  else app.innerHTML = notFound();
  bindEvents();
  if (moveFocus) {
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLElement>('h1');
    heading?.focus();
  }
}

function saveAndRender() {
  if (gameState) saveRun(demoMode, gameState);
  renderRoute();
}

function ensureRoomClient() {
  if (roomClient) return roomClient;
  roomClient = new RoomClient();
  roomClient.onState = (state) => { roomState = state; renderRoute(); };
  roomClient.onStatus = (status) => { roomStatus = status; renderRoute(); };
  return roomClient;
}

function bindEvents() {
  document.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    gameState = null;
    navigate(link.getAttribute('href') || '/');
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((button) => button.addEventListener('click', () => {
    if (!gameState) return;
    gameState = chooseRoute(gameState, button.dataset.choice || '');
    saveAndRender();
  }));
  document.querySelector<HTMLButtonElement>('[data-action="start"]')?.addEventListener('click', () => { if (gameState) { gameState = startRun(gameState); saveAndRender(); } });
  document.querySelector<HTMLButtonElement>('[data-action="restart"]')?.addEventListener('click', () => { if (gameState) { gameState = restartRun(gameState); saveAndRender(); } });
  document.querySelector<HTMLButtonElement>('[data-action="next-scenario"]')?.addEventListener('click', () => { if (gameState) { gameState = startRun(freshRun((gameState.scenarioIndex + 1) % freeScenarioCount)); saveAndRender(); } });
  document.querySelector<HTMLButtonElement>('[data-action="pause"]')?.addEventListener('click', () => { if (gameState) { gameState = togglePause(gameState); saveAndRender(); } });
  document.querySelector<HTMLButtonElement>('[data-action="reset-demo"]')?.addEventListener('click', () => { clearRun(true); gameState = startRun(freshRun()); saveAndRender(); });
  document.querySelector<HTMLButtonElement>('[data-action="toggle-motion"]')?.addEventListener('click', () => { settings = { ...settings, reducedMotion: !settings.reducedMotion }; saveSettings(settings); document.documentElement.dataset.reduceMotion = String(settings.reducedMotion); renderRoute(); });
  document.querySelector<HTMLFormElement>('[data-form="create-room"]')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.currentTarget as HTMLFormElement); ensureRoomClient().create(String(data.get('name') || '')); });
  document.querySelector<HTMLFormElement>('[data-form="join-room"]')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.currentTarget as HTMLFormElement); ensureRoomClient().join(String(data.get('code') || ''), String(data.get('name') || '')); });
  document.querySelector<HTMLButtonElement>('[data-room-action="start"]')?.addEventListener('click', () => ensureRoomClient().start());
  document.querySelector<HTMLButtonElement>('[data-room-action="restart"]')?.addEventListener('click', () => ensureRoomClient().restart());
  document.querySelector<HTMLButtonElement>('[data-room-action="leave"]')?.addEventListener('click', () => {
    roomClient?.leave();
    roomClient = null;
    roomState = null;
    roomStatus = 'You left this room. Enter a code to join again.';
    renderRoute();
  });
  document.querySelectorAll<HTMLButtonElement>('[data-room-choice]').forEach((button) => button.addEventListener('click', () => ensureRoomClient().choose(button.dataset.roomChoice || '')));
  document.querySelectorAll<HTMLButtonElement>('[data-premium]').forEach((button) => button.addEventListener('click', () => {
    if (licenseState.status !== 'valid') return;
    gameState = startRun(freshRun(freeScenarioCount + Number(button.dataset.premium || 0)));
    saveAndRender();
  }));
  document.querySelector<HTMLFormElement>('[data-form="restore-license"]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const token = String(new FormData(event.currentTarget as HTMLFormElement).get('license') || '').trim();
    if (!token) return;
    localStorage.setItem('sb_license:signal-school', token);
    licenseState = { status: 'checking', token, checkedAt: null };
    renderRoute();
    void verifyLicense(token).then((next) => { licenseState = next; renderRoute(); });
  });
}

function loop(now: number) {
  const elapsed = Math.min(250, now - lastFrame);
  lastFrame = now;
  if (!document.hidden && gameState?.phase === 'active') {
    accumulator += elapsed / 1000;
    let changed = false;
    while (accumulator >= 1 / 60) {
      gameState = tickRun(gameState, 1 / 60);
      accumulator -= 1 / 60;
      changed = true;
    }
    if (changed && Math.floor(gameState.secondsLeft) !== Math.floor(gameState.secondsLeft + elapsed / 1000)) {
      saveRun(demoMode, gameState);
      const clock = document.querySelector('.storm-clock b');
      if (clock) clock.textContent = `${Math.floor(gameState.secondsLeft / 60)}:${String(Math.floor(gameState.secondsLeft % 60)).padStart(2, '0')}`;
    }
    if (gameState.phase === 'ended') saveAndRender();
  }
  frameId = requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || !gameState || gameState.phase !== 'active') return;
  const keys: Record<string, string> = { '1': 'split', '2': 'west', '3': 'hold' };
  if (keys[event.key]) { event.preventDefault(); gameState = chooseRoute(gameState, keys[event.key]); saveAndRender(); }
});
window.addEventListener('popstate', () => { gameState = null; renderRoute(true); });
document.documentElement.dataset.reduceMotion = String(settings.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches);
captureLicenseFromUrl();
licenseState = loadLicenseState();
if (licenseState.status === 'checking' && licenseState.token && !isDemoRoute()) {
  void verifyLicense(licenseState.token).then((next) => { licenseState = next; renderRoute(); });
}
renderRoute();
if (!isDemoRoute()) ensureRoomClient().resumeSaved();
frameId = requestAnimationFrame(loop);
window.addEventListener('beforeunload', () => cancelAnimationFrame(frameId));
