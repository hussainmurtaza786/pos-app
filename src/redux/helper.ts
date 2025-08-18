

export function handlePending(thunkName: string) {
    return (state: any, { meta: { arg } }: any) => {
        if (typeof state?.fetchingStatus?.[thunkName] === 'boolean') {
            state.fetchingStatus[thunkName] = true;
        }
        state.error[thunkName] = null;
    }
};

export function handleReject(thunkName: string) {
    return (state: any, { error, meta: { arg } }: any) => {
        console.log(`${thunkName}_Error`, error.message);
        if (state?.fetchingStatus?.[thunkName]) {
            state.fetchingStatus[thunkName] = false;
        }
        if (state?.error?.[thunkName]) {
            state.error[thunkName] = error.message;
        }
        arg.callback && arg.callback(error.message, null);
    }
}
