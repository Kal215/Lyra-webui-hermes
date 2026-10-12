import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dbPath = isServerless 
  ? path.join('/tmp', '.lyra', 'snippets.json')
  : path.join(process.cwd(), '.lyra', 'snippets.json');

const DEFAULT_SNIPPETS = [
  { id: '1', title: 'Analisis Kode', text: 'Tolong jelaskan baris kode ini secara detail, sebutkan kompleksitas waktunya, dan berikan saran optimasi.' },
  { id: '2', title: 'Audit Keamanan', text: 'Analisis repository atau skrip ini untuk mencari celah keamanan (XSS, Injection, dll).' },
  { id: '3', title: 'Arsitektur Sistem', text: 'Buatkan rancangan arsitektur sistem menggunakan sintaks Mermaid.js untuk alur kerja ini.' },
  { id: '4', title: 'Unit Testing', text: 'Tuliskan Unit Test lengkap untuk file ini menggunakan framework standar.' }
];

function initDb() {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(DEFAULT_SNIPPETS, null, 2));
    }
  } catch (err) {
    console.warn('[Snippets] Could not write to disk, using memory fallback:', err);
  }
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    initDb();
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      return NextResponse.json(data);
    }
    return NextResponse.json(DEFAULT_SNIPPETS);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    initDb();
    const body = await req.json();
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    const newSnippet = {
      id: Date.now().toString(),
      title: body.title,
      text: body.text
    };
    
    data.push(newSnippet);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json(newSnippet);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    initDb();
    const body = await req.json();
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    const idx = data.findIndex((s: any) => s.id === body.id);
    if (idx !== -1) {
      data[idx].title = body.title;
      data[idx].text = body.text;
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      return NextResponse.json(data[idx]);
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    initDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    const filtered = data.filter((s: any) => s.id !== id);
    fs.writeFileSync(dbPath, JSON.stringify(filtered, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
