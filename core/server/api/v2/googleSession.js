const Promise = require('bluebird');
const common = require('../../lib/common');
const models = require('../../models');
const auth = require('../../services/auth');
const https = require('https');
const session = require('./session');


const googleSession = {
    read() {
        /*
         * TODO
         * Don't query db for user, when new api http wrapper is in we can
         * have direct access to req.user, we can also get access to some session
         * inofrmation too and send it back
         */
    },
    add(object) {
    },
    delete() {
        return Promise.resolve((req, res, next) => {
            auth.session.destroySession(req, res, next);
        });
    }
};

module.exports = googleSession;
