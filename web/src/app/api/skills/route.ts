import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getHermesEnv } from '@/lib/hermesEnv';

export async function GET() {
  try {
    const env = getHermesEnv();
    
    // We will scan both builtin skills and local skills
    const builtInPath = (env as any).HERMES_WEBUI_AGENT_DIR ? path.join((env as any).HERMES_WEBUI_AGENT_DIR, 'skills') : '';
    const localPath = path.join(env.HERMES_HOME, 'skills');
    
    const skills: any[] = [];
    
    const parseFrontmatter = (content: string, fileName: string) => {
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (!match) return null;
      
      const yaml = match[1];
      const nameMatch = yaml.match(/name:\s*(.+)/);
      const descMatch = yaml.match(/description:\s*(.+)/);
      const catMatch = yaml.match(/category:\s*(.+)/);
      
      const name = nameMatch ? nameMatch[1].replace(/['"]/g, '').trim() : fileName.replace('.md', '');
      const description = descMatch ? descMatch[1].replace(/['"]/g, '').trim() : 'No description available';
      const category = catMatch ? catMatch[1].replace(/['"]/g, '').trim() : 'Uncategorized';
      
      return { name, description, category };
    };

    const scanDir = (dir: string, isLocal: boolean, depth = 0) => {
      if (depth > 3) return; // Prevent infinite recursion
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        if (file.startsWith('.')) continue; // skip hidden
        
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath, isLocal, depth + 1);
        } else if (file === 'SKILL.md') {
          const content = fs.readFileSync(fullPath, 'utf8');
          const data = parseFrontmatter(content, path.basename(dir));
          if (data) {
            skills.push({ ...data, source: isLocal ? 'local' : 'builtin' });
          }
        } else if (file.endsWith('.md') && depth === 0) {
          // Flat skills in root
          const content = fs.readFileSync(fullPath, 'utf8');
          const data = parseFrontmatter(content, file);
          if (data) {
            skills.push({ ...data, source: isLocal ? 'local' : 'builtin' });
          }
        }
      }
    };

    if (builtInPath) scanDir(builtInPath, false);
    scanDir(localPath, true);

    // Deduplicate by name (local overrides builtin)
    const uniqueSkills = new Map();
    for (const skill of skills) {
      // If it exists and the new one is 'local', it overwrites. 
      if (!uniqueSkills.has(skill.name) || skill.source === 'local') {
        uniqueSkills.set(skill.name, skill);
      }
    }

    const sortedSkills = Array.from(uniqueSkills.values()).sort((a, b) => a.name.localeCompare(b.name));
    const isHermesDetected = fs.existsSync(localPath) && sortedSkills.length > 0;

    return NextResponse.json({ 
      success: true, 
      skills: sortedSkills, 
      hermes_detected: isHermesDetected 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
