import { BenchmarkCase } from './types';
import { 
  classifyReasoning, 
  approvalModeForRisk, 
  adjudicate,
  validateCompletionContract,
  CompletionContract
} from '../index';
import { canPromoteToProjectMemory, InMemoryProjectMemoryStore } from '../memory';
import { CriticFinding } from '../review';
import { prepareWorkForDispatch } from '../dispatch';

export const canonicalSuite: BenchmarkCase[] = [
  // CLASSIFICATION
  {
    id: 'CLASSIFICATION-SIMPLE-QUICK',
    category: 'CLASSIFICATION',
    severity: 'MEDIUM',
    title: 'Simple task defaults to QUICK',
    execute: () => {
      const cls = classifyReasoning({ instruction: 'add a button', assignee: 'coder' });
      return cls.depth === 'QUICK';
    }
  },
  {
    id: 'CLASSIFICATION-COMPLEX-DEEP',
    category: 'CLASSIFICATION',
    severity: 'HIGH',
    title: 'Complex investigation defaults to DEEP',
    execute: () => {
      const cls = classifyReasoning({ instruction: 'investigate race condition in auth flow and draft a report', assignee: 'qa' });
      return cls.depth === 'DEEP';
    }
  },
  {
    id: 'CLASSIFICATION-DESTRUCTIVE-CRITICAL',
    category: 'CLASSIFICATION',
    severity: 'CRITICAL',
    title: 'Critical destructive operation elevates to CRITICAL depth',
    execute: () => {
      const cls = classifyReasoning({ instruction: 'restart the production database', assignee: 'coder' });
      return cls.depth === 'CRITICAL';
    }
  },
  
  // DISPATCH
  {
    id: 'DISPATCH-CODER-RECEIVES-DIRECTIVE',
    category: 'DISPATCH',
    severity: 'HIGH',
    title: 'Coder receives reasoning directive',
    execute: () => {
      const dispatch = prepareWorkForDispatch({ instruction: 'fix bug', assignee: 'coder' });
      return dispatch.reasoning !== null && dispatch.body.includes('[LYRA_REASONING_DIRECTIVE]');
    }
  },
  {
    id: 'DISPATCH-SPECIALIZED-RECEIVES-DIRECTIVE',
    category: 'DISPATCH',
    severity: 'HIGH',
    title: 'Supported specialized profile receives directive',
    execute: () => {
      const dispatch = prepareWorkForDispatch({ instruction: 'review code', assignee: 'verifier' });
      return dispatch.reasoning !== null && dispatch.body.includes('[LYRA_REASONING_DIRECTIVE]');
    }
  },
  {
    id: 'DISPATCH-UNKNOWN-PROFILE-FAILSAFE',
    category: 'DISPATCH',
    severity: 'CRITICAL',
    title: 'Unknown profile receives original body unchanged',
    execute: () => {
      const dispatch = prepareWorkForDispatch({ instruction: 'do something', assignee: 'unknown-bot' });
      return dispatch.reasoning === null && dispatch.body === 'do something';
    }
  },

  // SAFETY
  {
    id: 'SAFETY-CRITICAL-BLOCK-REQUIRED',
    category: 'SAFETY',
    severity: 'CRITICAL',
    title: 'Critical risk task forces KANBAN_BLOCK_REQUIRED approval',
    execute: () => {
      const approval = approvalModeForRisk('CRITICAL');
      return approval === 'KANBAN_BLOCK_REQUIRED';
    }
  },
  {
    id: 'SAFETY-LOW-CONFIDENCE-REJECTED',
    category: 'SAFETY',
    severity: 'CRITICAL',
    title: 'LOW confidence success is rejected',
    execute: () => {
      const contract = {
        protocol_version: 'lyra-r1-v1',
        depth: 'STANDARD',
        risk: 'LOW',
        confidence: 'LOW',
        verification: 'It probably works', reasoning_budget: 10
      } as Partial<CompletionContract>;
      const check = validateCompletionContract(contract, { require_verification: true, require_evidence: false }, true);
      return !check.valid && check.errors.some(e => e.includes('LOW confidence'));
    }
  },

  // EVIDENCE
  {
    id: 'EVIDENCE-WORKER-CLAIM-DISTINGUISHED',
    category: 'EVIDENCE',
    severity: 'HIGH',
    title: 'WORKER_CLAIM is distinguishable from independent proof',
    execute: () => {
      // Test the logic directly against adjudication
      const decision = adjudicate(
        [{ id: 'req1', description: 'must verify', required: true }],
        [],
        [{ criterionId: 'req1', status: 'INCONCLUSIVE', evidenceRefs: ['ref1'], summary: 'Inconclusive' }],
        { 'ref1': { kind: 'WORKER_CLAIM', source: 'worker', summary: 'I checked' } },
        'HIGH'
      );
      return decision.verdict !== 'PASS';
    }
  },
  {
    id: 'EVIDENCE-REQUIRED-ABSENT-INVALID',
    category: 'EVIDENCE',
    severity: 'HIGH',
    title: 'Required evidence absent is invalid',
    execute: () => {
      const contract = {
        protocol_version: 'lyra-r1-v1',
        depth: 'STANDARD',
        risk: 'LOW',
        confidence: 'HIGH',
        verification: 'Done'
      } as Partial<CompletionContract>;
      const check = validateCompletionContract(contract, { require_verification: true, require_evidence: true }, false);
      return !check.valid && check.errors.some(e => e.includes('evidence'));
    }
  },

  // COMPLETION_CONTRACT
  {
    id: 'COMPLETION_CONTRACT-VALID-ACCEPTED',
    category: 'COMPLETION_CONTRACT',
    severity: 'HIGH',
    title: 'Valid completion contract is accepted',
    execute: () => {
      const contract = {
        protocol_version: 'lyra-r1-v1',
        depth: 'QUICK',
        risk: 'LOW',
        confidence: 'HIGH',
        verification: 'I ran the test and it passed.',
        reasoning_budget: 10
      } as Partial<CompletionContract>;
      const check = validateCompletionContract(contract, { require_verification: true, require_evidence: false }, true);
      return check.valid;
    }
  },
  {
    id: 'COMPLETION_CONTRACT-MISSING-VERIFICATION',
    category: 'COMPLETION_CONTRACT',
    severity: 'HIGH',
    title: 'Missing verification field is rejected',
    execute: () => {
      const contract = {
        protocol_version: 'lyra-r1-v1',
        depth: 'STANDARD',
        risk: 'LOW',
        confidence: 'HIGH'
      } as Partial<CompletionContract>;
      const check = validateCompletionContract(contract, { require_verification: true, require_evidence: false }, true);
      return !check.valid && check.errors.some(e => e.includes('verification'));
    }
  },
  {
    id: 'COMPLETION_CONTRACT-EXTRA-METADATA-ACCEPTED',
    category: 'COMPLETION_CONTRACT',
    severity: 'LOW',
    title: 'Extra Hermes metadata is accepted',
    execute: () => {
      const contract = {
        protocol_version: 'lyra-r1-v1',
        depth: 'QUICK',
        risk: 'LOW',
        confidence: 'HIGH',
        verification: 'Verified.',
        reasoning_budget: 5,
        extra_info: 'some data'
      } as Partial<CompletionContract>;
      const check = validateCompletionContract(contract, { require_verification: true, require_evidence: false }, true);
      return check.valid;
    }
  },

  // PROFILE_POLICY
  {
    id: 'PROFILE_POLICY-QA-KANBAN',
    category: 'PROFILE_POLICY',
    severity: 'HIGH',
    title: 'qa-kanban routes to qa protocol family',
    execute: () => {
      const dispatch = prepareWorkForDispatch({ instruction: 'test this', assignee: 'qa-kanban' });
      return dispatch.protocolFamily === 'qa';
    }
  },
  {
    id: 'PROFILE_POLICY-SECURITY-KANBAN',
    category: 'PROFILE_POLICY',
    severity: 'HIGH',
    title: 'security-kanban routes to security protocol family',
    execute: () => {
      const dispatch = prepareWorkForDispatch({ instruction: 'audit this', assignee: 'security-kanban' });
      return dispatch.protocolFamily === 'security';
    }
  },

  // REVIEW_JUDGE
  {
    id: 'REVIEW_JUDGE-ALL-VERIFIED-PASS',
    category: 'REVIEW_JUDGE',
    severity: 'HIGH',
    title: 'All required criteria verified yields PASS',
    execute: () => {
      const decision = adjudicate(
        [{ id: 'req1', description: 'must verify', required: true }],
        [],
        [{ criterionId: 'req1', status: 'PASS', evidenceRefs: ['ref1'], summary: 'Verified' }],
        { 'ref1': { kind: 'TEST_RESULT', source: 'runner', summary: 'Pass' } },
        'HIGH'
      );
      return decision.verdict === 'PASS';
    }
  },
  {
    id: 'REVIEW_JUDGE-BLOCKER-NO-PASS',
    category: 'REVIEW_JUDGE',
    severity: 'CRITICAL',
    title: 'A BLOCKER finding prevents PASS',
    execute: () => {
      const finding: CriticFinding = {
        criterionId: 'c1',
        summary: 'issue',
        severity: 'BLOCKER',
        evidenceRefs: [],
        status: 'OPEN'
      };
      const decision = adjudicate([], [finding], [], {}, 'HIGH');
      return decision.verdict !== 'PASS';
    }
  },
  {
    id: 'REVIEW_JUDGE-MISSING-EVIDENCE-NO-PASS',
    category: 'REVIEW_JUDGE',
    severity: 'HIGH',
    title: 'Missing required evidence prevents PASS',
    execute: () => {
      const decision = adjudicate(
        [{ id: 'req1', description: 'must verify', required: true }],
        [],
        [{ criterionId: 'req1', status: 'INCONCLUSIVE', evidenceRefs: [], summary: 'No evidence' }],
        {},
        'HIGH'
      );
      return decision.verdict !== 'PASS';
    }
  },
  {
    id: 'REVIEW_JUDGE-WORKER-CLAIM-ONLY-NO-PASS',
    category: 'REVIEW_JUDGE',
    severity: 'HIGH',
    title: 'Worker claim alone does not independently satisfy verification',
    execute: () => {
      const decision = adjudicate(
        [{ id: 'req1', description: 'must verify', required: true }],
        [],
        [{ criterionId: 'req1', status: 'INCONCLUSIVE', evidenceRefs: ['ref1'], summary: 'Only worker claim' }],
        { 'ref1': { kind: 'WORKER_CLAIM', source: 'worker', summary: 'I checked' } },
        'HIGH'
      );
      return decision.verdict !== 'PASS';
    }
  },

  // PROJECT_MEMORY
  {
    id: 'PROJECT_MEMORY-PROJECT-ISOLATION',
    category: 'PROJECT_MEMORY',
    severity: 'CRITICAL',
    title: 'Project isolation is enforced',
    execute: async () => {
      const store = new InMemoryProjectMemoryStore();
      await store.put({
        projectId: 'proj-A',
        kind: 'FACT',
        summary: 'An isolated fact',
        tags: [],
        sourceRefs: [],
        confidence: 'HIGH'
      });
      const results = await store.query({ projectId: 'proj-B' });
      return results.length === 0;
    }
  },
  {
    id: 'PROJECT_MEMORY-SUPERSEDED-EXCLUDED',
    category: 'PROJECT_MEMORY',
    severity: 'HIGH',
    title: 'Superseded memory is excluded from active queries',
    execute: async () => {
      const store = new InMemoryProjectMemoryStore();
      const mem1 = await store.put({ projectId: 'proj-A', kind: 'FACT', summary: 'V1', tags: [], sourceRefs: [], confidence: 'HIGH' });
      await store.supersede({ projectId: 'proj-A', kind: 'FACT', summary: 'V2', tags: [], sourceRefs: [], confidence: 'HIGH' }, [mem1.id]);
      const results = await store.query({ projectId: 'proj-A', includeHistorical: false });
      return results.length === 1 && results[0].summary === 'V2';
    }
  },
  {
    id: 'PROJECT_MEMORY-RETRACTED-EXCLUDED',
    category: 'PROJECT_MEMORY',
    severity: 'HIGH',
    title: 'Retracted memory is excluded from active queries',
    execute: async () => {
      const store = new InMemoryProjectMemoryStore();
      const mem1 = await store.put({ projectId: 'proj-A', kind: 'FACT', summary: 'False', tags: [], sourceRefs: [], confidence: 'HIGH' });
      await store.retract(mem1.id);
      const results = await store.query({ projectId: 'proj-A', includeHistorical: false });
      return results.length === 0;
    }
  },
  {
    id: 'PROJECT_MEMORY-LOW-CONF-PROMOTION-REJECTED',
    category: 'PROJECT_MEMORY',
    severity: 'HIGH',
    title: 'LOW-confidence accepted-memory promotion is rejected',
    execute: () => {
      return !canPromoteToProjectMemory('PASS', 'LOW', true, 'DECISION');
    }
  },
  {
    id: 'PROJECT_MEMORY-R4-NON-PASS-PROMOTION-REJECTED',
    category: 'PROJECT_MEMORY',
    severity: 'HIGH',
    title: 'R4 non-PASS promotion is rejected',
    execute: () => {
      return !canPromoteToProjectMemory('NEEDS_REVISION', 'HIGH', true, 'FACT');
    }
  },
  {
    id: 'PROJECT_MEMORY-BOUNDED-MEMORY-PACKET',
    category: 'PROJECT_MEMORY',
    severity: 'MEDIUM',
    title: 'Bounded memory packet enforces limits',
    execute: async () => {
      const store = new InMemoryProjectMemoryStore();
      for (let i = 0; i < 15; i++) {
        await store.put({ projectId: 'proj-A', kind: 'FACT', summary: 'F' + i, confidence: 'HIGH' });
      }
      const results = await store.query({ projectId: 'proj-A', limit: 10 });
      return results.length === 10;
    }
  }
];
