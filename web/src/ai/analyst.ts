import type { AiAnalystPort, InterviewInput, SpecDraft, SpecDraftNode } from './ports';

/**
 * MockAiAnalyst — deterministic generator from interview inputs.
 * Produces ≥3 features / stories / use cases / scenarios / FRs and ≥1 NFR (FR-GEN-006).
 */
export class MockAiAnalyst implements AiAnalystPort {
  interview(input: InterviewInput): SpecDraft {
    const ideaShort = input.idea.trim().slice(0, 80) || 'Product';
    const user = (input.targetUser?.trim() || 'Founder');
    const problem = (input.problem?.trim() || 'a manual, fragmented workflow');
    const solution = (input.solution?.trim() || ideaShort);
    const category = (input.category?.trim() || 'productivity');

    const features: SpecDraftNode[] = [
      { kind: 'FEATURE', title: `${ideaShort} — Core experience`, body: `Core happy path for the ${category} workflow.` },
      { kind: 'FEATURE', title: `Onboarding & first value`, body: `User reaches first value under 2 minutes.` },
      { kind: 'FEATURE', title: `${category} health dashboard`, body: `One screen that answers "is it working".` },
    ];

    const stories: SpecDraftNode[] = [
      { kind: 'STORY', title: `As a ${user}, I want to complete the core task so I get value fast.`, body: '' },
      { kind: 'STORY', title: `As a ${user}, I want to understand setup in <2 minutes so I don't bounce.`, body: '' },
      { kind: 'STORY', title: `As a ${user}, I want a clear status so I can trust the product.`, body: '' },
    ];

    const useCases: SpecDraftNode[] = [
      { kind: 'USE_CASE', title: `Complete core ${category} task`, body: `Happy + alt + error paths for the core task.` },
      { kind: 'USE_CASE', title: `First-time onboarding`, body: `From landing to first successful action.` },
      { kind: 'USE_CASE', title: `Verify product health`, body: `User sees green/red signal and acts.` },
    ];

    const scenarios: SpecDraftNode[] = [
      { kind: 'SCENARIO', title: `Happy path — core task succeeds`, body: `Given valid input\nWhen the user runs the core action\nThen the system returns the expected outcome.` },
      { kind: 'SCENARIO', title: `Error path — invalid input rejected`, body: `Given invalid input\nWhen the user submits\nThen the system rejects with an explicit reason.` },
      { kind: 'SCENARIO', title: `Onboarding completes in under 2 minutes`, body: `Given a brand new user\nWhen they follow the onboarding\nThen they reach first value in <120 seconds.` },
    ];

    const frs: SpecDraftNode[] = [
      { kind: 'FR', title: `The system MUST address ${problem} through ${solution}.`, body: '' },
      { kind: 'FR', title: `The system MUST validate user input before each core action.`, body: '' },
      { kind: 'FR', title: `The system MUST surface success/failure of each core action explicitly.`, body: '' },
    ];

    const nfrs: SpecDraftNode[] = [
      { kind: 'NFR', title: `Core task latency MUST be under 1 second on a mid-laptop.`, body: 'Category: Performance' },
    ];

    const tests: SpecDraftNode[] = [
      { kind: 'TEST', title: `Unit — input validation rejects invalid payload`, body: 'Type: Unit' },
      { kind: 'TEST', title: `Integration — core action completes`, body: 'Type: Integration' },
      { kind: 'TEST', title: `Smoke — onboarding renders without errors`, body: 'Type: Smoke' },
    ];

    return { nodes: [...features, ...stories, ...useCases, ...scenarios, ...frs, ...nfrs, ...tests] };
  }
}
