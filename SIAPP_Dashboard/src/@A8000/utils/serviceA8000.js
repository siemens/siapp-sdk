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

import axios from 'axios';
import configEnv from '@config/configEnv';
import {constApiA8000} from '@config/constA8000';
import {toast} from 'react-toastify';
import {optionsToast} from '@A8000/components/layout/AlertMessage';
import {authLogin, authError} from '@A8000/store/authSlice';
import {authLogout} from '@A8000/store/authSlice';
import {Trans} from 'react-i18next';
import moment from 'moment';

class ServiceA8000 {
	// Authentication for A8000
	authA8000 =
		({username, password}) =>
		async (dispatch, getState) => {
			// const passwordSha512 = sha512(password);
			const usernameEncoded = encodeURI(username);
			const auth = 'Basic ' + window.btoa(usernameEncoded + ':' + password);
			const configPost = {
				method: 'POST',
				headers: {
					'Authorization': auth,
					'Content-Type': 'application/x-www-form-urlencoded', // original need
				},
				// timeout: 7000,
			};
			const payload = new FormData();
			payload.set('status', 'login');
			const toastId = toast.info(<Trans i18nKey='alert.infoProgress'>"Request in progress!"</Trans>, optionsToast);
			try {
				const response = await axios.post(configEnv.urlApi + constApiA8000.urlAuth, payload, configPost);
				const expireTime = moment().add(configEnv.expireTimeout, 'm').valueOf();
				let data = {
					isLogin: true,
					accessToken: response.data.access_token,
					expireTime: expireTime,
					roles: ['guest'],
					role: 'guest',
					siappName: '',
					siappVersion: '',
					username: username,
				};
				if (response.data.access_role !== undefined) {
					data.role = response.data.access_role.toLowerCase();
					data.roles = [response.data.access_role.toLowerCase()];
				}
				if (response.data.SIAPP_name !== undefined) data.siappName = response.data.SIAPP_name;
				if (response.data.SIAPP_version !== undefined) data.siappVersion = response.data.SIAPP_version;
				if (response.data.roles !== undefined && response.data.roles.length > 0) {
					data.roles = [];
					response.data.roles.forEach((role) => {
						data.roles.push(role.toLowerCase());
					});
				}

				toast.update(toastId, {
					render: <Trans i18nKey='alert.successAuthentication'>"Authentication successfully!"</Trans>,
					type: toast.TYPE.SUCCESS,
					autoClose: 500,
				});
				sessionStorage.setItem('accessToken', data.accessToken);
				sessionStorage.setItem('roles', data.roles);
				sessionStorage.setItem('role', data.role);
				sessionStorage.setItem('username', data.username);
				sessionStorage.setItem('siappName', data.siappName);
				sessionStorage.setItem('siappVersion', data.siappVersion);

				return dispatch(authLogin(data));
			} catch (error) {
				toast.update(toastId, {
					render: 'Authentication failed!',
					type: toast.TYPE.ERROR,
					autoClose: 500,
				});
				return dispatch(authError(error.message));
			}
		};

	errorA8000 = (error) => async (dispatch, getState) => {
		console.log(error);
		if (error.message.includes('503') || error.message.includes('504') || error.message.includes('511')) {
			dispatch(authLogout());
			toast.error(<Trans i18nKey='alert.errorAuthentication'>"Authentication failed!"</Trans>, optionsToast);
		}
	};

	getA8000 = (subUrl, payload) => async (dispatch, getState) => {
		const auth = getState().auth;

		const configPost = {
			method: 'POST',
			headers: {
				'siappMethod': 'get',
				'Content-Type': 'text/plain',
				'access_token': auth.accessToken,
				'versionAPI': '1.0',
			},
			// timeout: 7000,
		};

		try {
			const response = await axios.post(configEnv.urlApi + subUrl, payload, configPost);
			return response.data;
		} catch (error) {
			dispatch(this.errorA8000(error));
			throw error;
		}
	};

	setA8000 = (subUrl, payload) => async (dispatch, getState) => {
		const auth = getState().auth;

		const configPost = {
			method: 'POST',
			headers: {
				'siappMethod': 'set',
				'Content-Type': 'text/plain',
				'access_token': auth.accessToken,
				'versionAPI': '1.0',
			},
			// timeout: 7000,
		};

		try {
			const response = await axios.post(configEnv.urlApi + subUrl, payload, configPost);
			return response.data;
		} catch (error) {
			dispatch(this.errorA8000(error));
			throw error;
		}
	};

