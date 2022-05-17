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

import {configMqttSimCmd} from '@config/constA8000';
import {createSlice} from '@reduxjs/toolkit';
import serviceA8000 from '@A8000/utils/serviceA8000';
import {constApiA8000} from '@config/constA8000';

export const initSimu = () => async (dispatch, getState) => {
	await dispatch(statusSimu());
	return;
};

export const closeSimu = () => async (dispatch, getState) => {
	await dispatch(resetSimu());
	return;
};

export const statusSimu = () => async (dispatch, getState) => {
	// const simu = getState().A8000.simu;

	const payload = {
		cmd: configMqttSimCmd.cmdMqttSimGetStatus,
	};
	const simData = await dispatch(serviceA8000.getA8000(constApiA8000.urlCmd, payload));
	return dispatch(setSimu(simData.data));
};

export const reloadSimu = () => async (dispatch, getState) => {
	const payload = {
		cmd: configMqttSimCmd.cmdMqttSimReload,
		attr: {
			repeat: true,
			pause: false,
			filePath: configMqttSimCmd.cmdMqttSimFilePath,
		},
	};
	await dispatch(serviceA8000.getA8000(constApiA8000.urlCmd, payload));
	return dispatch(resumeSimu());
};

export const pauseSimu = () => async (dispatch, getState) => {
	const payload = {
		cmd: configMqttSimCmd.cmdMqttSimPause,
	};
	await dispatch(serviceA8000.getA8000(constApiA8000.urlCmd, payload));

	return await dispatch(statusSimu());
};

export const resumeSimu = () => async (dispatch, getState) => {
	const payload = {
		cmd: configMqttSimCmd.cmdMqttSimResume,
	};
	await dispatch(serviceA8000.getA8000(constApiA8000.urlCmd, payload));

	return dispatch(statusSimu());
};

const initialState = {
	running: false,
	repeat: false,
	holdOnErr: false,
	errors: 0,
	testStep: 0,
	csvValid: false,
};

const simuSlice = createSlice({
	name: 'A8000/simu',
	initialState,
	reducers: {
		setSimu: (state, action) => action.payload,
		resetSimu: (state, action) => {
			return initialState;
		},
	},
});

export const {resetSimu, setSimu} = simuSlice.actions;

export default simuSlice.reducer;
