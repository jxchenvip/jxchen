# jxchen

一个命令行实用程序，它可以创建项目文件夹及项目下的版本文件夹（1.0.0）每次创建自动增加版本号,然后可以选择生成webpack.config.js、gulpfile.js、gruntfile.js 配置文件，完成后会自动打开所建项目目录，项目路径也被拷贝进粘贴板！！

#目录结构

    ├── project_name                     - 项目文件夹
    │   ├── 1.0.0                        - 项目版本号
    │       ├── webpack.config.js*       - webpack.config.js配置文件（可选）
    │       ├── gulpfile.js*             - gulpfile.js配置文件（可选）
    │       ├── gruntfile.js*            - gruntfile配置文件（可选）

# Getting jxchen

The easiest way to get jxchen is with npm:

    npm install jxchen -g

Alternatively you can clone this git repository:

    git clone git@github.com:jxchenvip/jxchen.git

# License

This project is released under The [MIT License](https://opensource.org/licenses/mit-license.php).

