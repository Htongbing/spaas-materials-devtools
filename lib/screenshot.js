const debug = require('debug')('ice:screenshot:general');
const path = require('path');
const imagemin = require('imagemin');
const fs = require('fs');
const ora = require('ora');
const { getUnpkgHost } = require('ice-npm-utils');
const pkgJSON = require('../utils/pkg-json');
const getType = require('../utils/type');
const logger = require('../utils/logger');
const createlocalServer = require('../utils/local-server');
const screenshotDOMElement = require('../utils/screenshot');
const message = require('../utils/message');
const getTempPath = require('../utils/temp-path');
const uploadFile = require('../utils/upload-file');

module.exports = function screenshot(cwd, opt) {
  let ossConfig = '';
  try {
    ossConfig = require(path.join(cwd, opt.ossConfig));
  } catch(err) {

  }
  const type = getType(cwd);
  debug('type %s', type);
  if (!type) {
    logger.fatal(message.invalid);
  }

  const port = opt.port || 8990;

  /* eslint-disable-next-line import/no-dynamic-require */
  const { selector, servePath, urlpath } = require(`./${type}/screenshot`)(cwd);
  const tempPath = getTempPath();
  const screenshotTempPath = path.join(tempPath, 'screenshot.png'); // 临时地址

  const url = `http://127.0.0.1:${port}${urlpath}`;

  /* eslint wrap-iife:0 */
  (async function execute() {
    const server = createlocalServer(servePath, port);
    const spin = ora('screenshoting ...');
    spin.start();
    try {
      // 截取页面中某个元素的快照
      await screenshotDOMElement(url, selector, screenshotTempPath);

      // 图片压缩
      await imagemin([screenshotTempPath], cwd);

      // 删除未压缩的图像
      fs.unlinkSync(screenshotTempPath);
      spin.succeed('generate screenshot.png sucesss');
    } catch (error) {
      spin.fail('generate screenshot.png fail');
      logger.fatal(error);
    } finally {
      server.close();
      spin.stop();
      const upload = ora('uploading ...');
      upload.start();

      let screenshotUrl = '';
      const pkg = pkgJSON.getPkgJSON(cwd);
      const version = pkg.version;
      const pkgName = pkg.name;

      try {
        // 如果不设置ossConfig，则不上传对应的截图
        if (!ossConfig) return;
        // 截图后更新 package.json 的字段
        const url = await uploadFile(`${cwd}/screenshot.png`, `${pkgName}@${version}/screenshot.png`, ossConfig);
        screenshotUrl = url;
      } catch(err) {
      } finally {
        upload.stop();
        pkg.homepage = '';
        pkg[`${type}Config`].screenshot = screenshotUrl;
        const file = path.join(cwd, 'package.json');
        fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
        if (opt.callback) {
          opt.callback();
        }
      }
    }
  })();
};
