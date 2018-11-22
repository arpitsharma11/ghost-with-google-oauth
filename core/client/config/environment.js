/* eslint-env node */
'use strict';

module.exports = function (environment) {
    let ENV = {
        modulePrefix: 'ghost-admin',
        environment,
        rootURL: '/',
        locationType: 'trailing-hash',
        EmberENV: {
            FEATURES: {
                // Here you can enable experimental features on an ember canary build
                // e.g. 'with-controller': true
            },
            // @TODO verify that String/Function need to be enabled
            EXTEND_PROTOTYPES: {
                Date: false,
                Array: true,
                String: true,
                Function: true
            }
        },

        APP: {
            // Here you can pass flags/options to your application instance
            // when it is created

            // override the default version string which contains git info from
            // https://github.com/cibernox/git-repo-version. Only include the
            // `major.minor` version numbers
            version: require('../package.json').version.match(/^(\d+\.)?(\d+)/)[0]
        },

        'ember-simple-auth': { },

        moment: {
            includeTimezone: 'all'
        },

        torii: {
            sessionServiceName: 'session',
            providers: {
              'google-oauth2': {
                apiKey: '67778125129-9g2v5joabr6jpbe1fovaprb124vplrnv.apps.googleusercontent.com',
                redirectUri: 'http://localhost:2368/ghost/torii/redirect.html',
                scope: 'https://www.googleapis.com/auth/userinfo.email'
              }
            }
        }
    };

    if (environment === 'development') {
        // ENV.APP.LOG_RESOLVER = true;
        ENV.APP.LOG_ACTIVE_GENERATION = true;
        ENV.APP.LOG_TRANSITIONS = true;
        ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
        ENV.APP.LOG_VIEW_LOOKUPS = true;

        // This is needed so that browserify dependencies in tests work correctly
        // See https://github.com/ef4/ember-browserify/issues/14
        ENV.browserify = {
            tests: true
        };

        // Enable mirage here in order to mock API endpoints during development
        ENV['ember-cli-mirage'] = {
            enabled: false
        };
    }

    if (environment === 'test') {
        // Testem prefers this...
        ENV.locationType = 'none';

        // keep test console output quieter
        ENV.APP.LOG_ACTIVE_GENERATION = false;
        ENV.APP.LOG_VIEW_LOOKUPS = false;

        ENV.APP.rootElement = '#ember-testing';

        // This is needed so that browserify dependencies in tests work correctly
        // See https://github.com/ef4/ember-browserify/issues/14
        ENV.browserify = {
            tests: true
        };

        // Withuot manually setting this, pretender won't track requests
        ENV['ember-cli-mirage'] = {
            trackRequests: true
        };
    }

    return ENV;
};
