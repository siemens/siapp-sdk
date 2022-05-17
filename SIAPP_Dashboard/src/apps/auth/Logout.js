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

import {useDispatch} from 'react-redux';
import {authLogout} from '@A8000/store/authSlice';
import {closeA8000} from '@config/configInit';

export default function Logout() {
	const dispatch = useDispatch();
	sessionStorage.removeItem('accessToken');
	sessionStorage.removeItem('roles');
	sessionStorage.removeItem('role');
	sessionStorage.removeItem('username');
	sessionStorage.removeItem('siappName');
	sessionStorage.removeItem('siappVersion');
	setTimeout(() => {
		dispatch(closeA8000());
		dispatch(authLogout());
	}, 100);
	return null;
}
