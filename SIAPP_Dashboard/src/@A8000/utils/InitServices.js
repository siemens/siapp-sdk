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

import {useDispatch, useSelector} from 'react-redux';
import {useEffect} from 'react';
import moment from 'moment';
import {resetStatus, setLogged} from '@A8000/store/A8000/statusSlice';
import {getMqttStates} from '@A8000/store/A8000/mqtt/mqttDataSlice';
import {initA8000} from '@config/configInit';
import configEnv from '@config/configEnv';
import i18next from 'i18next';
import Sidebar from '@A8000/components/layout/Sidebar';
import AlertMessage from '@A8000/components/layout/AlertMessage';
import {setUpdatePeriod} from '@A8000/store/A8000/statusSlice';

export const taskHandling = () => async (dispatch, getState) => {
	const auth = getState().auth;
	const status = getState().A8000.status;
	const nowTime = moment().unix();
	if (auth.isLogin) {
		if (nowTime % status.updateData === 0) {
			if (status.runUpdate) dispatch(getMqttStates());
		}
	} else {
		if (status.isLogged !== false) {
			dispatch(resetStatus());
		}
	}
	return;
};

export default function InitServices() {
	const dispatch = useDispatch();
	const auth = useSelector(({auth}) => auth);

	useEffect(() => {
		if (auth.lng !== '') i18next.changeLanguage(auth.lng);
		if (auth.isLogin) {
			dispatch(setLogged(true));
			dispatch(setUpdatePeriod({updateData: configEnv.updateData}));
			dispatch(initA8000());
		}
		const intervalSeconds = setInterval(() => {
			dispatch(taskHandling());
		}, 1000);
		return () => {
			clearInterval(intervalSeconds);
		};
	}, [auth.isLogin, auth.lng, dispatch]);

	return (
		<>
			<AlertMessage />
			<Sidebar />
		</>
	);
}
