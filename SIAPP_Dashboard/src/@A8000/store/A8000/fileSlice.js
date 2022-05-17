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
import {toast} from 'react-toastify';
import {optionsToast} from '@A8000/components/layout/AlertMessage';
import {Trans} from 'react-i18next';

export const fileUpload = (folder, selectedFile) => async (dispatch, getState) => {
	// const formData = new FormData();
	// formData.append("File", selectedFile);
	const filenameUpload = folder + '/' + selectedFile.name;
	try {
		await dispatch(serviceA8000.importA8000(filenameUpload, selectedFile));
		toast.success(<Trans i18nKey='alert.successUpload'>"Upload successfully!"</Trans>, optionsToast);
		return dispatch(fileList());
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorUpload'>"Upload failed!"</Trans>, optionsToast);
		return;
	}
};

export const fileDownload = (folder, filename) => async (dispatch, getState) => {
	try {
		await dispatch(serviceA8000.exportA8000(folder, filename));
		toast.success(<Trans i18nKey='alert.successDownload'>"Download successfully!"</Trans>, optionsToast);
		return;
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorDownload'>"Download failed!"</Trans>, optionsToast);
		return;
	}
};

export const fileList = () => async (dispatch, getState) => {
	try {
		const data = await dispatch(serviceA8000.dirA8000('./'));
		return dispatch(setFileSystem(data.sort()));
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorReading'>"Reading failed!"</Trans>, optionsToast);
		return;
	}
};

export const fileMkDir = (folder) => async (dispatch, getState) => {
	try {
		await dispatch(serviceA8000.mkdirA8000(folder));
		toast.success(<Trans i18nKey='alert.successCreate'>"Create successfully!"</Trans>, optionsToast);
		return dispatch(fileList());
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorCreate'>"Create failed!"</Trans>, optionsToast);
		return;
	}
};

export const fileDelete = (id) => async (dispatch, getState) => {
	try {
		await dispatch(serviceA8000.delA8000(id));
		toast.success(<Trans i18nKey='alert.successDelete'>"Delete successfully!"</Trans>, optionsToast);
		return dispatch(fileList());
	} catch (error) {
		toast.error(<Trans i18nKey='alert.errorDelete'>"Delete failed!"</Trans>, optionsToast);
		return;
	}
};

const initialState = {
	state: null,
};

const fileSlice = createSlice({
	name: 'A8000/file',
	initialState,
	reducers: {
		setFileSystem: (state, action) => action.payload,
		initFileSystem: (state, action) => {
			return initialState;
		},
	},
});

export const {initFileSystem, setFileSystem} = fileSlice.actions;

export default fileSlice.reducer;
