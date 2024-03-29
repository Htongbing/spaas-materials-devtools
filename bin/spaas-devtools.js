#!/usr/bin/env node
const program = require('commander');
const chalk = require('chalk');
const semver = require('semver');
const updater = require('npm-updater');
const packageJson = require('../package.json');
const COMMANDS = require('../config/commands');
const optionsAttachToEnv = require('../utils/options-attach-to-env');

const cwd = process.cwd();
// TODO 统计用户版本

const tag = 'latest';
const updateMessage = `你可以执行 npm install -g spaas-devtools@${tag} 来安装此版本\n`;

// 提醒用户安装最新版本
updater({
  package: packageJson,
  abort: false,
  tag,
  updateMessage,
  interval: '1d',
}).catch(() => {
}).then(exec);

/**
 * check node version
 * @param {string} wanted
 * @param {string} id
 */
function checkNodeVersion(wanted, id) {
  if (!semver.satisfies(process.version, wanted)) {
    console.log(
      chalk.red(
        `You are using Node ${
          process.version
        }, but this version of ${
          id
        } requires Node ${
          wanted
        }.\nPlease upgrade your Node version.`
      )
    );
    process.exit(1);
  }
}

function exec() {
  const requiredVersion = packageJson.engines.node;
  checkNodeVersion(requiredVersion, packageJson.name);

  /**
   * Usage.
   */
  program.version(packageJson.version).usage('[command] [options]');

  Object.entries(COMMANDS).forEach((entry) => {
    let command = program
      .command(entry[0])
      .description(chalk.green(entry[1].desc));

    if (entry[1].options) {
      entry[1].options.forEach((opt) => {
        command = command.option(opt.name, opt.desc);
      });
    }

    command.action(function () {
      const cmdType = entry[0];

      optionsAttachToEnv(command);

      /* eslint-disable-next-line import/no-dynamic-require */
      const fn = require(`../lib/${cmdType}`);

      /* eslint-disable-next-line prefer-rest-params */
      const args = [cwd].concat(Array.prototype.slice.call(arguments));

      fn.apply(global, args);
    });
  });

  // output help information on unknown commands
  program.parse(process.argv);
  if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(1);
  }

  program.arguments('<command>').action((cmd) => {
    program.outputHelp();
    console.log(`  ${chalk.red(`Unknown command ${chalk.yellow(cmd)}.`)}`);
  });
}