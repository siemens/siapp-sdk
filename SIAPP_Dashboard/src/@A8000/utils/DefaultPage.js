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

import {memo, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {useNavigate} from 'react-router-dom';

function DefaultPage() {
	const navigate = useNavigate();
	const auth = useSelector(({auth}) => auth);

	useEffect(() => {
		navigate(auth.configSIAPP.loginLink);
	});
	return null;
}

export default memo(DefaultPage);
