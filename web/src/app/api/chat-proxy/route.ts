import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://127.0.0.1:9120/');
    let html = await res.text();
    // Strip the embedded chat flag so it runs as a normal web app!
    html = html.replace('window.__HERMES_DASHBOARD_EMBEDDED_CHAT__=true;', 'window.__HERMES_DASHBOARD_EMBEDDED_CHAT__=false;');
    
    // Also rewrite asset paths to point to 9120 directly
    html = html.replace(/href="\/assets\//g, 'href="http://127.0.0.1:9120/assets/');
    html = html.replace(/src="\/assets\//g, 'src="http://127.0.0.1:9120/assets/');
    html = html.replace(/href="\/favicon.ico"/g, 'href="http://127.0.0.1:9120/favicon.ico"');

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (e) {
    return new NextResponse('Error connecting to Hermes Dashboard', { status: 500 });
  }
}
