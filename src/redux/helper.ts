

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
        if (state?.fetchingStatus?.[thunkName] !== undefined) {
            state.fetchingStatus[thunkName] = false;
        }
        if (state?.error?.[thunkName] !== undefined) {
            state.error[thunkName] = error.message;
        }
        arg.callback && arg.callback(error.message, null);
    }
}
