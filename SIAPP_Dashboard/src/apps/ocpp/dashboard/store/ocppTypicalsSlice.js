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

import _ from '@lodash';
import {createSlice} from '@reduxjs/toolkit';
import serviceA8000 from '@A8000/utils/serviceA8000';
import {constApiA8000} from '@config/constA8000';
import {configOcppCmd} from '@config/constA8000';

export const getOcppAllTypes = () => async (dispatch, getState) => {
	const {file} = getState().A8000;

	//generalOcpp
	if (file.length > 0) {
		file.forEach((fileName) => {
			if (fileName.includes(configOcppCmd.folderGeneralOCPP)) {
				dispatch(getOcppTypeFile(fileName, 'generalOCPP'));
			}
		});
	}

	//stationsOCPP
	if (file.length > 0) {
		file.forEach((fileName) => {
			if (fileName.includes(configOcppCmd.folderStationsOCPP)) {
				dispatch(getOcppTypeFile(fileName, 'stationsOCPP'));
			}
		});
	}

	return;
};

export const getOcppTypeFile = (fileName, category) => async (dispatch, getState) => {
	try {
		const obj = await dispatch(serviceA8000.readA8000(fileName));
		await dispatch(setOcppType({category: category, typeId: obj.meta.typeId, data: obj}));
	} catch (error) {
		console.log(error);
	}
	return;
};

export const getOcppType = (typeId, category) => async (dispatch, getState) => {
	const payload = {
		cmd: configOcppCmd.cmdGetOcppType,
		attr: {typeId: typeId},
	};

	try {
		const obj = await dispatch(serviceA8000.getA8000(constApiA8000.urlCmd, payload));
		const metaTypeId = _.find(obj.data, {key: 'meta'});
		if (metaTypeId !== undefined) {
			await dispatch(setOcppType({category: category, typeId: metaTypeId.defaultValue.typeId, data: obj.data}));
		}
	} catch (error) {
		// console.log(error);
	}
	return;
};

const initialState = {
	generalOCPP: [],
	stationsOCPP: [],
};

const ocppTypicalsSlice = createSlice({
	name: 'ocpp/typicalsOcpp',
	initialState,
	reducers: {
		setOcppType: (state, action) => {
			return {
				...state,
				[action.payload.category]: {
					...state[action.payload.category],
					[action.payload.typeId]: action.payload.data,
				},
			};
		},
		initOcppTypicals: (state, action) => {
			return initialState;
		},
	},
});

export const {initOcppTypicals, setOcppType} = ocppTypicalsSlice.actions;

export default ocppTypicalsSlice.reducer;
