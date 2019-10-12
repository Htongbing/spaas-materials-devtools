const request = require('request-promise');
const shelljs = require('shelljs');
const chalk = require('chalk');
const { register } = require('../config/const');

function getPrivatePackages() {
  return request.get(`${register}/-/verdaccio/packages`).then(res => {
    let body;

    try {
      body = JSON.parse(res);
    } catch (e) {
      return Promise.reject(e);
    };

    const packages = {};

    body.forEach(({name, version}) => {
      packages[name] = version;
    });

    return packages;
  });
};

function logVersionDiff(packages, tip) {
  if (packages.length) {
    console.log(chalk.yellow(tip));
    console.log(packages.map(([package, version, latest]) => `${chalk.blue(`${package}: `)}${chalk.green(`${version} => ^${latest}`)}`).join('\n'));
  };
};

function installPackages(packages, register = 'https://registry.npm.taobao.org') {
  return new Promise((resolve, reject) => {
    const installCommand = `yarn add ${packages.map(([package]) => package).join(' ')} --registry=${register}`;
    shelljs.exec(installCommand, code => {
      code === 0 ? resolve() : reject(new Error('Execution error'));
    });
  });
};

module.exports = {
  getPrivatePackages,
  logVersionDiff,
  installPackages
};