import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function notify(message, context = '') {
  try {
    const title = context ? `Nudge (${context})` : 'Nudge';
    await execFileAsync('notify-send', [
      title,
      message,
      '-u', 'normal',
      '-a', 'nudge',
      '-i', 'appointment-new'
    ]);
  } catch (err) {
    console.error('Failed to send notification:', err.message);
  }
}
