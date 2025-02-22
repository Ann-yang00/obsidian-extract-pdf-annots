import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { FileSystemAdapter, Notice, App } from 'obsidian';

// replace spaces for inserting external pdf link
export function replaceSpaces(text: string): string {
  return text.replace(/ /g, '%20');
}

// Insert General PDF info
export function insertPDFInfo(filepath: string): string { 
  const pdf_name = path.basename(filepath);
  const hyperlink = replaceSpaces(filepath);

  return `# ${pdf_name}\n[PDF link](file:///${hyperlink})\n\n## Annotations\n\n`;
}

interface Highlight {
  annotatedText: string;
  color: string;
  page: number;
  date: string;
  comment: string;
}

// from each highlight, extract the annotated text, page number, and color
export function retreiveProperties(jsonString: any): Highlight[] {
  return jsonString.map((highlight: { annotatedText: string, color: string, page: number }) => ({
    annotatedText: highlight.annotatedText,
    color: highlight.color,
    page: highlight.page
  }));
}

// Simple parsing of the returned json from pdfannots2json.exe
export function parseHighlights(jsonString: string): string {
    let texts = '';
    try {
        const jsonObject = JSON.parse(jsonString);
        const extracted_text = retreiveProperties(jsonObject);
        //const extracted_text = jsonObject.map((highlight: { annotatedText: string }) => highlight.annotatedText);
        // formatting
        for (let i = 0; i < extracted_text.length; i++) {
            const single_highlight = extracted_text[i];
            // need CSS callout to display pretty colours
            texts += `>[!quote|${single_highlight.color}] Highlight p.${single_highlight.page}\n>${single_highlight.annotatedText}\n\n`;
        }
        return texts;
    } catch (error) {
        console.error('Error parsing highlights:', error);
        return 'Error parsing highlights';
    }
}

// Borrowed from https://github.com/mgmeyers/obsidian-zotero-integration ==================
export function getVaultRoot() {
    return (this.app.vault.adapter as FileSystemAdapter).getBasePath();
  }

export function getExeRoot() {
    return path.join(
      getVaultRoot(),
      './.obsidian/plugins/obsidian-zotero-desktop-connector/'
    );
  }
  
  export function getExeName() {
    return os.platform() === 'win32'
      ? 'pdfannots2json.exe'
      : `pdfannots2json-${os.platform()}-${os.arch()}`;
  }

export function getExecutableMode(mode = 0) {
    return (
      mode | fs.constants.S_IXUSR | fs.constants.S_IXGRP | fs.constants.S_IXOTH
    );
  }

export function ensureExecutableSync(override?: string) {
    const file = override || path.join(getExeRoot(), getExeName());
  
    try {
      fs.accessSync(file, fs.constants.X_OK);
      return true;
    } catch {
      //
    }
  
    try {
      const stats = fs.statSync(file);
      fs.chmodSync(file, getExecutableMode(stats.mode));
      return true;
    } catch (err) {
      return err;
    }
  }

export function getExecutablePath() {
    return path.join(getExeRoot(), getExeName()).replace(/\\/g, '\\\\');
}

// Borrowed from https://github.com/munach/obsidian-extract-pdf-annotations ==================
export function sanitizeFilePath(filePath: string) { 
    try {
        const singleQuotedfilePath = filePath.replace(/"/g, '');
        const formattedPath: string = singleQuotedfilePath.replace(/\\/g, '\\\\');
        const stats = fs.statSync(formattedPath);
        if (stats.isFile()) {
            return formattedPath;
        } else {
            console.log('Data in clipboard is no file.');
            return 'false';
        }
    } catch (error) {
        console.log('Data in clipboard could not be read as filepath.');
        console.error(error);
        return 'false';
    }
}
