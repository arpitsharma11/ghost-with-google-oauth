const Promise = require('bluebird');
const common = require('../../lib/common');
const models = require('../../models');
const auth = require('../../services/auth');
//var google = require('../../../../node_modules/googleapis');
const  {google}  =  require('googleapis');


//var plus = google.plus('v1');
//var OAuth = google.auth.OAuth2;

const session = {
    read(options) {
        /*
         * TODO
         * Don't query db for user, when new api http wrapper is in we can
         * have direct access to req.user, we can also get access to some session
         * inofrmation too and send it back
         */
        return models.User.findOne({id: options.context.user});
    },
    add(object) {
        //console.log(google);
          
        if (!object || !object.username) {
            return Promise.reject(new common.errors.UnauthorizedError({
                message: common.i18n.t('errors.middleware.auth.accessDenied')
            }));
        }

        if(object.type){
            console.log("-----------kk")
            return models.User.googleCheck({
                email: object.username
            }).then((user) => {
                return Promise.resolve((req, res, next) => {
                    req.brute.reset(function (err) {
                        if (err) {
                            return next(err);
                        }
                        req.user = user;
                        auth.session.createSession(req, res, next);
                    });
                });
            }).catch((err) => {
                throw new common.errors.UnauthorizedError({
                    message: common.i18n.t('errors.middleware.auth.accessDenied'),
                    err
                });
            });
        }else{
            return models.User.check({
                email: object.username,
                password: object.password
            }).then((user) => {
                return Promise.resolve((req, res, next) => {
                    req.brute.reset(function (err) {
                        if (err) {
                            return next(err);
                        }
                        req.user = user;
                        auth.session.createSession(req, res, next);
                    });
                });
            }).catch((err) => {
                throw new common.errors.UnauthorizedError({
                    message: common.i18n.t('errors.middleware.auth.accessDenied'),
                    err
                });
            });
        }
    },
    delete() {
        return Promise.resolve((req, res, next) => {
            auth.session.destroySession(req, res, next);
        });
    }
};

module.exports = session;
