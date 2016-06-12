#!/usr/bin/env nodejs

var fs = require('fs');
var path = require('path');
var dir = process.cwd();
var dir_lib = path.join(__dirname, '../lib');
var utils = path.join(__dirname, '../lib/utils');
var color = require(path.join(utils, 'color'));
var pkg = require(path.join('../', 'package.json'));
var childProcess = require('child_process');


/**
 * 版本号
 */
if (process.argv[2] == '-V' || process.argv[2] == '-v') {
    console.log(pkg.version);
    process.exit();
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
 * 退出进程
 */
function process_exit(d) {
    var cmd = '';
    if (process.platform === 'darwin') {
        cmd = 'open';
    } else if (process.platform === 'win32') {
        cmd = 'start';
    }
    childProcess.execSync(cmd + ' ' + d);
    process.exit();
}

/**
 * 创建项目目录
 */
function mkProjectDir() {
    prompt('项目名称(project name) : ', selProject);
}

/**
 * 创建版本目录
 */
function mkVersonDir() {
    prompt('版本号(' + addVersion() + ') : ', createProjectVersion);
}

/**
 * 是否创建配制文件
 */
function mkConfigFile() {
    prompt('配制文件(NO) \n' + color.TIP + '1: webpack 2: gulp 3: grunt-all 4: grunt-relative : ', createConfig);
}

/**
 * 填写项目名称
 */
function selProject(c) {
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
 * 创建版本号
 */
function createProjectVersion(c) {
    if (!c || !/^\d+\.\d+\.\d+$/.test(c.trim())) {
        c = addVersion(c);
    }
    dir = path.join(dir, c);
    moveFiles(dir);
}

/**
 * 创建项目文件，及配置文件
 */
function moveFiles(dir) {
    mkdirSync(dir);
    console.log(color.TIP + '版本目录已创建完成!');
    console.log(color.TIP + dir);
    mkConfigFile(dir);
    // createWebpackConfig(dir);
}

/**
 * 选择项目所需要的配置文件也可以为空
 */
function createConfig(c) {
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
            process_exit(dir);
            break;
    }
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
            process_exit(dir);
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
 * 创建项目目录
 */
function mkdirSync(dir) {
    if (!fs.existsSync(dir)) {
        var pathtmp;
        dir.split(path.sep).forEach(function (dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            } else {
                pathtmp = dirname;
            }
            if (!fs.existsSync(pathtmp)) fs.mkdirSync(pathtmp);
        })
    }
    return true;
}

/**
 * 猜测根目录
 */
function findRootDir() {
    var d = path.join(__dirname);
    var flag = true;
    while (flag) {
        var dir = fs.readdirSync(d).reduce(function (o, key) {
            o[key] = path.join(d, key);
            return o;
        }, {});
        if (dir['node_modules'] && dir['webpack.config.js'] && dir['package.json']) {
            flag = false;
        } else {
            d = path.join(d, '../');
        }
    }
    return d;
}

/**
 * 创建配置文件
 */
function createWebpackConfig(c) {
    var cname = 'webpack.config.js';
    var rootdir = findRootDir(); // 猜测根目录 [node_module, package, webpack.config.js]三个文件同时存在的目录
    fs.writeFile(path.join(c, cname), settingConfig(rootdir), function (err, stdout, stdin) {
        if (err) {
            console.log(color.ERROR + '写入' + cname + '出错');
        } else {
            console.log(color.SUCCESS + '配置文件写入成功！');
            console.log(path.join(dir, cname));
            process.exit();
        }
    })
}

/**
 * 配置文件里面
 */
function settingConfig(rootdir) {
    var s = '';
    s += 'var conf = require("' + rootdir.replace(/\\/g, '/') + 'webpack.config.js");\n';
    s += 'module.exports = conf(__dirname, "' + rootdir.replace(/\\/g, '/') + '");\n';
    return s;
}

// console.log('***      module.filename = ' + module.filename + ' ***');
// console.log('***           __filename = ' + __filename + ' ***');
// console.log('***            __dirname = ' + __dirname + ' ***');
// console.log('***        process.cwd() = ' + process.cwd() + ' ***');
// console.log('*** require.main.filename= ' + require.main.filename + ' ***');
mkProjectDir();
