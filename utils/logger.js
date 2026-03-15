import chalk from 'chalk';

function write(level, scope, message) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${scope}]`;

  switch (level) {
    case 'success':
      console.log(chalk.green(`${prefix} ${message}`));
      break;
    case 'warn':
      console.warn(chalk.yellow(`${prefix} ${message}`));
      break;
    case 'error':
      console.error(chalk.red(`${prefix} ${message}`));
      break;
    case 'debug':
      if (process.env.DEBUG === '1') {
        console.debug(chalk.gray(`${prefix} ${message}`));
      }
      break;
    default:
      console.log(chalk.cyan(`${prefix} ${message}`));
      break;
  }
}

const logger = {
  info(scope, message) {
    write('info', scope, message);
  },
  success(scope, message) {
    write('success', scope, message);
  },
  warn(scope, message) {
    write('warn', scope, message);
  },
  error(scope, message) {
    write('error', scope, message);
  },
  debug(scope, message) {
    write('debug', scope, message);
  },
};

export default logger;
