import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function notify(message, context = '') {
  try {
    // Escape quotes to prevent shell injection
    const escapedMessage = message.replace(/"/g, '\\"');
    const escapedContext = context.replace(/"/g, '\\"');
    
    const title = escapedContext ? `Nudge (${escapedContext})` : 'Nudge';
    await execAsync(`notify-send "${title}" "${escapedMessage}" -u normal -a nudge`);
  } catch (err) {
    console.error('Failed to send notification:', err.message);
  }
}
