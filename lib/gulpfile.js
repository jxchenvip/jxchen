module.exports = function (grunt) {
    require('time-grunt')(grunt); // exe time

    var path = require('path');
    var fs = require('fs');
    // 重新设置 grunt 的项目路径，获取当前的 package.json 文件信息
    grunt.file.setBase(__dirname);

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
            if (dir['node_modules'] && dir['gruntfile.js'] && dir['package.json']) {
                flag = false;
            } else {
                d = path.join(d, '../');
            }
        }
        return d;
    }

    // 获取当前目录相对于共享 node_modules 目录的路径(以windows下面为例)
    var root = path.join(findRootDir());
    var nodepath = path.relative(__dirname, root + 'node_modules');

    var transport = require('grunt-cmd-transport');
    var style = transport.style.init(grunt);
    var text = transport.text.init(grunt);
    var script = transport.script.init(grunt);
    var pkg = grunt.file.readJSON(root + 'package.json');

    // 重新设置路径
    pkg.spm.dist = path.join(root.replace('tags', 'branches'), 'src' + path.sep).replace(/\\/g, '/');
    pkg.spm.src = path.join(root, 'src' + path.sep).replace(/\\/g, '/');

    var __newDirName = path.relative(pkg.spm.src, __dirname).replace(/\\/g, '/') + '/';

    var configMod = {
        pkg: pkg,
        transport: {
            options: {
                paths: [pkg.spm.dist],
                alias: pkg.spm.alias,
                parsers: {
                    '.js': [script.jsParser],
                    '.css': [style.css2jsParser],
                    '.html': [text.html2jsParser]
                },
                idleading: __newDirName
            },
            app: {
                files: [{
                    expand: true,
                    cwd: pkg.spm.src + __newDirName,
                    src: [
                        './**/*',
                        '!./gruntfile.js',
                        '!./**/*-debug.js',
                        '!./**/*-debug.css.js',
                        '!./**/*-debug.html.js',
                        '!./**/*.css.js',
                        '!./**/*.css.js',
                        '!./**/_*.js'
                    ],
                    extDot: 'last',
                    filter: 'isFile',
                    dest: pkg.spm.dist + '/.build/' + __newDirName
                }]
            }
        },
        concat: {
            options: {
                paths: [pkg.spm.dist],
                // 如果压缩插件include:relative,压缩项目为include: all
                include: 'all'
            },
            app: {
                files: [{
                    expand: true,
                    cwd: pkg.spm.dist + '/.build/' + __newDirName,
                    src: [
                        './**/*.js',
                        '!./gruntfile.js',
                        '!./**/*-debug.js',
                        '!./**/*-debug.css.js',
                        '!./**/*-debug.html.js',
                        '!./**/*.css.js',
                        '!./**/*.html.js',
                        '!./**/_*.js'
                    ],
                    extDot: 'last',
                    dest: pkg.spm.dist + __newDirName,
                    ext: '.js'
                }]
            }
        },
        uglify: {
            options: {
                preserveComments: 'some', //不删除注释，还可以为 false（删除全部注释），some（保留@preserve @license @cc_on等注释）
            },
            app: {
                files: [{
                    expand: true,
                    cwd: pkg.spm.dist + __newDirName,
                    src: [
                        './**/*.js'
                    ],
                    dest: pkg.spm.dist + __newDirName,
                    ext: '.js'
                }]
            }
        }
    };
    // console.log(configMod.transport.app.files[0].cwd)
    // 项目配置
    grunt.initConfig(configMod);

    grunt.task.loadTasks(path.join(nodepath, "grunt-cmd-transport", 'tasks'));
    grunt.task.loadTasks(path.join(nodepath, "grunt-cmd-concat", 'tasks'));
    grunt.task.loadTasks(path.join(nodepath, "grunt-contrib-uglify", 'tasks'));

    grunt.registerTask('build-app', ['transport:app', 'concat:app', 'uglify:app']);
    // 默认任务 ！一般情况下不要打开
    grunt.registerTask('default', ['transport', 'concat', 'uglify']);
}
