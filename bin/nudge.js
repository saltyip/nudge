#!/usr/bin/env node

import process from 'process';
import { parseTime } from '../lib/parser.js';
import { addNudge, getNudges, removeNudge } from '../lib/store.js';
import { startDaemon, triggerCmd } from '../lib/daemon.js';

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};
//process.argv gives array of the the whole commands
//  eg => node hello world -3000 "hello world"
//  that would be [node ,hello, world ,-3000, "hello world"] 
const args = process.argv.slice(2);  //slice basically removes the 0 and 1 ist index 

function showHelp() {
  console.log(`
${c.bold}nudge${c.reset} ${c.dim}- A minimal CLI reminder tool${c.reset}

${c.bold}Usage:${c.reset}
  nudge "message"                          Save a note instantly
  nudge "message" "time string"            Natural language time parsing (e.g. "in 2 hours")
  nudge "message" --after <process>        Watch a process, fire when it exits
  nudge "message" --after-cmd "<command>"  Fire after a specific terminal command finishes
  nudge list                               Show all pending nudges
  nudge done <id>                          Clear a specific nudge
  nudge daemon                             Run the background checker loop
  nudge --trigger-cmd "<command>"          (Internal) Triggered by shell hook
  nudge --help                             Show this help message
`);
}

async function main() {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  const cmd = args[0]; //gives the argument alone 

  if (cmd === 'daemon') {
    await startDaemon();
    return;
  }

  if (cmd === '--trigger-cmd') { //0 would be trigger-cmd so 1 would be cmd
    const triggerStr = args[1];
    if (triggerStr) {
      await triggerCmd(triggerStr);
    }
    return;
  }

  if (cmd === 'list') {
    const nudges = await getNudges();
    if (nudges.length === 0) {
      console.log(`${c.dim}No pending nudges.${c.reset}`);
      return;
    }
    console.log(`${c.bold}Pending nudges:${c.reset}`);
    nudges.forEach(n => {
      let info = '';
      if (n.type === 'time') {
        const remaining = Math.max(0, new Date(n.targetTime) - new Date());
        const mins = Math.ceil(remaining / 60000);
        info = `(in ~${mins} mins)`;
      } else if (n.type === 'process') {
        info = `(after process: ${n.processName})`;
      } else if (n.type === 'cmd') {
        info = `(after command: ${n.cmdStr})`;
      } else if (n.type === 'note') {
        info = `(note)`;
      }
      console.log(`  ${c.blue}${n.id}.${c.reset} ${n.message} ${c.dim}${info}${c.reset}`);
    });
    return;
  }

  if (cmd === 'done') {
    const id = parseInt(args[1], 10);
    if (isNaN(id)) {
      console.error(`${c.red}✖ Error:${c.reset} Please provide a valid nudge ID.`);
      process.exit(1);
    }
    const success = await removeNudge(id);
    if (success) {
      console.log(`${c.green}✔${c.reset} Nudge ${c.bold}${id}${c.reset} cleared.`);
    } else {
      console.error(`${c.red}✖ Error:${c.reset} Nudge ${id} not found.`);
      process.exit(1);
    }
    return;
  }

  // Creating a new nudge
  const message = args[0];
  if (args.length === 1) {
    // Instant note
    await addNudge({ type: 'note', message });
    console.log(`${c.green}✔ Note saved:${c.reset} "${message}"`);
    return;
  }

  const opt = args[1];

  if (opt === '--after') {
    const processName = args[2];
    if (!processName) {
      console.error(`${c.red}✖ Error:${c.reset} Please provide a process name.`);
      process.exit(1);
    }
    await addNudge({ type: 'process', message, processName, wasRunning: false });
    console.log(`${c.green}✔ Nudge saved:${c.reset} "${message}" ${c.dim}(after process: ${processName} exits)${c.reset}`);
    return;
  }

  if (opt === '--after-cmd') {
    const cmdStr = args[2];
    if (!cmdStr) {
      console.error(`${c.red}✖ Error:${c.reset} Please provide a command string.`);
      process.exit(1);
    }
    await addNudge({ type: 'cmd', message, cmdStr });
    console.log(`${c.green}✔ Nudge saved:${c.reset} "${message}" ${c.dim}(after command: ${cmdStr})${c.reset}`);
    return;
  }

  // Otherwise, it should be a time string
  const timeStr = args[1];
  const targetDate = await parseTime(timeStr);

  if (!targetDate) {
    console.error(`${c.red}✖ Error:${c.reset} Could not parse time string "${timeStr}".`);
    process.exit(1);
  }

  if (targetDate < new Date()) {
    console.error(`${c.red}✖ Error:${c.reset} Parsed time is in the past.`);
    process.exit(1);
  }

  await addNudge({ type: 'time', message, targetTime: targetDate.toISOString() });
  console.log(`${c.green}✔ Nudge saved:${c.reset} "${message}" ${c.dim}(at ${targetDate.toLocaleString()})${c.reset}`);
}

main().catch(err => {
  console.error(`${c.red}✖ Unexpected error:${c.reset}`, err);
  process.exit(1);
});
