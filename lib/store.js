import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const dirPath = path.join(os.homedir(), '.local', 'share', 'nudge');
const filePath = path.join(dirPath, 'nudges.json');

export async function initStore() {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify([]));
    }
  } catch (err) {
    console.error('Error initializing store:', err.message);
    process.exit(1);
  }
}

export async function getNudges() {
  await initStore();
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export async function saveNudges(nudges) {
  await initStore();
  await fs.writeFile(filePath, JSON.stringify(nudges, null, 2));
}

export async function addNudge(nudge) {
  const nudges = await getNudges();
  const id = nudges.length > 0 ? Math.max(...nudges.map(n => n.id)) + 1 : 1;
  const newNudge = { id, createdAt: new Date().toISOString(), ...nudge };
  nudges.push(newNudge);
  await saveNudges(nudges);
  return newNudge;
}

export async function removeNudge(id) {
  const nudges = await getNudges();
  const filtered = nudges.filter(n => n.id !== id);
  if (filtered.length === nudges.length) return false;
  await saveNudges(filtered);
  return true;
}
