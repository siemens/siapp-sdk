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

import React, {useMemo} from 'react';
import {useSelector} from 'react-redux';
import {Navigate, Outlet} from 'react-router-dom';

export const PublicRoute = () => {
	const auth = useSelector(({auth}) => auth);
	return useMemo(() => (auth.isLogin ? <Navigate to='/' /> : <Outlet />), [auth.isLogin]);
};
