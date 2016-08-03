#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var dir = process.cwd(); // dir 为全局变量初始为执行目录
var dir_lib = path.join(__dirname, '../lib'); // 保存目录
var utils = path.join(__dirname, '../lib/utils'); // 保存目录
var color = require('../lib/utils/color'); // 设置颜色 
var pkg = require('../package.json'); // 读取package.json
var childProcess = require('child_process');
var ncp = require("copy-paste"); // 复制，粘贴


/**
 * 整理入参数
 */
var argvs = process.argv.reduce(function (o, key, index, arr) {
    var k = key.charAt(0) == '-' ? key.substr(1) : key;
    k = k.toLowerCase();
    o[k] = k;
    return o;
}, {});


/**
 * 帮助
 */
if (argvs.h) {
    console.log(color.TIP + 'jxchen: ')
    console.log(color.TIP + '-h help');
    console.log(color.TIP + '-v version');
    process.exit();
}

/**
 * 版本号
 */
if (argvs.v) {
    console.log(pkg.version);
    process.exit();
}





/**
 * 创建项目目录
 */
function mkdirSync() {
    var cwd = process.cwd();
    var newDir = path.relative(cwd, dir);
    if (!fs.existsSync(newDir)) { // 检索当前目录是否有此文件夹
        var pathtmp;
        newDir.split(path.sep).forEach(function (dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            } else {
                pathtmp = path.join(cwd, dirname);
            }
            if (!fs.existsSync(pathtmp)) fs.mkdir(pathtmp);
        })
    }
    return true;
}


/**
 * 拷贝文件
 */
function copy(from, to, chunk) {
    var data = '';
    var readerStream = fs.createReadStream(from);
    readerStream.setEncoding('UTF8');
    // 处理流事件 --> data, end, and error
    readerStream.on('data', function (chunk) {
        data += chunk;
    });
    readerStream.on('end', function () {
        switch (chunk) { // 如果是grunt 需要相对压缩
            case 4:
                data = data.replace(/'all'/g, "'relative'");
                break;
        }
        var writerStream = fs.createWriteStream(to);
        writerStream.write(data, 'UTF8');
        writerStream.end();
        writerStream.on('finish', function () {
            console.log(color.SUCCESS + path.basename(to) + '配置文件写入成功');
            process_exit();
        });
        writerStream.on('error', function (err) {
            console.log(color.ERROR + err.stack);
        });
    });
    readerStream.on('error', function (err) {
        console.log(color.ERROR + err.stack);
    });
}


/**
 * 类似confirm
 */
function prompt(prompt, callback) {
    process.stdout.write(color.INP + prompt);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', function (chunk) {
        process.stdin.pause();
        callback(chunk.trim());
    });
}

/**
 * open dir
 */
function open_dir(d) {
    var cmd = '';
    if (process.platform === 'darwin') {
        cmd = 'open';
    } else if (process.platform === 'win32') {
        cmd = 'start';
    }
    childProcess.execSync(cmd + ' ' + d);
}


/**
 * 退出进程
 */
function process_exit() {
    ncp.copy(dir.replace(/\\/g, '/')); // 复制当前路径
    open_dir(dir); // 打开已创建目录
    process.exit();
}

/**
 * 版本号++
 */
function addVersion(c) {
    c = c || '1.0.0';
    while (fs.existsSync(path.join(dir, c))) {
        c = (c.replace(/\./g, '') * 1 + 1).toString().replace(/\d{3}$/, function (a) {
            return a.split('').join('.');
        });
    }
    return c;
}


/**
 * 填写项目名称
 */
function createProjectDir(c) {
    if (!/^[^\\/\\:\\*\\?\"<>\|]+$/.test(c)) {
        console.log(color.TIP + '项目名称只能为：数字、字母、下划线组合');
        mkProjectDir();
        return false;
    }

    if (fs.existsSync(path.join(dir, c))) {
        prompt('项目已存在，是否添加版本（y/n）', function (a) {
            switch (a) {
                case 'y':
                    dir = path.join(dir, c);
                    mkVersonDir(); // 创建版本目录
                    break;
                case 'n':
                default:
                    mkProjectDir(); // 创建版本目录
                    break;
            }
        });
        return false;
    }

    dir = path.join(dir, c);
    mkVersonDir(); // 创建版本目录
}


/**
 * 创建版本号文件夹
 */
function createVersionDir(c) {
    if (!c || !/^\d+\.\d+\.\d+$/.test(c.trim())) {
        c = addVersion(c);
    }
    dir = path.join(dir, c);
    mkdirSync(); // 创建文件夹目录
    console.log(color.TIP + '版本目录已创建完成!');
    console.log(color.TIP + dir);
    mkConfigFile(); // 创建配制文件
}


/**
 * 选择项目所需要的配置文件也可以为空
 */
function createConfigFile(c) {
    c = c || '';
    switch (c) {
        case '1':
            copy(path.join(dir_lib, 'webpack.config.js'), path.join(dir, 'webpack.config.js'));
            // createWebpackConfig(dir);
            break;
        case '2':
            copy(path.join(dir_lib, 'gulpfile.js'), path.join(dir, 'gulpfile.js'));
            break;
        case '3':
            copy(path.join(dir_lib, 'gruntfile.js'), path.join(dir, 'gruntfile.js'));
            break;
        case '4':
            copy(path.join(dir_lib, 'gruntfile.js'), path.join(dir, 'gruntfile.js'), 4);
            break;
        default:
            console.log(color.SUCCESS + '项目目录创建完成,无配置文件！');
            process_exit();
            break;
    }
}

/**
 * 创建项目目录
 */
function mkProjectDir() {
    prompt('项目名称(project name) : ', createProjectDir);
}

/**
 * 创建版本目录
 */
function mkVersonDir() {
    prompt('版本号(' + addVersion() + ') : ', createVersionDir);
}

/**
 * 是否创建配制文件
 */
function mkConfigFile() {
    prompt('配制文件(NO) \n' + color.TIP + '1: webpack 2: gulp 3: grunt-all 4: grunt-relative : ', createConfigFile);
}

// console.log('***      module.filename = ' + module.filename + ' ***');
// console.log('***           __filename = ' + __filename + ' ***');
// console.log('***            __dirname = ' + __dirname + ' ***');
// console.log('***        process.cwd() = ' + process.cwd() + ' ***');
// console.log('*** require.main.filename= ' + require.main.filename + ' ***');
mkProjectDir();