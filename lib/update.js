const pkgJSON = require('../utils/pkg-json');
const logger = require('../utils/logger');
const { getLatestVersion } = require('../utils/spaas-npm-utils');
const { getLatestVersion: getPublicLatestVersion } = require('ice-npm-utils');
const chalk = require('chalk');
const shelljs = require('shelljs');
const ora = require('ora');
const { register } = require('../config/const');

module.exports = async (cwd) => {
  // 获取package.json文件
  const pkg = pkgJSON.getPkgJSON(cwd);

  // 获取安装的依赖包
  const { dependencies } = pkg;

  if (!dependencies) {
    logger.fatal('No dependencies');
  };

  // 检查版本出现的错误信息
  let errorInfo = [];

  // 需要使用公有源安装的依赖
  const publicPackages = [];

  // 检查最新版本
  const checkVersion = async (spaasPackage, version) => {
    try {
      const latest = await getLatestVersion(spaasPackage);
      const pattern = new RegExp(latest);
      if (!pattern.test(version)) return spaasPackage;
    } catch (e) {
      errorInfo.push(`${chalk.blue(`${spaasPackage}: `)}${chalk.red(e.message)}`)
    }
  };

  // 筛选出@spaas的依赖
  const allSpaasPackages = Object.entries(dependencies).filter(([package]) => package.startsWith('@spaas/'));

  // 检查提示
  const checkSpinner = ora('checking version');
  checkSpinner.start();

  // 执行所有@spaas包的检查版本函数
  const packages = await Promise.all(allSpaasPackages.map(([package, version]) => checkVersion(package, version)));

  checkSpinner.stop();

  // 过滤undefined
  const privatePackages = packages.filter(i => !!i);

  if (errorInfo.length) {
    // 检查版本报错的信息输出
    console.log(errorInfo.join('\n'));
  } else if (!privatePackages.length) {
    // 无需更新提示
    logger.info('Every packages are the latest');
  };
  
  if (privatePackages.length) {
    // 执行yarn安装最新依赖，指定私有源
    const installCommand = `yarn add ${privatePackages.join(' ')} --registry=${register}`;
    shelljs.exec(installCommand);
  };

  if (publicPackages.length) {
    // 执行yarn安装最新依赖，指定公有源
    const installCommand = `yarn add ${publicPackages.join(' ')}`;
    shelljs.exec(installCommand);
  };
};