import { chooseRoute, freshRun, premiumScenarioSet, restartRun, startRun } from '../src/lib/game';
import { describe, expect, it } from 'vitest';

describe('practice run rules', () => {
  it('@claim:three-round-ending ends a fully delivered practice run after three rounds', () => {
    let run = startRun(freshRun());
    run = chooseRoute(run, 'split');
    run = chooseRoute(run, 'split');
    run = chooseRoute(run, 'split');
    expect(run.phase).toBe('ended');
    expect(run.end).toBe('won');
    expect(run.delivered).toBe(6);
    expect(run.roundIndex).toBe(3);
  });

  it('@claim:restart-reset clears delivered signals and opens round one', () => {
    let run = startRun(freshRun());
    run = chooseRoute(run, 'split');
    const restarted = restartRun(run);
    expect(restarted.phase).toBe('active');
    expect(restarted.roundIndex).toBe(0);
    expect(restarted.delivered).toBe(0);
    expect(restarted.choices).toEqual([]);
  });

  it('@claim:scenario-set-content provides twelve different paid topology cards', () => {
    expect(premiumScenarioSet).toHaveLength(12);
    expect(new Set(premiumScenarioSet.map((scenario) => scenario.topology)).size).toBe(12);
    expect(new Set(premiumScenarioSet.map((scenario) => scenario.role)).size).toBe(4);
  });
});
