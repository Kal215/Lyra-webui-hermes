/**
 * Lyra Autonomous Studio - Word (.docx) Compiler
 * 100% Pure JavaScript/TypeScript, Zero OS-level dependencies.
 * Converts structured markdown into professional, executive Word documents
 * with standard margins, heading hierarchies, styled bullets, and callouts.
 */
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType,
  BorderStyle
} from 'docx';
import fs from 'fs/promises';
import path from 'path';

export async function compileMarkdownToDocx(
  markdown: string, 
  documentTitle: string, 
  outputPath: string
): Promise<string> {
  const lines = markdown.split(/\r?\n/);
  const docElements: Paragraph[] = [];

  // Title block
  docElements.push(
    new Paragraph({
      text: documentTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 }
    })
  );

  docElements.push(
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Lyra Autonomous Studio • ${new Date().toLocaleDateString()}`, 
          color: '71717A',
          size: 18
        })
      ],
      spacing: { after: 360 }
    })
  );

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('# ')) {
      docElements.push(
        new Paragraph({
          text: line.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 120 }
        })
      );
    } else if (line.startsWith('## ')) {
      docElements.push(
        new Paragraph({
          text: line.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );
    } else if (line.startsWith('### ')) {
      docElements.push(
        new Paragraph({
          text: line.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 }
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      const cleanBullet = line.replace(/^[-*]\s+|\d+\.\s+/, '');
      docElements.push(
        new Paragraph({
          children: parseInlineFormatting(cleanBullet),
          bullet: { level: 0 },
          spacing: { after: 80 }
        })
      );
    } else if (line.startsWith('> ')) {
      // Blockquote / Callout
      docElements.push(
        new Paragraph({
          children: parseInlineFormatting(line.replace(/^>\s+/, ''), true),
          border: {
            left: { color: '4F46E5', space: 10, style: BorderStyle.SINGLE, size: 24 }
          },
          spacing: { before: 120, after: 120 }
        })
      );
    } else {
      // Regular paragraph
      docElements.push(
        new Paragraph({
          children: parseInlineFormatting(line),
          spacing: { after: 140 }
        })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch standard margins
        }
      },
      children: docElements
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

/**
 * Parses bold (**text**) and inline code (`code`) into styled TextRuns
 */
function parseInlineFormatting(text: string, isItalic: boolean = false): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({
        text: part.slice(2, -2),
        bold: true,
        italics: isItalic,
        color: '09090B'
      }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({
        text: part.slice(1, -1),
        font: 'Consolas',
        color: '4F46E5',
        size: 19
      }));
    } else {
      runs.push(new TextRun({
        text: part,
        italics: isItalic,
        color: '27272A'
      }));
    }
  }

  return runs;
}
