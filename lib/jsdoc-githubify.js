'use strict';

var stream = require('stream');
var util = require('util');
var adaptHtml = require('./adapt-html');

var Transform = stream.Transform || require('readable-stream').Transform;

/**
 * Transforms the piped jsdoc generated html to make it usable on github, i.e. in a Readme or wiki
 * The resulting html has the following transformations:
 *  - all code sample links are redirected point to gihub repo blob
 *  - wrap in div.jsdoc-githubify for styling
 *
 *  #### Note:
 *    The github blob url is derived from the remote of the github repository in the current directory
 *    and the currently checked out branch is used. You can override these with the following environment vars:
 *
 *    - JSDOC_GITHUBIFY_REMOTE
 *    - JSDOC_GITHUBIFY_BRANCH
 *
 * @name gitifyTransform
 * @function
 * @param {String} file filename ignored by this transform
 * @return {TransformStream} into which to pipe the html string generated by jsdoc
 */
module.exports = function gitifyTransform(file /* not used */) {
    return new GitifyTransform();
}

util.inherits(GitifyTransform, Transform);

function GitifyTransform (opts) {
    if (!(this instanceof GitifyTransform)) return new GitifyTransform(opts);

    opts = opts || {};

    Transform.call(this, opts);
    this.original = '';
}

GitifyTransform.prototype._transform = function (chunk, encoding, cb) {
    this.original += encoding === 'utf8' ? chunk : chunk.toString();
    cb();
};

GitifyTransform.prototype._flush = function (cb) {
    var self = this;

    // if the document contains no API doc we filter it by transforming to empty string
    if (!adaptHtml.hasApi(self.original)) return cb();

    adaptHtml(self.original, function (err, html) {
        if (err) return cb(err);
        var lines = html.split('\n');

        // trim lines and remove empties
        var trimmedhtml = lines
            .map(function (x) { return x.trim() })
            .filter(function (x) { return x.length })
            .join('\n');

        self.push(trimmedhtml);
        cb();
    });
};
