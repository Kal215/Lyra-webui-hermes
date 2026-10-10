import { execFile } from 'child_process';
import { promisify } from 'util';
import { getHermesEnv } from '@/lib/hermesEnv';

import { NextRequest, NextResponse } from 'next/server';

import {
  prepareWorkForDispatch,
  type ReasoningClassification,
} from '@/lib/reasoning';

const execFileAsync = promisify(execFile);

interface CreateWorkBody {
  title?: unknown;
  body?: unknown;
  assignee?: unknown;
  priority?: unknown;
  idempotencyKey?: unknown;
}

interface HermesCreateResult {
  id?: string;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unknown error';
}

function parseHermesCreateResult(
  stdout: string,
): HermesCreateResult {
  try {
    const parsed: unknown = JSON.parse(stdout);

    if (
      isRecord(parsed)
      && typeof parsed.id === 'string'
    ) {
      return {
        id: parsed.id,
      };
    }
  } catch {
    // Hermes output is returned without inventing an id.
  }

  return {};
}

function publicReasoningSummary(
  reasoning: ReasoningClassification | null,
) {
  if (!reasoning) {
    return null;
  }

  return {
    protocolVersion: reasoning.protocolVersion,
    depth: reasoning.depth,
    risk: reasoning.risk,
    reasoningBudget: reasoning.reasoningBudget,
    requireEvidence: reasoning.requireEvidence,
    requireVerification: reasoning.requireVerification,
    approvalMode: reasoning.approvalMode,
  };
}

export async function GET() {
  try {
    const { stdout } = await execFileAsync(
      'hermes',
      ['kanban', 'list', '--archived', '--json'],
      { env: getHermesEnv() }
    );

    let data: unknown = [];

    try {
      data = JSON.parse(stdout);
    } catch {
      data = [];
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error(
      'Failed to fetch work:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error),
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody: unknown = await req.json();

    if (!isRecord(rawBody)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
        },
        {
          status: 400,
        },
      );
    }

    const requestBody: CreateWorkBody = rawBody;

    const instruction =
      typeof requestBody.body === 'string'
        ? requestBody.body
        : '';

    const assignee =
      typeof requestBody.assignee === 'string'
        ? requestBody.assignee
        : '';

    const title =
      typeof requestBody.title === 'string'
        ? requestBody.title
        : 'Untitled Work';

    const priority =
      typeof requestBody.priority === 'string'
      || typeof requestBody.priority === 'number'
        ? requestBody.priority
        : null;

    const idempotencyKey =
      typeof requestBody.idempotencyKey === 'string'
        ? requestBody.idempotencyKey
        : null;

    if (!instruction || !assignee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing instruction or assignee',
        },
        {
          status: 400,
        },
      );
    }

    const prepared = prepareWorkForDispatch({
      title,
      instruction,
      assignee,
      priority,
    });

    const args = [
      'kanban',
      'create',
      title,
      '--body',
      prepared.body,
      '--assignee',
      assignee,
    ];

    if (priority !== null) {
      args.push(
        '--priority',
        priority.toString(),
      );
    }

    if (idempotencyKey) {
      args.push(
        '--idempotency-key',
        idempotencyKey,
      );
    }

    args.push('--json');

    const { stdout } = await execFileAsync(
      'hermes',
      args,
      { env: getHermesEnv() }
    );

    const result = parseHermesCreateResult(stdout);

    // Force an immediate dispatch so the worker picks it up instantly (zero wait time)
    try {
      await execFileAsync('hermes', ['kanban', 'dispatch'], { env: getHermesEnv() });
    } catch (e) {
      console.warn('Dispatch failed after task creation', e);
    }

    return NextResponse.json({
      success: true,
      taskId: result.id,
      reasoning:
        publicReasoningSummary(
          prepared.reasoning,
        ),
    });
  } catch (error: unknown) {
    console.error(
      'Failed to create work:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error),
      },
      {
        status: 500,
      },
    );
  }
}
