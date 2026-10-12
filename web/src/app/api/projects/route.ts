import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_PATH = isServerless
  ? path.join('/tmp', '.lyra', 'projects.json')
  : path.join(process.cwd(), '.lyra', 'projects.json');

export const dynamic = 'force-dynamic';

const readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const writeDB = (data: any) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

export async function GET() {
  return NextResponse.json(readDB());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newProject = {
      id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      name: body.name || 'Untitled Project',
      description: body.description || '',
      systemPrompt: body.systemPrompt || '',
      workspacePath: body.workspacePath || '',
      createdAt: Date.now()
    };
    
    const projects = readDB();
    projects.push(newProject);
    writeDB(projects);
    
    return NextResponse.json(newProject);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}