	readA8000 = (filename) => async (dispatch, getState) => {
		const auth = getState().auth;

		const configPost = {
			method: 'POST',
			headers: {
				'siappMethod': 'get',
				'Content-Type': 'text/plain',
				'access_token': auth.accessToken,
				'versionAPI': '1.0',
				'filename': filename,
			},
			// timeout: 7000,
		};
		const payload = {};

		try {
			const response = await axios.post(configEnv.urlApi + constApiA8000.urlFileRead, payload, configPost);
			return response.data;
		} catch (error) {
			dispatch(this.errorA8000(error));
			throw error;
		}
	};

	writeA8000 = (filename, payload) => async (dispatch, getState) => {
		const auth = getState().auth;

		const configPost = {
			method: 'POST',
			headers: {
				'siappMethod': 'set',
				'Content-Type': 'text/plain',
				'access_token': auth.accessToken,
				'versionAPI': '1.0',
				'filename': filename,
			},
			// timeout: 7000,
		};
		try {
			const response = await axios.post(configEnv.urlApi + constApiA8000.urlFileWrite, payload, configPost);
			return response.data;
		} catch (error) {
			dispatch(this.errorA8000(error));
			throw error;
		}
	};

	importA8000 = (filename, selectedFile) => async (dispatch, getState) => {
		const auth = getState().auth;

		const configPost = {
			method: 'POST',
			headers: {
				'siappMethod': 'set',
				'Content-Type': selectedFile.type,
				'access_token': auth.accessToken,
				'versionAPI': '1.0',
				'filename': filename,
			},
			// timeout: 7000,
		};

		try {
			const response = await axios.post(configEnv.urlApi + constApiA8000.urlFileImport, selectedFile, configPost);
			return response.data;
		} catch (error) {
			dispatch(this.errorA8000(error));
			throw error;
		}
	};

	exportA8000 = (folder, filename) => async (dispatch, getState) => {
		const auth = getState().auth;
		const configPost = {
			method: 'POST',
			headers: {
				'siappMethod': 'get',
				'Content-Type': 'text/plain',
				'access_token': auth.accessToken,
				'versionAPI': '1.0',
				'filename': folder + filename,
			},
			// timeout: 7000,
			responseType: 'blob', // important
		};
		const payload = {};

		try {
			const response = await axios.post(configEnv.urlApi + constApiA8000.urlFileExport, payload, configPost);
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			return true;
		} catch (error) {
			dispatch(this.errorA8000(error));
			throw error;
		}
	};

	dirA8000 = (folder) => async (dispatch, getState) => {
		const auth = getState().auth;

		const configPost = {
			method: 'POST',
			headers: {
				'siappMethod': 'get',
				'Content-Type': 'text/plain',
				'access_token': auth.accessToken,
				'versionAPI': '1.0',
				'filename': folder,
			},
			// timeout: 7000,
		};
		const payload = {};

		try {
			const response = await axios.post(configEnv.urlApi + constApiA8000.urlFileDir, payload, configPost);
			return response.data;
		} catch (error) {
			dispatch(this.errorA8000(error));
			throw error;
		}
	};

	mkdirA8000 = (folder) => async (dispatch, getState) => {
		const auth = getState().auth;

		if (folder !== undefined || folder !== '') {
			const configPost = {
				method: 'POST',
				headers: {
					'siappMethod': 'set',
					'Content-Type': 'text/plain',
					'access_token': auth.accessToken,
					'versionAPI': '1.0',
					'filename': folder,
				},
				// timeout: 7000,
			};
			const payload = {};

			try {
				const response = await axios.post(configEnv.urlApi + constApiA8000.urlFileMkDir, payload, configPost);
				return response.data;
			} catch (error) {
				dispatch(this.errorA8000(error));
				throw error;
			}
		}
	};

	delA8000 = (id) => async (dispatch, getState) => {
		const auth = getState().auth;

		if (id !== undefined || id !== '') {
			const configPost = {
				method: 'POST',
				headers: {
					'siappMethod': 'set',
					'Content-Type': 'text/plain',
					'access_token': auth.accessToken,
					'versionAPI': '1.0',
					'filename': id,
				},
				// timeout: 7000,
			};
			const payload = {};

			try {
				const response = await axios.post(configEnv.urlApi + constApiA8000.urlFileDel, payload, configPost);
				return response.data;
			} catch (error) {
				dispatch(this.errorA8000(error));
				throw error;
			}
		}
	};

	subscribeMqtt = (allTopics) => async (dispatch, getState) => {
		if (allTopics.length > 0) {
			const payload = allTopics;
			try {
				const response = await dispatch(this.getA8000(constApiA8000.urlMqttSub, payload));
				return response;
			} catch (error) {
				console.log(error);
				throw error;
			}
		}
	};
}

const instance = new ServiceA8000();

export default instance;
