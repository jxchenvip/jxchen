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
var argvs = process.argv.reduce((o, key, index, arr) => {
    var k = key.replace(/-/g, '').toLowerCase();
    if (/^path:/.test(k)) {
        o['path'] = k.replace(/^path:/, '');
    } else {
        o[k] = k;
    }
    return o;
}, {});

/**
 * 帮助
 */
if (argvs.h) {
    console.log(`${color.TIP} jxchen`);
    console.log(`${color.TIP} -h help`);
    console.log(`${color.TIP} -v version`);
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
 * [hasProject 是否有项目文件夹]
 * @param  {Function} callback [回调]
 * @return {Boolean}           [是，否]
 */
function hasProject(callback) {
    if (fs.existsSync(dir)) {
        prompt(`项目已存在，是否添加版本（y/n）`, (chunk) => {
            chunk = chunk.toLowerCase();
            chunk = (chunk && chunk != 'y') ? 'n' : 'y';
            switch (chunk) {
                case 'y':
                    callback();
                    break;
                case 'n':
                    dir = process.cwd();
                    start();
                    break;
            }
        });
        return true;
    }
    callback();
    return false;
}

/**
 * [setPorject 设置项目文件夹]
 * @param {Function} callback [description]
 */
function setPorject(callback) {
    var arg = arguments;
    prompt(`项目名称(project name) : `, (chunk) => {
        if (!/^[^\\/\\:\\*\\?\"<>\|]+$/.test(chunk)) {
            console.log(`${color.TIP}项目名称只能为：数字、字母、下划线组合`);
            arg.callee(callback);
            return false;
        }
        dir = path.join(dir, chunk);
        callback(chunk);
    });
}

/**
 * [setVersonDir 设置项目版本]
 * @param {Function} callback [description]
 */
function setVersonDir(callback) {
    var arg = arguments;
    var ver = addVersion();
    prompt(`版本号${ver} : `, (chunk) => {
        chunk = chunk || ver;
        if (!/^[^\\/\\:\\*\\?\"<>\|]+$/.test(chunk)) {
            arg.callee(callback);
            return false;
        }
        if (fs.existsSync(path.join(dir, chunk))) {
            console.log(`${color.TIP}此版本已存在，请重新输入版本名称`)
            arg.callee(callback);
            return false;
        }
        dir = path.join(dir, chunk);
        callback(chunk);
    });
}

/**
 * [setConfigFile 设置项目配制文件]
 * @param {Function} callback [description]
 */
function setConfigFile(callback) {
    prompt(`配制文件(NO) \n${color.TIP }1: webpack 2: gulp 3: grunt-all 4: grunt-relative : `, (chunk) => {
        chunk = Number(chunk) || 0;
        chunk = isNaN(chunk) ? 1 : chunk;
        callback(chunk);
    });
}

/**
 * [createConfig 选择项目所需要的配置文件也可以为空]
 * @param  {[Number]} chunk [配制选项]
 */
function createConfig(chunk) {
    switch (chunk) {
        case 1:
            copy(path.join(dir_lib, 'webpack.config.js'), path.join(dir, 'webpack.config.js'));
            break;
        case 2:
            copy(path.join(dir_lib, 'gulpfile.js'), path.join(dir, 'gulpfile.js'));
            break;
        case 3:
            copy(path.join(dir_lib, 'gruntfile.js'), path.join(dir, 'gruntfile.js'));
            break;
        case 4:
            copy(path.join(dir_lib, 'gruntfile.js'), path.join(dir, 'gruntfile.js'), 4);
            break;
        default:
            console.log(color.SUCCESS + '项目目录创建完成,无配置文件！');
            process_exit(dir);
            break;
    }
}

/**
 * [copy 拷贝文件]
 * @param  {[type]} from  [源文件路径]
 * @param  {[type]} to    [目标文件路径]
 * @param  {[type]} chunk [修改字段]
 */
function copy(from, to, chunk) {
    var data = '';
    var readerStream = fs.createReadStream(from);
    readerStream.setEncoding('UTF8');
    // 处理流事件 --> data, end, and error
    readerStream.on('data', function(chunk) {
        data += chunk;
    });
    readerStream.on('end', function() {
        switch (chunk) { // 如果是grunt 需要相对压缩
            case 4:
                data = data.replace(/'all'/g, "'relative'");
                break;
        }
        var writerStream = fs.createWriteStream(to);
        writerStream.write(data, 'UTF8');
        writerStream.end();
        writerStream.on('finish', function() {
            console.log(`${color.SUCCESS}${path.basename(to)}配置文件写入成功`);
            process_exit(dir);
        });
        writerStream.on('error', function(err) {
            console.log(color.ERROR + err.stack);
        });
    });
    readerStream.on('error', function(err) {
        console.log(color.ERROR + err.stack);
    });
}

/**
 * [process_exit 退出进程]
 * @return {[type]} [description]
 */
function process_exit() {
    ncp.copy(dir.replace(/\\/g, '/')); // 复制当前路径
    open_dir(dir); // 打开已创建目录
    process.exit();
}

/**
 * [open_dir 打开新创建文件夹目录地址]
 * @param  {[String]} dirname [地址]
 */
function open_dir(dirname) {
    var cmd = '';
    if (process.platform === 'darwin') {
        cmd = 'open';
    } else if (process.platform === 'win32') {
        cmd = 'start';
    }
    childProcess.execSync(cmd + ' ' + dirname);
}

/**
 * [mkdirSync 创建文件目录]
 * @return {[type]} [description]
 */
function mkdirSync() {
    var cwd = process.cwd();
    var newDir = path.relative(cwd, dir);
    if (!fs.existsSync(newDir)) { // 检索当前目录是否有此文件夹
        var pathtmp;
        newDir.split(path.sep).forEach(function(dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            } else {
                pathtmp = path.join(cwd, dirname);
            }
            if (!fs.existsSync(pathtmp)) {
                fs.mkdirSync(pathtmp, '0777');
            }
        })
    }
    return true;
}

/**
 * [prompt 类似confirm]
 * @param  {[type]}   prompt   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function prompt(prompt, callback) {
    process.stdout.write(color.INP + prompt);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', function(chunk) {
        process.stdin.pause();
        callback(chunk.trim());
    });
}

/**
 * [addVersion 添加版本号]
 * @param {[type]} c [description]
 */
function addVersion(chunk) {
    chunk = chunk || '1.0.0';
    while (fs.existsSync(path.join(dir, chunk))) {
        chunk = (chunk.replace(/\./g, '') * 1 + 1).toString().replace(/\d{3}$/, function(str) {
            return str.split('').join('.');
        });
    }
    return chunk;
}

/**
 * [start 启动]
 */
function P(fnName) {
    return new Promise((resolve, reject) => {
        fnName(function(chunk) {
            resolve(chunk);
        })
    })
}

function start() {
    P(setPorject).then((chunk) => { // 创建项目文件夹
        return P(hasProject);
    }).then((chunk) => { // 设置项目版本号
        return P(setVersonDir);
    }).then((chunk) => { // 选择配置文件
        return P(setConfigFile);
    }).then((chunk) => {
        mkdirSync(); // 生成版本文件夹
        createConfig(chunk); // 提取配置文件
        return false;
    });
}
start();