var VERIFY = '../../bin/verify';
var PROBLEMS = require(VERIFY).PROBLEMS;
var path = require('path');
var fs = require('fs');
var test = require('tap-prettify').test;
var child_process = require('child_process');
var fork = child_process.fork;
var spawn = child_process.spawn;

var ROOT_DIR = path.normalize(path.join(__dirname, '..', '..'));
var APP_VULNERABLE = path.join(ROOT_DIR, 'app-vulnerable.js');
var APP_PATCHED = path.join(ROOT_DIR, 'app-patched.js');

var newEnv = JSON.parse(JSON.stringify(process.env));

newEnv.TEST_PROBLEM_ONLY = '';

Object.keys(PROBLEMS).forEach(function(name) {
  test("problem " + name + " fails w/ app-vulnerable", function(t) {
    newEnv.APP_MODULE = 'app-vulnerable';

    var child = fork(VERIFY, [name], {env: newEnv});
    child.on('exit', function(code) {
      t.ok(code != 0, "exit code should be nonzero");
      t.end();
    });
  });

  test("problem " + name + " works w/ solution", function(t) {
    var code = fs.readFileSync(APP_VULNERABLE);
    var patchFile = path.join(__dirname, name + '.diff');

    if (!fs.existsSync(patchFile)) {
      t.skip();
      return t.end();
    }

    fs.writeFileSync(APP_PATCHED, code);

    var patch = spawn('patch', ['-s', '-f', '--no-backup-if-mismatch',
                                APP_PATCHED, patchFile]);
    patch.stdout.on('data', process.stderr.write.bind(process.stderr));
    patch.stderr.on('data', process.stderr.write.bind(process.stderr));
    patch.on('exit', function(code) {
      t.equal(code, 0, "patch exits with code 0");

      newEnv.APP_MODULE = 'app-patched';

      var child = fork(VERIFY, [name], {env: newEnv});
      child.on('exit', function(code) {
        t.equal(code, 0, "exit code should be zero");
        fs.unlinkSync(APP_PATCHED);
        t.end();
      });
    });
  });
});
