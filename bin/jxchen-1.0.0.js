#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var writeStream;
var dir = process.cwd();

function prompt(prompt, callback) {
    process.stdout.write(prompt);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', function (chunk) {
        process.stdin.pause();
        callback(chunk.trim());
    });
}

// 创建项目目录
function mkdir() {
    prompt('项目名称(project name)', selProject);
}

// 创建版本目录
function mkVerson() {
    prompt('版本号(' + addVersion() + ') : ', createProjectVersion);
}


function selProject(c) {
    if (!/^[a-zA-Z0-9_]+$/.test(c)) {
        console.error('/**********项目名称只能为：数字、字母、下划线组合**********/');
        mkdir();
        return false;
    }

    if (fs.existsSync(path.join(dir, c))) {
        prompt('项目已存在，是否添加版本（y/n）', function (a) {
            switch (a) {
                case 'y':
                    dir = path.join(dir, c);
                    mkVerson(); // 创建版本目录
                    break;
                case 'n':
                default:
                    mkdir(); // 创建版本目录
                    break;
            }
        });
        return false;
    }

    dir = path.join(dir, c);
    mkVerson(); // 创建版本目录
}

function addVersion(c) {
    c = c || '1.0.0';
    while (fs.existsSync(path.join(dir, c))) {
        c = (c.replace(/\./g, '') * 1 + 1).toString().replace(/\d{3}$/, function (a) {
            return a.split('').join('.');
        });
    }
    return c;
}


function createProjectVersion(c) {
    if (!c || !/^\d+\.\d+\.\d+$/.test(c.trim())) {
        c = addVersion(c);
    }
    dir = path.join(dir, c);
    moveFiles(dir);
}

// 移动文件
function moveFiles(dir) {
    mkdirSync(dir);
    console.log(dir);
    console.log('/**********目录创建成功！**********/');
    createWebpackConfig(dir);
}

// 创建目录
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

function createWebpackConfig(c) {
    var cname = 'webpack.config.js';
    var rootdir = findRootDir(); // 猜测根目录 [node_module, package, webpack.config.js]三个文件同时存在的目录
    fs.writeFile(path.join(c, cname), settingConfig(rootdir), function (err, stdout, stdin) {
        if (err) {
            console.log('/**********写入' + cname + '出错**********/');
        } else {
            console.log(dir + path.sep + cname);
            console.log('/**********配置文件写入成功！**********/');
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

mkdir();

