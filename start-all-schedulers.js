import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const schedulers = [
  { name: 'fb-automation', script: 'fb-automation/scheduler.js' },
  { name: 'fb-print-automation', script: 'fb-print-automation/scheduler.js' },
  { name: 'fb-royalking-automation', script: 'fb-royalking-automation/scheduler.js' },
];

function startScheduler({ name, script }) {
  const fullPath = path.join(__dirname, script);
  console.log(`[Master] Starting ${name}...`);

  const child = fork(fullPath, [], { stdio: 'inherit' });

  child.on('exit', (code) => {
    console.error(`[Master] ${name} exited with code ${code}. Restarting in 10s...`);
    setTimeout(() => startScheduler({ name, script }), 10000);
  });

  child.on('error', (err) => {
    console.error(`[Master] ${name} error: ${err.message}`);
  });
}

console.log('\n  ╔══════════════════════════════════════════════╗');
console.log('  ║   MASTER SCHEDULER - ALL FB PAGES            ║');
console.log('  ╚══════════════════════════════════════════════╝\n');

schedulers.forEach(startScheduler);
