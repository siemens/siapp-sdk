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

import {memo, useCallback, useEffect, useState} from 'react';
import {statusSimu} from '@A8000/store/A8000/simuSlice';
import {useDispatch, useSelector} from 'react-redux';
import {Trans} from 'react-i18next';
import WidgetFooter from '../layout/WidgetFooter';
import moment from 'moment';

function SimuStatus(props) {
	const dispatch = useDispatch();
	const status = useSelector(({A8000}) => A8000.status);
	const [updatedAt, setUpdatedAt] = useState(0);
	const [refresh, setRefresh] = useState(true);

	const getStatus = useCallback(async () => {
		const toTime = moment().valueOf();
		if (toTime - updatedAt >= status.updateData * 1000 || refresh) {
			dispatch(statusSimu());
			setRefresh(false);
			setUpdatedAt(toTime);
		}
	}, [updatedAt, status, refresh, dispatch]);

	useEffect(() => {
		getStatus().then();
		return () => {};
	}, [dispatch, getStatus]);

	const handleRefresh = useCallback(() => {
		setRefresh(true);
	}, []);

	if (!props.data) {
		return null;
	}
	return (
		<>
			<div className='overflow-x-auto'>
				<table className='items-center w-full bg-transparent border-collapse'>
					<thead>
						<tr>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.status'>STATUS </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.value'>VALUE </Trans>
							</th>
						</tr>
					</thead>
					<tbody>
						{Object.keys(props.data).map((item) => (
							<tr key={item}>
								<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-4 text-left'>
									{item}
								</th>
								<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-4 text-left'>
									{props.data[item].toString()}
								</th>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className='flex flex-wrap justify-end w-full px-8'>
				<WidgetFooter updatedAt={updatedAt} onRefresh={handleRefresh} />
			</div>
		</>
	);
}

export default memo(SimuStatus);
