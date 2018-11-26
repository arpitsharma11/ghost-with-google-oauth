import Controller from '@ember/controller';
import RSVP from 'rsvp';
import {
    VersionMismatchError,
    isVersionMismatchError
} from 'ghost-admin/services/ajax';
import {
    alias
} from '@ember/object/computed';
import {
    computed
} from '@ember/object';
import {
    isArray as isEmberArray
} from '@ember/array';
import {
    inject as service
} from '@ember/service';
import {
    task
} from 'ember-concurrency';
import Torii from 'ember-simple-auth/authenticators/torii';

export default Controller.extend({
    ajax: service(),
    torii: service('torii'),
    config: service(),
    ghostPaths: service(),
    notifications: service(),
    session: service(),
    settings: service(),
    ghostPaths: service(),

    flowErrors: '',
    profileImage: null,

    sessionEndpoint: computed('ghostPaths.apiRoot', function () {
        return `${this.ghostPaths.apiRoot}/session`;
    }),

    signupDetails: alias('model'),
    //
    actions: {
        validate(property) {
            return this.signupDetails.validate({
                property
            });
        },

        setImage(image) {
            this.set('profileImage', image);
        },

        googleSignup(a) {
            this.get('fetchInfoGoogle').perform();
        }
    },

    fetchInfoGoogle: task(function* () {
        return this.get('torii').open('google-oauth2').then((authResponse) => {
            let headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            }
            let request_body = {
                "code": authResponse.authorizationCode,
                "client_id": "67778125129-9g2v5joabr6jpbe1fovaprb124vplrnv.apps.googleusercontent.com",
                "client_secret": "6Ps8mrcGWDw-CvC8NYGc76rp",
                "redirect_uri": authResponse.redirectUri,
                "grant_type": "authorization_code"
            }
            let url = 'https://www.googleapis.com/oauth2/v4/token';
            let a = null;
            $.ajax(url, {
                async: false,
                type: 'POST',
                data: request_body,
                headers: headers
            }).done(function (resp) {
                //console.log(resp,"adasd")
                a = resp
            })
            let email = null;
            let name = null;
            url = 'https://www.googleapis.com/plus/v1/people/me?access_token=' + a.access_token;
            $.ajax(url, {
                async: false,
                type: 'GET',
            }).done(function (resp) {
                //console.log(resp)
                email = resp.emails[0].value;
                name = resp.displayName;
                if (name == "") {
                    name = email
                }
            })
            let signupDetails = this.get('signupDetails');
            let token = signupDetails.get('token');
            if (email == signupDetails.get('email')) {
                this.set('flowErrors', '');
                //console.log("ok");
                this._completeGoogleInvitation(name, email, token);
                this._singInWithEmail(email);

            } else {
                alert("Email not same as invited")
            }
            /**/
        })
    }).drop(),

    _singInWithEmail(email) {
        console.log("sing in");
        return this.get('session').authenticate('authenticator:cookie2', email);
    },

    _completeGoogleInvitation(name, email, token) {
        console.log("sing up")
        let authUrl = this.get('ghostPaths.url').api('authentication', 'invitation');
        console.log({
            name: name,
            email: email,
            password: makePassword(),
            token: token
        })
        return $.ajax(authUrl, {
            async: false,
            type: 'POST',
            data: {
                invitation: [{
                    name: name,
                    email: email,
                    password: makePassword(),
                    token: token
                }]
            },
            dataType: 'json'
        })
    },

    authenticate: task(function* (authStrategy, authentication) {
        try {
            let authResult = yield this.get('session')
                .authenticate(authStrategy, ...authentication);
            let promises = [];

            promises.pushObject(this.get('settings').fetch());
            promises.pushObject(this.get('config').fetchPrivate());

            // fetch settings and private config for synchronous access
            yield RSVP.all(promises);

            return authResult;
        } catch (error) {
            if (error && error.payload && error.payload.errors) {
                // we don't get back an ember-data/ember-ajax error object
                // back so we need to pass in a null status in order to
                // test against the payload
                if (isVersionMismatchError(null, error)) {
                    let versionMismatchError = new VersionMismatchError(error);
                    return this.get('notifications').showAPIError(versionMismatchError);
                }

                error.payload.errors.forEach((err) => {
                    err.message = err.message.htmlSafe();
                });

                this.set('flowErrors', error.payload.errors[0].message.string);

                if (error.payload.errors[0].message.string.match(/user with that email/)) {
                    this.get('signupDetails.errors').add('email', '');
                }

                if (error.payload.errors[0].message.string.match(/password is incorrect/)) {
                    this.get('signupDetails.errors').add('password', '');
                }
            } else {
                // Connection errors don't return proper status message, only req.body
                this.get('notifications').showAlert('There was a problem on the server.', {
                    type: 'error',
                    key: 'session.authenticate.failed'
                });
                throw error;
            }
        }
    }).drop(),

    signup: task(function* () {
        let setupProperties = ['name', 'email', 'password', 'token'];

        let notifications = this.get('notifications');

        //console.log(setupProperties,notifications);

        this.set('flowErrors', '');
        this.get('signupDetails.hasValidated').addObjects(setupProperties);

        try {
            yield this.signupDetails.validate();
            yield this._completeInvitation();

            try {
                yield this._authenticateWithPassword();
                yield this.get('_sendImage').perform();
            } catch (error) {
                notifications.showAPIError(error, {
                    key: 'signup.complete'
                });
            }
        } catch (error) {
            // ValidationEngine throws undefined
            if (!error) {
                this.set('flowErrors', 'Please fill out the form to complete your sign-up');
                return false;
            }

            if (error && error.payload && error.payload.errors && isEmberArray(error.payload.errors)) {
                if (isVersionMismatchError(error)) {
                    notifications.showAPIError(error);
                }
                this.set('flowErrors', error.payload.errors[0].message);
            } else {
                notifications.showAPIError(error, {
                    key: 'signup.complete'
                });
            }
        }
    }).drop(),

    _completeInvitation() {
        let authUrl = this.get('ghostPaths.url').api('authentication', 'invitation');
        let signupDetails = this.get('signupDetails');

        return this.get('ajax').post(authUrl, {
            dataType: 'json',
            data: {
                invitation: [{
                    name: signupDetails.get('name'),
                    email: signupDetails.get('email'),
                    password: signupDetails.get('password'),
                    token: signupDetails.get('token')
                }]
            }
        });
    },

    _authenticateWithPassword() {
        let email = this.get('signupDetails.email');
        let password = this.get('signupDetails.password');

        return this.get('session')
            .authenticate('authenticator:cookie', email, password);
    },

    _sendImage: task(function* () {
        let formData = new FormData();
        let imageFile = this.get('profileImage');
        let uploadUrl = this.get('ghostPaths.url').api('uploads');

        if (imageFile) {
            formData.append('uploadimage', imageFile, imageFile.name);

            let user = yield this.get('session.user');
            let response = yield this.get('ajax').post(uploadUrl, {
                data: formData,
                processData: false,
                contentType: false,
                dataType: 'text'
            });

            let imageUrl = JSON.parse(response);
            let usersUrl = this.get('ghostPaths.url').api('users', user.id.toString());

            user.profile_image = imageUrl;

            return yield this.get('ajax').put(usersUrl, {
                data: {
                    users: [user]
                }
            });
        }
    })
});

function makePassword() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 10; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
