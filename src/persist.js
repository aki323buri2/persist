import { actions } from './actions';
import { get, zipObject } from 'lodash';
export const rootKey = 'goods-issue-weekly';
export const whitelist = [
    'params.syozok', 
];
export const loadReconcilers = {
    'params.syozok': a => a === undefined ? null : parseInt(a), 
};
export const saveReconcilers = {
};
export const makeKey = key => 
{
    return`${rootKey}/${key}`;
};
export const load = (key, backup) => 
{
    return localStorage.getItem(makeKey(key), backup);
};
export const save = (key, value) => 
{
    return localStorage.setItem(makeKey(key), value);
};
export const purge = key => 
{
    return localStorage.removeItem(key ? makeKey(key) : rootKey);
};
export const pickValues = state => 
{
    return zipObject(whitelist, whitelist.map(key => get(state, key)));
};
export const saveIfChanged = (before, after) => 
{
    for ([ key, value ] of Object.entries(after))
    {
        if (value !== get(before, key))
        {
            const reconciler = saveReconcilers[key] || (a => a);
            save(key, reconciler(value));
        }
    }
};
let bootstrap = false;
export const createPersistMiddleware = () => store => next => action => 
{
    if (bootstrap === false)
    {
        bootstrap = true;
        for (const key of whitelist)
        {
            const action = get(actions, key);
            const reconciler = loadReconcilers[key] || (a => a); 
            const value = reconciler(load(key));
            store.dispatch({ ...action(value), meta: 'rehydrade' });
        }
    }
    const before = pickValues(store.getState());
    next(action);
    if (action.meta === 'rehydrade') return;
    const after = pickValues(store.getState());
    saveIfChanged(before, after);
};