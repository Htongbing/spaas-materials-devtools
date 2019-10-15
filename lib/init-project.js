const inquirer = require('inquirer');
const download = require('../utils/spaas-download');
const fs = require('fs');
const path = require('path');

module.exports = async cwd => {

  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      message: '项目文件夹名称',
      name: 'projectName',
      require: true,
      validate: value => {
        if (!value.trim()) return '不能为空，请重新输入';
        try {
          fs.readdirSync(path.join(cwd, value));
          return `项目文件夹(${value})已经存在，请重新输入`;
        } catch (e) {
          return true;
        };
      }
    },
  ]);

  await download(projectName);

  return projectName;
};