import { getNudges, saveNudges } from './store.js';
import { notify } from './notify.js';
import { isProcessRunning } from './watcher.js';

export async function checkNudges() {
  const nudges = await getNudges();
  const now = new Date();
  
  let changed = false;
  const remainingNudges = [];

  for (const nudge of nudges) {
    let shouldFire = false;
    let context = '';

    if (nudge.type === 'time') {
      const triggerTime = new Date(nudge.targetTime);
      if (now >= triggerTime) {
        shouldFire = true;
        context = `scheduled time`;
      }
    } else if (nudge.type === 'process') {
      const running = await isProcessRunning(nudge.processName);
      if (running) {
        if (!nudge.wasRunning) {
          nudge.wasRunning = true;
          changed = true;
        }
      } else {
        if (nudge.wasRunning) {
          shouldFire = true;
          context = `process exited: ${nudge.processName}`;
        }
      }
    } else if (nudge.type === 'cmd') {
      // cmd is handled by postexec hook manually triggering it
    } else if (nudge.type === 'note') {
      // instant notes don't fire automatically, they just sit as pending notes
    }

    if (shouldFire) {
      await notify(nudge.message, context);
      changed = true;
    } else {
      remainingNudges.push(nudge);
    }
  }

  if (changed) {
    await saveNudges(remainingNudges);
  }
}

export async function startDaemon() {
  console.log('Starting nudge daemon...');
  // Loop every 5 seconds for faster process tracking
  setInterval(async () => {
    try {
      await checkNudges();
    } catch (err) {
      console.error('Daemon error:', err);
    }
  }, 5000);
  
  // Run once immediately
  try {
    await checkNudges();
  } catch (err) {
    console.error('Daemon error:', err);
  }
}

export async function triggerCmd(cmdStr) {
  const nudges = await getNudges();
  let changed = false;
  const remainingNudges = [];

  for (const nudge of nudges) {
    if (nudge.type === 'cmd' && nudge.cmdStr === cmdStr) {
      await notify(nudge.message, `command finished: ${nudge.cmdStr}`);
      changed = true;
    } else {
      remainingNudges.push(nudge);
    }
  }

  if (changed) {
    await saveNudges(remainingNudges);
  }
}
