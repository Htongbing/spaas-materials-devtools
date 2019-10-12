const pkgJSON = require('../utils/pkg-json');
const logger = require('../utils/logger');
const { getPrivatePackages, installPackages, logVersionDiff } = require('../utils/spaas-npm-utils');
const { getLatestVersion } = require('ice-npm-utils');
const chalk = require('chalk');
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

  // 检查私有源包版本提示
  const checkSpinner = ora('checking private packages');
  checkSpinner.start();

  // 获取spaas私有源包
  const spaasPrivatePackages = await getPrivatePackages();
  
  // 需要使用公有源安装的依赖
  let publicPackages = [];
  // 需要使用私有源安装的依赖
  const privatePackages = [];

  // 筛选出@spaas的依赖
  const allSpaasPackages = Object.entries(dependencies).filter(([package]) => package.startsWith('@spaas/'));

  // 检查每一个@spaas依赖是否在私有源上有发布
  allSpaasPackages.forEach(([package, version]) => {
    // 获取私有源上对应包的最新版本
    const latest = spaasPrivatePackages[package];

    // 私有源上没有发布的依赖推入公有源依赖数组
    if (!latest) {
      publicPackages.push([package, version]);
      return;
    };
    
    // 检测本地依赖是否为最新版本
    const pattern = new RegExp(latest);
    if (!pattern.test(version)) privatePackages.push([package, version, latest]);
  });

  checkSpinner.stop();

  if (privatePackages.length) {
    logger.info('installing private packages');
    
    // 安装私有源依赖
    await installPackages(privatePackages, register);
  };

  // 检测版本出错的信息
  const publicCheckVerionError = [];

  if (publicPackages.length) {
    // 检测版本
    const checkPublicVersion = async (publicPackage, version) => {
      try {
        const latest = await getLatestVersion(publicPackage);
        const pattern = new RegExp(latest);
        if (!pattern.test(version)) return [publicPackage, version, latest];
      } catch (e) {
        // 推入报错信息
        publicCheckVerionError.push(`${chalk.blue(`${publicPackage}: `)}${chalk.red(e.message)}`);
      };
    };

    // 检测版本提示
    const checkSpinner = ora('checking publich packages');
    checkSpinner.start();

    publicPackages = await Promise.all(publicPackages.map(([package, version]) => checkPublicVersion(package, version)));

    checkSpinner.stop();

    // 打印报错信息
    if (publicCheckVerionError.length) {
      console.log(publicCheckVerionError.join('\n'));
    };
    
    // 过滤undefined
    publicPackages = publicPackages.filter(i => !!i);

    if (publicPackages.length) {
      logger.info('installing public packages');

      await installPackages(publicPackages);
    };
  };

  // 打印私有源版本对比信息
  logVersionDiff(privatePackages, 'private');

  // 打印公有源版本对比信息
  logVersionDiff(publicPackages, 'public');

  if (!privatePackages.length && !publicPackages.length && !publicCheckVerionError.length) logger.info('Every packages are the latest');
};