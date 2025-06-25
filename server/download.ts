import archiver from 'archiver';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export async function downloadProject(req: Request, res: Response) {
  try {
    // Set headers for zip download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=interview-genie-project.zip');

    // Create archiver instance
    const archive = archiver('zip', {
      zlib: { level: 9 } // compression level
    });

    // Pipe archive data to response
    archive.pipe(res);

    // Project root directory
    const projectRoot = path.resolve(process.cwd());

    // Files and directories to exclude
    const excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      '.replit',
      '.env',
      '*.log',
      '.DS_Store',
      'Thumbs.db'
    ];

    // Add all files except excluded ones
    const addDirectory = (dirPath: string, archivePath: string = '') => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.join(archivePath, item);
        
        // Skip excluded patterns
        if (excludePatterns.some(pattern => {
          if (pattern.includes('*')) {
            return item.includes(pattern.replace('*', ''));
          }
          return item === pattern;
        })) {
          continue;
        }

        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          addDirectory(fullPath, relativePath);
        } else {
          archive.file(fullPath, { name: relativePath });
        }
      }
    };

    // Add project files
    addDirectory(projectRoot);

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error('Error creating zip file:', error);
    res.status(500).json({ error: 'Failed to create zip file' });
  }
}