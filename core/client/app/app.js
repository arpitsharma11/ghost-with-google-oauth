import 'ghost-admin/utils/link-component';
import 'ghost-admin/utils/route';
import 'ghost-admin/utils/text-field';
import Application from '@ember/application';
import Resolver from './resolver';
import config from './config/environment';
import loadInitializers from 'ember-load-initializers';
import {registerWarnHandler} from '@ember/debug';

const App = Application.extend({
    Resolver,
    modulePrefix: config.modulePrefix,
    podModulePrefix: config.podModulePrefix,

    // eslint-disable-next-line
    customEvents: {
        touchstart: null,
        touchmove: null,
        touchend: null,
        touchcancel: null
    }
});

// TODO: remove once the validations refactor is complete
// eslint-disable-next-line
registerWarnHandler((message, options, next) => {
    let skip = [
        'ds.errors.add',
        'ds.errors.remove',
        'ds.errors.clear'
    ];

    if (skip.includes(options.id)) {
        return;
    }

    next(message, options);
});

loadInitializers(App, config.modulePrefix);

export default App;