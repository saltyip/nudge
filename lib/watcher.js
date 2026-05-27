import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function isProcessRunning(processName) {
  try {
    // pgrep exits with 0 if at least one process matches
    const { stdout } = await execFileAsync('pgrep', [processName]); //searches proces and prints PID and name 
    return stdout.trim().length > 0;
  } catch (err) {
    // If no process is found, pgrep returns exit code 1
    return false;
  }
}
