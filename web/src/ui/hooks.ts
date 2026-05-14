import { useMemo } from 'react';
import { useStore } from './AppStore';
import { computeScore, leaderboard, type ReadinessInputs } from '@/domain/scoring';
import type { Score, Startup } from '@/domain/types';

export function useScoreFor(startupId: string): Score | undefined {
  const { state } = useStore();
  return useMemo(() => {
    const startup = state.startups.find((s) => s.id === startupId);
    const spec = state.specs.find((p) => p.startupId === startupId);
    if (!startup || !spec) return undefined;
    const lastSim = [...state.simulations]
      .filter((x) => x.startupId === startupId)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    const weights = state.batches.find((b) => b.id === state.activeBatchId)?.weights;
    return computeScore({
      startup,
      spec,
      investments: state.investments,
      personaResults: lastSim?.results ?? [],
      weights,
    });
  }, [state, startupId]);
}

export function useScores(): { startup: Startup; score: Score }[] {
  const { state } = useStore();
  return useMemo(() => {
    return state.startups.map((startup) => {
      const spec = state.specs.find((p) => p.startupId === startup.id);
      const lastSim = [...state.simulations]
        .filter((x) => x.startupId === startup.id)
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      const weights = state.batches.find((b) => b.id === state.activeBatchId)?.weights;
      const score = spec ? computeScore({
        startup,
        spec,
        investments: state.investments,
        personaResults: lastSim?.results ?? [],
        weights,
      }) : {
        startupId: startup.id,
        specCompleteness: 0, traceCoverage: 0, testPassRate: 0,
        personaSatisfaction: 0, investorDemand: 0,
        marketPotential: startup.marketPotential, pitchScore: startup.pitchScore,
        techExecution: startup.techExecution, readiness: 0,
      } as Score;
      return { startup, score };
    });
  }, [state]);
}

export function useLeaderboard(): { startup: Startup; score: Score }[] {
  const items = useScores();
  const { state } = useStore();
  return useMemo(() => {
    const ranked = leaderboard(items.map((i) => i.score), state.investments);
    return ranked
      .map((s) => items.find((i) => i.score.startupId === s.startupId)!)
      .filter(Boolean);
  }, [items, state.investments]);
}

export function readinessInputs(args: { spec: ReturnType<typeof useStore>['state']['specs'][number]; startup: Startup; personaSatisfaction: number; investorDemand: number }): ReadinessInputs {
  return {
    specCompleteness: 0, // computed elsewhere; placeholder shape
    testPassRate: 0,
    techExecution: args.startup.techExecution,
    personaSatisfaction: args.personaSatisfaction,
    investorDemand: args.investorDemand,
    marketPotential: args.startup.marketPotential,
    pitchScore: args.startup.pitchScore,
  };
}
