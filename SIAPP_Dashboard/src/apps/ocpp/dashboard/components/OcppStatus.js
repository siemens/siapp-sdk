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
import {memo, useEffect} from 'react';
import OcppReset from './OcppReset';
import {statusOcpp} from '../store/ocppStatusSlice';

function OcppStatus(props) {
	const dispatch = useDispatch();
	const status = useSelector(({ocpp}) => ocpp.statusOcpp);

	useEffect(() => {
		dispatch(statusOcpp());
		return () => {};
	}, [dispatch]);

	return (
		<>
			<div className='flex flex-col justify-center w-full m-1'>
				<h4 className='text-xl text-center'>{status.ocppStatus}</h4>
				<OcppReset mode='static' />
			</div>
		</>
	);
}

export default memo(OcppStatus);
