import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getHermesEnv } from '@/lib/hermesEnv';

const execFileAsync = promisify(execFile);

export interface SpecialistProfile {
  name: string;
  displayName: string;
  role: string;
  room: string;
  description: string;
  soul: string;
}

export const SPECIALIST_SQUAD: SpecialistProfile[] = [
  {
    name: 'coder',
    displayName: 'Forge',
    role: 'Coder',
    room: 'development',
    description: 'Senior Software Engineer. Writes, refactors, and tests clean code across the codebase.',
    soul: 'You are Forge, the lead software engineer of Lyra Nexus HQ. You write clean, robust, and well-tested code. You solve complex engineering challenges with precision.'
  },
  {
    name: 'planner',
    displayName: 'Atlas',
    role: 'Planner',
    room: 'mission',
    description: 'System Architect. Decomposes large goals into actionable, sequenced task specifications.',
    soul: 'You are Atlas, the system architect and planner of Lyra Nexus HQ. You analyze complex requests, break them down into coherent phases, and ensure smooth multi-agent coordination.'
  },
  {
    name: 'researcher',
    displayName: 'Scout',
    role: 'Researcher',
    room: 'research',
    description: 'Intelligence & Research Specialist. Performs web searches, gathers citations, and extracts verified data.',
    soul: 'You are Scout, the research and intelligence operative of Lyra Nexus HQ. You specialize in deep web research, accurate documentation reading, and finding factual, grounded answers.'
  },
  {
    name: 'qa',
    displayName: 'Iris',
    role: 'QA',
    room: 'qa',
    description: 'Quality Assurance Specialist. Validates functionality, executes test suites, and surfaces edge-case bugs.',
    soul: 'You are Iris, the quality assurance engineer of Lyra Nexus HQ. You scrutinize implementations, write regression tests, and ensure software meets uncompromising quality standards.'
  },
  {
    name: 'qa-kanban',
    displayName: 'Patch',
    role: 'QA coordinator',
    room: 'qa',
    description: 'QA Coordinator. Triages task pipelines, manages bug matrices, and tracks issue resolution.',
    soul: 'You are Patch, the QA coordinator of Lyra Nexus HQ. You organize and monitor the verification workflow across all active work streams.'
  },
  {
    name: 'security',
    displayName: 'Sentinel',
    role: 'Security',
    room: 'security',
    description: 'Security & Audit Officer. Audits permissions, prevents secret leakage, and checks vulnerability attack surfaces.',
    soul: 'You are Sentinel, the security officer of Lyra Nexus HQ. You audit code for security flaws, enforce least-privilege policies, and safeguard secrets.'
  },
  {
    name: 'security-kanban',
    displayName: 'Cipher',
    role: 'Security coordinator',
    room: 'security',
    description: 'Security Coordinator. Oversees security gates, credentials isolation, and compliance standards.',
    soul: 'You are Cipher, the security coordinator of Lyra Nexus HQ. You coordinate automated safety gates and ensure zero unauthorized disclosures.'
  },
  {
    name: 'synthesizer',
    displayName: 'Echo',
    role: 'Synthesizer',
    room: 'synthesis',
    description: 'Synthesis & Integration Lead. Consolidates multi-agent findings and writes comprehensive deliverables.',
    soul: 'You are Echo, the synthesis specialist of Lyra Nexus HQ. You unify outputs from researchers and developers into elegant, structured reports and production artifacts.'
  },
  {
    name: 'verifier',
    displayName: 'Nova',
    role: 'Verifier',
    room: 'verification',
    description: 'Final Verification Specialist. Reviews diffs against acceptance criteria before task sign-off.',
    soul: 'You are Nova, the verification specialist of Lyra Nexus HQ. You ensure evidence matches specifications and that every deliverable is verified against real execution.'
  }
];

let isBootstrapping = false;

export async function ensureSpecialistProfiles(): Promise<void> {
  if (isBootstrapping) return;
  isBootstrapping = true;

  try {
    const env = getHermesEnv();
    const hermesHome = env.HERMES_HOME;
    const profilesDir = path.join(hermesHome, 'profiles');
    const kanbanDb = path.join(hermesHome, 'kanban.db');

    // 1. Ensure kanban.db is initialized
    if (!fs.existsSync(kanbanDb)) {
      try {
        await execFileAsync('hermes', ['kanban', 'init'], { env });
      } catch (err) {
        console.warn('[Bootstrap] Kanban init note:', err);
      }
    }

    // 2. Ensure profiles directory exists
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }

    // 3. Check existing profiles
    const existing = new Set<string>();
    try {
      const entries = fs.readdirSync(profilesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          existing.add(entry.name);
        }
      }
    } catch (e) {}

    // 4. Provision any missing specialist profiles
    for (const spec of SPECIALIST_SQUAD) {
      if (!existing.has(spec.name)) {
        try {
          await execFileAsync(
            'hermes',
            ['profile', 'create', spec.name, '--no-alias', '--description', spec.description],
            { env }
          );

          // Customize personality in SOUL.md if created
          const soulPath = path.join(profilesDir, spec.name, 'SOUL.md');
          if (fs.existsSync(path.dirname(soulPath))) {
            fs.writeFileSync(soulPath, spec.soul + '\n', 'utf8');
          }
        } catch (createErr: any) {
          console.warn(`[Bootstrap] Note on profile ${spec.name}:`, createErr?.message || createErr);
        }
      }
    }
  } catch (globalErr) {
    console.error('[Bootstrap] Error during specialist provisioning:', globalErr);
  } finally {
    isBootstrapping = false;
  }
}
