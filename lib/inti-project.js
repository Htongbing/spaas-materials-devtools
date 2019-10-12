const inquirer = require('inquirer');
const download = require('../utils/spaas-download');
const fs = require('fs');
const path = require('path');

module.exports = async cwd => {

  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      message: 'Project name',
      name: 'projectName',
      require: true,
      validate: value => {
        if (!value.trim()) return 'cannot be empty, please enter again';
        try {
          fs.readdirSync(path.join(cwd, value));
          return `this project name(${value}) has already exist. please enter again`;
        } catch (e) {};
        return true;
      }
    },
  ]);

  await download(projectName);
  
};