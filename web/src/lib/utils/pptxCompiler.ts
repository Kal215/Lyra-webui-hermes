/**
 * Lyra Autonomous Studio - PowerPoint (.pptx) Compiler
 * 100% Pure JavaScript/TypeScript, Zero OS-level dependencies.
 * Generates enterprise-grade 16:9 widescreen presentations with
 * modern Vercel/Stripe aesthetics, stat callouts, and clean card layouts.
 */
import pptxgen from 'pptxgenjs';
import fs from 'fs/promises';
import path from 'path';

export interface SlideCard {
  title: string;
  description: string;
  badge?: string;
}

export interface SlideStat {
  value: string;
  label: string;
}

export interface PresentationSlide {
  title: string;
  subtitle?: string;
  type?: 'title' | 'content' | 'cards' | 'stats' | 'conclusion';
  bullets?: string[];
  cards?: SlideCard[];
  stats?: SlideStat[];
  notes?: string;
}

export interface PresentationSpec {
  title: string;
  theme?: 'dark' | 'light';
  author?: string;
  slides: PresentationSlide[];
}

export async function compilePresentation(
  spec: PresentationSpec, 
  outputPath: string
): Promise<string> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = spec.author || 'Lyra Autonomous Studio';
  pres.title = spec.title;

  const isDark = spec.theme !== 'light';
  const bgColor = isDark ? '09090b' : 'ffffff';
  const cardBg = isDark ? '18181b' : 'f4f4f5';
  const textPrimary = isDark ? 'f4f4f5' : '09090b';
  const textSecondary = isDark ? 'a1a1aa' : '71717a';
  const accentColor = isDark ? '818cf8' : '4f46e5';
  const borderCol = isDark ? '27272a' : 'e4e4e7';

  for (const s of spec.slides) {
    const slide = pres.addSlide();
    slide.background = { color: bgColor };

    if (s.notes) {
      slide.addNotes(s.notes);
    }

    if (s.type === 'title') {
      // Title slide layout
      slide.addText(spec.author || 'LYRA AUTONOMOUS STUDIO', {
        x: 1.0,
        y: 1.8,
        w: 11.3,
        fontSize: 11,
        fontFace: 'Arial',
        color: accentColor,
        bold: true,
        charSpacing: 3
      });

      slide.addText(s.title, {
        x: 1.0,
        y: 2.3,
        w: 11.3,
        fontSize: 36,
        fontFace: 'Arial',
        color: textPrimary,
        bold: true
      });

      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 1.0,
          y: 3.8,
          w: 11.3,
          fontSize: 16,
          fontFace: 'Arial',
          color: textSecondary,
          lineSpacing: 24
        });
      }
      continue;
    }

    // Header bar on standard slides
    slide.addText(s.title, {
      x: 0.8,
      y: 0.6,
      w: 11.5,
      fontSize: 22,
      fontFace: 'Arial',
      color: textPrimary,
      bold: true
    });

    if (s.subtitle) {
      slide.addText(s.subtitle, {
        x: 0.8,
        y: 1.2,
        w: 11.5,
        fontSize: 13,
        fontFace: 'Arial',
        color: textSecondary
      });
    }

    // Slide Body by Type
    if (s.stats && s.stats.length > 0) {
      const colWidth = 11.5 / Math.min(s.stats.length, 4);
      s.stats.forEach((st, idx) => {
        const xPos = 0.8 + idx * colWidth;
        // Background card
        slide.addShape(pres.ShapeType.rect, {
          x: xPos,
          y: 2.0,
          w: colWidth - 0.3,
          h: 3.5,
          fill: { color: cardBg },
          line: { color: borderCol, width: 1 }
        });

        // Big Metric
        slide.addText(st.value, {
          x: xPos + 0.2,
          y: 2.8,
          w: colWidth - 0.7,
          fontSize: 38,
          fontFace: 'Arial',
          color: accentColor,
          bold: true,
          align: 'center'
        });

        // Label
        slide.addText(st.label, {
          x: xPos + 0.2,
          y: 4.0,
          w: colWidth - 0.7,
          fontSize: 13,
          fontFace: 'Arial',
          color: textSecondary,
          align: 'center'
        });
      });
    } else if (s.cards && s.cards.length > 0) {
      const colWidth = 11.5 / Math.min(s.cards.length, 3);
      s.cards.forEach((cd, idx) => {
        const xPos = 0.8 + idx * colWidth;
        slide.addShape(pres.ShapeType.rect, {
          x: xPos,
          y: 2.0,
          w: colWidth - 0.3,
          h: 4.2,
          fill: { color: cardBg },
          line: { color: borderCol, width: 1 }
        });

        slide.addText(cd.title, {
          x: xPos + 0.3,
          y: 2.4,
          w: colWidth - 0.9,
          fontSize: 16,
          fontFace: 'Arial',
          color: textPrimary,
          bold: true
        });

        slide.addText(cd.description, {
          x: xPos + 0.3,
          y: 3.2,
          w: colWidth - 0.9,
          fontSize: 12,
          fontFace: 'Arial',
          color: textSecondary,
          lineSpacing: 18
        });
      });
    } else if (s.bullets && s.bullets.length > 0) {
      const bulletItems = s.bullets.map(b => ({
        text: b,
        options: {
          fontSize: 14,
          fontFace: 'Arial',
          color: textPrimary,
          bullet: true,
          lineSpacing: 26,
          paraSpaceBefore: 12
        }
      }));

      slide.addText(bulletItems, {
        x: 0.8,
        y: 1.8,
        w: 11.5,
        h: 4.8
      });
    }
  }

  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await pres.writeFile({ fileName: outputPath });
  return outputPath;
}

/**
 * Parses markdown presentation slides formatted like:
 * # Title Slide
 * Subtitle here
 * ---
 * ## Next Slide Title
 * - Bullet 1
 * - Bullet 2
 */
export function parseMarkdownToSlides(markdown: string): PresentationSpec {
  const sections = markdown.split(/\n---\n/);
  const slides: PresentationSlide[] = [];
  let mainTitle = 'Presentation';

  sections.forEach((sec, idx) => {
    const lines = sec.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    if (idx === 0) {
      // First slide is title slide
      const titleLine = lines[0].replace(/^#+\s*/, '');
      mainTitle = titleLine;
      const subtitle = lines.slice(1).join(' ').replace(/^#+\s*/, '');
      slides.push({
        title: titleLine,
        subtitle: subtitle || undefined,
        type: 'title'
      });
      return;
    }

    const titleLine = lines[0].replace(/^#+\s*/, '');
    const bullets: string[] = [];
    let subtitle: string | undefined = undefined;

    lines.slice(1).forEach(l => {
      if (l.startsWith('- ') || l.startsWith('* ') || /^\d+\.\s/.test(l)) {
        bullets.push(l.replace(/^[-*]\s+|\d+\.\s+/, ''));
      } else if (!subtitle && !l.startsWith('#')) {
        subtitle = l;
      }
    });

    slides.push({
      title: titleLine,
      subtitle,
      bullets: bullets.length > 0 ? bullets : undefined,
      type: 'content'
    });
  });

  return {
    title: mainTitle,
    theme: 'dark',
    slides
  };
}
