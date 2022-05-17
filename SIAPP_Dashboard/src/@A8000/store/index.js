/*
 * SIAPP DEMO SPA (Single Page Application)
 *
 * SPDX-License-Identifier: MIT
 * Copyright 2021 - 2022 Siemens AG
 *
 * Authors:
 *   Peter Stern <stern.peter@siemens.com>
 *
 */
import {configureStore} from '@reduxjs/toolkit';
import createReducer from './rootReducer';
import configEnv from '@config/configEnv';

if (process.env.NODE_ENV === 'development' && module.hot) {
	module.hot.accept('./rootReducer', () => {
		const newRootReducer = require('./rootReducer').default;
		store.replaceReducer(newRootReducer.createReducer());
	});
}

const middlewares = [];

if (process.env.NODE_ENV === 'development' && configEnv.reduxLogger === true) {
	const {createLogger} = require(`redux-logger`);
	const logger = createLogger({collapsed: (getState, action, logEntry) => !logEntry.error});

	middlewares.push(logger);
}

const store = configureStore({
	reducer: createReducer(),
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			immutableCheck: false,
			serializableCheck: false,
		}).concat(middlewares),
	devTools: process.env.NODE_ENV === 'development',
});

store.asyncReducers = {};

export const injectReducer = (key, reducer) => {
	if (store.asyncReducers[key]) {
		return false;
	}
	store.asyncReducers[key] = reducer;
	store.replaceReducer(createReducer(store.asyncReducers));
	return store;
};

export default store;
