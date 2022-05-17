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
import serviceA8000 from '@A8000/utils/serviceA8000';
import {constApiA8000} from '@config/constA8000';
import {toast} from 'react-toastify';
import {optionsToast} from '@A8000/components/layout/AlertMessage';
import {initOcpp} from './ocppConfigSlice';
import {Trans} from 'react-i18next';
import {configOcppCmd} from '@config/constA8000';

export const reloadOcpp = () => async (dispatch, getState) => {
	const payload = {
		cmd: configOcppCmd.cmdSetOcppReload,
	};

	try {
		await dispatch(serviceA8000.setA8000(constApiA8000.urlCmd, payload));

		setTimeout(() => {
			dispatch(initOcpp());
		}, 1000);

		toast.success(<Trans i18nKey='alert.successReset'>"Reset successfully!"</Trans>, optionsToast);
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorReset'>"Reset failed!"</Trans>, optionsToast);
		return;
	}
};

export const statusOcpp = () => async (dispatch, getState) => {
	const payload = {
		cmd: configOcppCmd.cmdGetOcppStatus,
	};
	try {
		const status = await dispatch(serviceA8000.setA8000(constApiA8000.urlCmd, payload));
		return dispatch(setOcppStatus(status.data));
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorStatusOcpp'>"Error OCPP status!"</Trans>, optionsToast);
		return;
	}
};

const initialState = {
	ocppStatus: 'status not available',
};

const ocppStatusSlice = createSlice({
	name: 'A8000/status',
	initialState,
	reducers: {
		setOcppAll: (state, action) => action.payload,
		setOcppStatus: (state, action) => {
			return {
				...state,
				ocppStatus: action.payload,
			};
		},
		resetOcppStatus: (state, action) => {
			return initialState;
		},
	},
});

export const {resetOcppStatus, setOcppStatus, setOcppAll} = ocppStatusSlice.actions;

export default ocppStatusSlice.reducer;
