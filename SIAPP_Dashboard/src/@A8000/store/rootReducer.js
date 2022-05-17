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

import {combineReducers} from '@reduxjs/toolkit';
import auth from './authSlice';
import A8000 from './A8000';

const rootReducer = (asyncReducers) => (state, action) => {
	let combinedReducer = combineReducers({
		auth,
		A8000,
		...asyncReducers,
	});

	/*
	Reset the redux store when user logged out
	 */
	if (action.type === 'auth/authLogout') {
		// state = undefined;
	}

	return combinedReducer(state, action);
};

export default rootReducer;
