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
import {cloneDeep} from 'lodash-es';
import configEnv from '@config/configEnv';

export const addChangeStatus = (newChange) => async (dispatch, getState) => {
	const status = getState().A8000.status;
	if (status.save.indexOf(newChange) === -1) {
		const newStatus = cloneDeep(status);
		newStatus.save.push(newChange);
		dispatch(setStatus(newStatus));
	}
	return;
};

export const removeChangeStatus = (removeChange) => async (dispatch, getState) => {
	const status = getState().A8000.status;
	const iChange = status.save.indexOf(removeChange);
	if (iChange !== -1) {
		const newStatus = cloneDeep(status);
		newStatus.save.splice(iChange, 1);
		dispatch(setStatus(newStatus));
	}
	return;
};

const initialState = {
	isLogged: false,
	isLoading: false,
	runUpdate: true,
	updateData: configEnv.updateData,
	updatedAt: 0,
	graphPeriod: 24,
	save: [],
};

const statusSlice = createSlice({
	name: 'A8000/status',
	initialState,
	reducers: {
		setStatus: (state, action) => action.payload,
		setLogged: (state, action) => {
			return {
				...state,
				isLogged: action.payload,
			};
		},
		setLoading: (state, action) => {
			return {
				...state,
				isLoading: action.payload,
			};
		},
		setUpdate: (state, action) => {
			return {
				...state,
				updatedAt: action.payload,
			};
		},
		setUpdatePeriod: (state, action) => {
			return {
				...state,
				updateData: action.payload.updateData,
			};
		},
		setRunUpdate: (state, action) => {
			return {
				...state,
				runUpdate: action.payload,
			};
		},
		setPeriod: (state, action) => {
			return {
				...state,
				graphPeriod: action.payload,
			};
		},
		resetStatus: (state, action) => {
			return initialState;
		},
	},
});

export const {resetStatus, setStatus, setLoading, setLogged, setUpdate, setUpdatePeriod, setRunUpdate, setPeriod} =
	statusSlice.actions;

export default statusSlice.reducer;
