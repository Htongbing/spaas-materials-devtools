const request = require('request-promise');
const { register } = require('../config/const')

const cacheData = {}

/**
 * 从 register 获取 npm 的信息
 */
function getNpmInfo(npm) {
  if (cacheData[npm]) {
    return Promise.resolve(cacheData[npm]);
  }

  const url = `${register}/${npm}`;

  return request.get(url).then((response) => {

    let body;
    try {
      body = JSON.parse(response);
    } catch (error) {
      return Promise.reject(error);
    }

    cacheData[npm] = body;
    return body;
  });
}

/**
 * 获取某个 npm 的最新版本号
 *
 * @param {String} npm
 */
function getLatestVersion(npm) {
  return getNpmInfo(npm).then((data) => {
    if (!data['dist-tags'] || !data['dist-tags'].latest) {
      return Promise.reject(new Error('Error: 没有 latest 版本号'));
    }

    const latestVersion = data['dist-tags'].latest;
    return latestVersion;
  });
}

module.exports = {
  getLatestVersion
};