import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const designBlob = formData.get('design') as File;
    const elementsJson = formData.get('elements') as string;
    const tshirtColor = formData.get('tshirtColor') as string;

    if (!designBlob) {
      return NextResponse.json({ error: 'No design file' }, { status: 400 });
    }

    const timestamp = Date.now();
    const filename = `design-${timestamp}.png`;
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    
    // Ensure exports directory exists
    await mkdir(exportsDir, { recursive: true });

    // Save PNG
    const buffer = Buffer.from(await designBlob.arrayBuffer());
    await writeFile(path.join(exportsDir, filename), buffer);

    // Save metadata
    const metaPath = path.join(exportsDir, 'submissions.json');
    let submissions: unknown[] = [];
    try {
      const existing = await readFile(metaPath, 'utf-8');
      submissions = JSON.parse(existing);
    } catch { /* first submission */ }

    submissions.push({
      id: timestamp,
      filename,
      url: `/exports/${filename}`,
      tshirtColor,
      elements: JSON.parse(elementsJson || '[]'),
      submittedAt: new Date().toISOString(),
      status: 'pending'
    });

    await writeFile(metaPath, JSON.stringify(submissions, null, 2));

    return NextResponse.json({ success: true, url: `/exports/${filename}` });
  } catch (err) {
    console.error('Submit design error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
