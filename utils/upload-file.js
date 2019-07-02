const OSS = require('ali-oss');
const chalk = require('chalk');

async function uploadFile(cwd, fileName, ossConfig) {
    // 创建阿里OSS
    let client = new OSS({
        ...ossConfig,
        region: ossConfig.region,
        accessKeyId: ossConfig.accessKeyId,
        accessKeySecret: ossConfig.accessKeySecret,
        bucket: ossConfig.bucket
    });
    try {
      const {url} = await client.put(`${ossConfig.dir || ''}${fileName}`, cwd);
      return url
    } catch(err) {
        console.log(chalk.red('上传失败，请检查OSS配置是否正确！'));
        process.exit(1);
    }
};

module.exports = uploadFile;
