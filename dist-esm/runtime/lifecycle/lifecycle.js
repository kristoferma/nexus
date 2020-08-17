import { rootLogger } from '../../lib/nexus-logger';
const log = rootLogger.child('lifecycle');
export function createLazyState() {
    return {
        callbacks: {
            start: [],
        },
    };
}
/**
 * Create an instance of Lifecycle
 */
export function create(state) {
    state.components.lifecycle = createLazyState();
    const api = {};
    api.start = function (callback) {
        log.debug('registered callback', { event: 'start' });
        state.components.lifecycle.callbacks.start.push(callback);
    };
    return {
        public: api,
        private: {
            reset() {
                state.components.lifecycle.callbacks.start.length = 0;
            },
            trigger: {
                start(data) {
                    for (const callback of state.components.lifecycle.callbacks.start) {
                        log.debug('will run callback', { event: 'start' });
                        try {
                            callback(data);
                        }
                        catch (error) {
                            const wrappedError = new Error(`Lifecycle callback error on event "start":\n\n${error.message}`);
                            wrappedError.stack = error.stack;
                            throw wrappedError;
                        }
                        log.debug('did run callback', { event: 'start' });
                    }
                },
            },
        },
    };
}
//# sourceMappingURL=lifecycle.js.map