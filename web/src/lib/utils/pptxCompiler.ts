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

/**
 * Strips raw markdown bold/italic asterisks, backticks, and clean formatting
 */
export function cleanMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

/**
 * Checks if a section or paragraph is conversational AI filler
 */
function isAiFillerText(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (
    lower.startsWith('berikut adalah') ||
    lower.startsWith('berikut ini') ||
    lower.startsWith('tentu, berikut') ||
    lower.startsWith('tentu saja') ||
    lower.startsWith('here is') ||
    lower.startsWith("here's") ||
    lower.startsWith('sure, here') ||
    lower.includes('materi ini sudah siap') ||
    lower.includes('semoga membantu') ||
    lower.includes('tools powerpoint') ||
    lower.includes('let me know if') ||
    lower.includes('hope this helps') ||
    lower.includes('siap dipindahkan') ||
    lower.includes('selamat mencoba')
  ) {
    return true;
  }
  return false;
}

/**
 * Cleans slide title from prefixes like "Slide 1: **Title**" -> "Title"
 */
function cleanSlideTitle(rawTitle: string): string {
  let cleaned = rawTitle
    .replace(/^#+\s*/, '')
    .replace(/^Slide\s+\d+[:\-\.]\s*/i, '')
    .replace(/^Bagian\s+\d+[:\-\.]\s*/i, '')
    .trim();
  return cleanMarkdownFormatting(cleaned);
}

export async function compilePresentation(
  spec: PresentationSpec, 
  outputPath: string
): Promise<string> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = spec.author || 'Lyra Autonomous Studio';
  pres.title = cleanSlideTitle(spec.title);

  const isDark = spec.theme !== 'light';
  const bgColor = isDark ? '0A0A0C' : 'FFFFFF';
  const cardBg = isDark ? '121215' : 'F8FAFC';
  const textPrimary = isDark ? 'FFFFFF' : '0F172A';
  const textSecondary = isDark ? 'A1A1AA' : '64748B';
  const accentColor = isDark ? '6366F1' : '4F46E5';
  const accentLight = isDark ? '818CF8' : '6366F1';
  const borderCol = isDark ? '27272A' : 'E2E8F0';

  // Filter out any slides that are purely AI filler
  const validSlides = spec.slides.filter(s => {
    if (isAiFillerText(s.title)) return false;
    return true;
  });

  for (let sIdx = 0; sIdx < validSlides.length; sIdx++) {
    const s = validSlides[sIdx];
    const slide = pres.addSlide();
    slide.background = { color: bgColor };

    if (s.notes) {
      slide.addNotes(s.notes);
    }

    const titleText = cleanSlideTitle(s.title);
    const subText = s.subtitle ? cleanMarkdownFormatting(s.subtitle) : '';

    if (s.type === 'title' || sIdx === 0) {
      // Modern Widescreen Title Slide
      slide.addShape(pres.ShapeType.roundRect, {
        x: 1.0,
        y: 1.5,
        w: 3.2,
        h: 0.38,
        fill: { color: isDark ? '18181B' : 'F1F5F9' },
        line: { color: borderCol, width: 1 },
        rectRadius: 0.08
      });

      slide.addText((spec.author || 'LYRA AUTONOMOUS STUDIO').toUpperCase(), {
        x: 1.0,
        y: 1.55,
        w: 3.2,
        h: 0.28,
        fontSize: 9,
        fontFace: 'Arial',
        color: accentLight,
        bold: true,
        align: 'center',
        charSpacing: 2
      });

      const titleLen = titleText.length;
      const titleFontSize = titleLen > 60 ? 24 : titleLen > 35 ? 30 : 38;

      slide.addText(titleText, {
        x: 1.0,
        y: 2.2,
        w: 11.2,
        h: 1.6,
        fontSize: titleFontSize,
        fontFace: 'Arial',
        color: textPrimary,
        bold: true,
        lineSpacing: Math.round(titleFontSize * 1.25)
      });

      if (subText) {
        slide.addText(subText, {
          x: 1.0,
          y: 3.9,
          w: 10.8,
          h: 1.2,
          fontSize: 16,
          fontFace: 'Arial',
          color: textSecondary,
          lineSpacing: 24
        });
      }
      continue;
    }

    // Standard Slide Header
    slide.addText(titleText, {
      x: 0.8,
      y: 0.55,
      w: 11.5,
      h: 0.65,
      fontSize: 22,
      fontFace: 'Arial',
      color: textPrimary,
      bold: true
    });

    if (subText) {
      slide.addText(subText, {
        x: 0.8,
        y: 1.15,
        w: 11.5,
        h: 0.45,
        fontSize: 12,
        fontFace: 'Arial',
        color: textSecondary
      });
    }

    const contentStartY = subText ? 1.75 : 1.5;

    if (s.stats && s.stats.length > 0) {
      const count = Math.min(s.stats.length, 4);
      const colWidth = (11.5 - (count - 1) * 0.3) / count;

      s.stats.slice(0, 4).forEach((st, idx) => {
        const xPos = 0.8 + idx * (colWidth + 0.3);
        slide.addShape(pres.ShapeType.roundRect, {
          x: xPos,
          y: contentStartY + 0.3,
          w: colWidth,
          h: 3.8,
          fill: { color: cardBg },
          line: { color: borderCol, width: 1 },
          rectRadius: 0.12
        });

        slide.addShape(pres.ShapeType.rect, {
          x: xPos + 0.3,
          y: contentStartY + 0.6,
          w: 0.5,
          h: 0.05,
          fill: { color: accentColor }
        });

        slide.addText(cleanMarkdownFormatting(st.value), {
          x: xPos + 0.2,
          y: contentStartY + 1.2,
          w: colWidth - 0.4,
          h: 1.0,
          fontSize: 34,
          fontFace: 'Arial',
          color: accentLight,
          bold: true,
          align: 'center'
        });

        slide.addText(cleanMarkdownFormatting(st.label), {
          x: xPos + 0.2,
          y: contentStartY + 2.4,
          w: colWidth - 0.4,
          h: 1.2,
          fontSize: 12,
          fontFace: 'Arial',
          color: textSecondary,
          align: 'center',
          lineSpacing: 18
        });
      });
    } else if (s.cards && s.cards.length > 0) {
      const count = Math.min(s.cards.length, 4);
      const colWidth = (11.5 - (count - 1) * 0.3) / count;

      s.cards.slice(0, 4).forEach((cd, idx) => {
        const xPos = 0.8 + idx * (colWidth + 0.3);

        slide.addShape(pres.ShapeType.roundRect, {
          x: xPos,
          y: contentStartY,
          w: colWidth,
          h: 4.6,
          fill: { color: cardBg },
          line: { color: borderCol, width: 1 },
          rectRadius: 0.12
        });

        slide.addShape(pres.ShapeType.rect, {
          x: xPos + 0.3,
          y: contentStartY + 0.35,
          w: 0.5,
          h: 0.04,
          fill: { color: accentColor }
        });

        slide.addText(cleanMarkdownFormatting(cd.title), {
          x: xPos + 0.3,
          y: contentStartY + 0.55,
          w: colWidth - 0.6,
          h: 0.8,
          fontSize: count > 3 ? 13 : 15,
          fontFace: 'Arial',
          color: textPrimary,
          bold: true,
          lineSpacing: 20
        });

        slide.addText(cleanMarkdownFormatting(cd.description), {
          x: xPos + 0.3,
          y: contentStartY + 1.45,
          w: colWidth - 0.6,
          h: 2.8,
          fontSize: count > 3 ? 10.5 : 12,
          fontFace: 'Arial',
          color: textSecondary,
          lineSpacing: 18
        });
      });
    } else if (s.bullets && s.bullets.length > 0) {
      const bulletItems: any[] = [];
      s.bullets.forEach(b => {
        const raw = b.trim();
        const match = raw.match(/^\*\*(.*?)\*\*[:\-]?\s*(.*)$/);
        if (match) {
          bulletItems.push({
            text: match[1] + ': ',
            options: {
              bold: true,
              color: textPrimary,
              fontSize: 13.5,
              fontFace: 'Arial',
              bullet: true,
              paraSpaceBefore: 12
            }
          });
          bulletItems.push({
            text: cleanMarkdownFormatting(match[2]),
            options: {
              bold: false,
              color: textSecondary,
              fontSize: 13,
              fontFace: 'Arial',
              lineSpacing: 24
            }
          });
        } else {
          bulletItems.push({
            text: cleanMarkdownFormatting(raw),
            options: {
              color: textPrimary,
              fontSize: 13,
              fontFace: 'Arial',
              bullet: true,
              paraSpaceBefore: 12,
              lineSpacing: 24
            }
          });
        }
      });

      slide.addText(bulletItems, {
        x: 0.8,
        y: contentStartY,
        w: 11.5,
        h: 4.8
      });
    }
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await pres.writeFile({ fileName: outputPath });
  return outputPath;
}

export function parseMarkdownToSlides(markdown: string): PresentationSpec {
  const lines = markdown.split(/\r?\n/).map(l => l.trim());
  let globalTitle = 'Lyra Presentation';
  for (const l of lines) {
    if (l.startsWith('# ') && !isAiFillerText(l)) {
      globalTitle = cleanSlideTitle(l);
      break;
    }
  }

  let rawSections: string[] = [];
  if (markdown.includes('\n---\n') || markdown.includes('\n---')) {
    rawSections = markdown.split(/\n---+\n?/);
  } else {
    rawSections = markdown.split(/\n(?=##\s+)/);
  }

  const slides: PresentationSlide[] = [];

  for (let i = 0; i < rawSections.length; i++) {
    const sec = rawSections[i].trim();
    if (!sec) continue;

    if (isAiFillerText(sec) && sec.length < 250) {
      continue;
    }

    const secLines = sec.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (secLines.length === 0) continue;

    if (isAiFillerText(secLines[0])) {
      secLines.shift();
      if (secLines.length === 0) continue;
    }

    let titleLine = secLines[0];
    let subtitleLine: string | undefined = undefined;
    let bodyLines = secLines.slice(1);

    if (titleLine.startsWith('#')) {
      titleLine = cleanSlideTitle(titleLine);
    } else {
      titleLine = cleanSlideTitle(titleLine);
    }

    if (bodyLines.length > 0 && !bodyLines[0].startsWith('-') && !bodyLines[0].startsWith('*') && !bodyLines[0].startsWith('#')) {
      if (!isAiFillerText(bodyLines[0])) {
        subtitleLine = bodyLines[0];
        bodyLines = bodyLines.slice(1);
      }
    }

    const bullets: string[] = [];
    const cards: SlideCard[] = [];
    const stats: SlideStat[] = [];

    for (const bLine of bodyLines) {
      if (isAiFillerText(bLine)) continue;

      if (bLine.startsWith('- ') || bLine.startsWith('* ') || /^\d+\.\s/.test(bLine)) {
        const item = bLine.replace(/^[-*]\s+|\d+\.\s+/, '').trim();
        bullets.push(item);

        const cardMatch = item.match(/^\*\*(.*?)\*\*[:\-]?\s*(.+)$/);
        if (cardMatch) {
          const cardTitle = cleanMarkdownFormatting(cardMatch[1]);
          const cardDesc = cleanMarkdownFormatting(cardMatch[2]);
          cards.push({ title: cardTitle, description: cardDesc });
        }

        const statMatch = item.match(/^\*\*([0-9\+\-\$€£%kKmMbB\.\s]+)\*\*[:\-]?\s*(.+)$/);
        if (statMatch) {
          stats.push({ value: statMatch[1].trim(), label: cleanMarkdownFormatting(statMatch[2]) });
        }
      }
    }

    let slideType: 'title' | 'content' | 'cards' | 'stats' = 'content';
    if (slides.length === 0 && (bullets.length === 0 || i === 0)) {
      slideType = 'title';
    } else if (stats.length >= 2 && stats.length <= 4) {
      slideType = 'stats';
    } else if (cards.length >= 2 && cards.length <= 4) {
      slideType = 'cards';
    }

    slides.push({
      title: titleLine || globalTitle,
      subtitle: subtitleLine,
      type: slideType,
      cards: slideType === 'cards' ? cards : undefined,
      stats: slideType === 'stats' ? stats : undefined,
      bullets: slideType === 'content' ? (bullets.length > 0 ? bullets : undefined) : undefined
    });
  }

  if (slides.length === 0) {
    slides.push({
      title: globalTitle,
      subtitle: 'Lyra Autonomous Studio Presentation',
      type: 'title'
    });
  }

  if (slides[0]) {
    slides[0].type = 'title';
    if (!slides[0].subtitle) {
      slides[0].subtitle = 'Autonomous Presentation Deck';
    }
  }

  return {
    title: globalTitle,
    theme: 'dark',
    slides
  };
}
