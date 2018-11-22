import Torii from 'ember-simple-auth/authenticators/torii';
import Ember from 'ember';
import ENV from '../config/environment';
import RSVP from 'rsvp';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';

export default Torii.extend({
  torii: service('torii'),
    ajax: service(),
    ghostPaths: service(),

    sessionEndpoint: computed('ghostPaths.apiRoot', function () {
        return `${this.ghostPaths.apiRoot}/session`;
    }),
    

    authenticate(provider, options) {
        return this.get('torii').open(provider, options).then((authResponse) => {
            console.log(authResponse);
            let headers = {
                "Content-Type" : "application/x-www-form-urlencoded"
            }
            let request_body = {
                "code" : authResponse.authorizationCode,
                "client_id" : "67778125129-9g2v5joabr6jpbe1fovaprb124vplrnv.apps.googleusercontent.com",
                "client_secret" : "6Ps8mrcGWDw-CvC8NYGc76rp",
                "redirect_uri" : authResponse.redirectUri,
                "grant_type" : "authorization_code"
            }
            let request_data =  encodeURIComponent(JSON.stringify(request_body));
            let url = 'https://www.googleapis.com/oauth2/v4/token';
            //alert(lol(url,request_data,headers));
            let a = null;
            $.ajax (url, {
                async: false,
                type: 'POST',
                data: request_body,
                headers: headers
              }).done(function(resp){
                  console.log(resp,"adasd")
                  a = resp
                  // self.ajax.post(this.sessionEndpoint,options)
              })
              let email = null;
              url = 'https://www.googleapis.com/plus/v1/people/me?access_token='+a.access_token;
              $.ajax (url, {
                async: false,
                type: 'GET',
              }).done(function(resp){
                  console.log(resp)
                  email = resp.emails[0].value
                  // self.ajax.post(this.sessionEndpoint,options)
              })
              //console.log("wow",email)
              const data = {username: email,type:"google"};
              const options = {
                data,
                contentType: 'application/json;charset=utf-8',
                // ember-ajax will try and parse the response as JSON if not explicitly set
                dataType: 'text',
            };
            return this.ajax.post(this.sessionEndpoint,options);
        });
    },
    random(abc){
        console.log("yessssssss",abc);
    }
})