import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), '.lyra', 'projects.json');

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

export async function DELETE(req: Request, { params }: any) {
  try {
    const { id } = await params;
    const projects = readDB();
    const filtered = projects.filter((p: any) => p.id !== id);
    writeDB(filtered);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: any) {
  try {
    const { id } = await params;
    const body = await req.json();
    const projects = readDB();
    const index = projects.findIndex((p: any) => p.id === id);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    projects[index] = { ...projects[index], ...body };
    writeDB(projects);
    
    return NextResponse.json(projects[index]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}