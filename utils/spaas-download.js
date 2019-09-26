const download = require('download-git-repo');
const ora = require('ora');
const { spaasCliGithubDepository } = require('../config/const');
const logger = require('../utils/logger');

module.exports = async dir => {
  return new Promise((resolve, reject) => {

    const spinner = ora('downloading');
    spinner.start();

    download(spaasCliGithubDepository, `./${dir}`, err => {
      spinner.stop();
      if (err) return reject(err);
      logger.info('init success');
      resolve()
    });
  });
};