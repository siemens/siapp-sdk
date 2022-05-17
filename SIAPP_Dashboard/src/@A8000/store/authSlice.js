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

import {createSlice} from '@reduxjs/toolkit';
import moment from 'moment';
import configEnv from '@config/configEnv';

export const updateExpireTime = () => async (dispatch, getState) => {
	const expireTime = moment().add(configEnv.expireTimeout, 'm').valueOf();
	return dispatch(authExpireTime(expireTime));
};

export const checkExpireTime = () => async (dispatch, getState) => {
	const auth = getState().auth;
	const currentTime = moment().valueOf();
	if (auth.expireTime < currentTime && (auth.roles.length !== 1 || auth.roles[0] !== 'viewer')) {
		sessionStorage.setItem('roles', 'viewer');
		sessionStorage.setItem('role', 'viewer');
		return dispatch(authRoles({roles: ['viewer'], role: 'viewer'}));
	}
	return null;
};

export const setViewMode = () => async (dispatch, getState) => {
	const auth = getState().auth;
	if (auth.roles.length !== 1 || auth.roles[0] !== 'viewer') {
		sessionStorage.setItem('roles', 'viewer');
		sessionStorage.setItem('role', 'viewer');
		return dispatch(authRoles({roles: ['viewer'], role: 'viewer'}));
	}
	return null;
};

const accessToken = sessionStorage.getItem('accessToken');
let storedRoles = sessionStorage.getItem('roles');
const role = sessionStorage.getItem('role');
const username = sessionStorage.getItem('username');
const siappName = sessionStorage.getItem('siappName');
const siappVersion = sessionStorage.getItem('siappVersion');

let roles = ['guest'];
if (storedRoles !== undefined && storedRoles !== null) {
	roles = storedRoles.split(',');
}
const expireTime = moment().add(configEnv.expireTimeout, 'm').valueOf();
const initialState = {
	lng: 'en',
	isLogin: accessToken !== null ? true : false,
	accessToken: accessToken !== null ? accessToken : '',
	roles: roles !== null ? roles : ['guest'],
	role: role !== null ? role : 'guest',
	username: username !== null ? username : '',
	siappName: siappName !== null ? siappName : '',
	siappVersion: siappVersion !== null ? siappVersion : '',
	expireTime: accessToken !== null ? expireTime : 0,
	error: '',
	configSIAPP: {
		id: '',
		functions: ['SIAPP'],
		loginLink: '/siapp/dashboard',
	},
};

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		authLogin: (state, action) => {
			return {
				...state,
				isLogin: action.payload.isLogin,
				accessToken: action.payload.accessToken,
				roles: action.payload.roles,
				role: action.payload.role,
				username: action.payload.username,
				siappName: action.payload.siappName,
				siappVersion: action.payload.siappVersion,
				expireTime: action.payload.expireTime,
				error: '',
			};
		},
		authExpireTime: (state, action) => {
			return {
				...state,
				expireTime: action.payload,
			};
		},
		authRoles: (state, action) => {
			return {
				...state,
				roles: action.payload.roles,
				role: action.payload.role,
			};
		},
		authSIAPP: (state, action) => {
			return {
				...state,
				configSIAPP: action.payload,
			};
		},
		authError: (state, action) => {
			return {
				...state,
				isLogin: false,
				accessToken: '',
				roles: ['guest'],
				role: 'guest',
				username: '',
				siappName: '',
				siappVersion: '',
				expireTime: 0,
				error: action.payload,
			};
		},
		authLanguage: (state, action) => {
			return {
				...state,
				lng: action.payload,
			};
		},
		authLogout: (state, action) => {
			return {
				...initialState,
				lng: state.lng,
				isLogin: false,
				accessToken: '',
				expireTime: 0,
				roles: ['guest'],
				role: 'guest',
				username: '',
				siappName: '',
				siappVersion: '',
			};
		},
	},
});

export const {authLogin, authError, authExpireTime, authRoles, authSIAPP, authLogout, authLanguage} = authSlice.actions;

export default authSlice.reducer;
