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
import {useDispatch, useSelector} from 'react-redux';
import Button from '@material-tailwind/react/Button';
import {InputLabel, Tooltip} from '@mui/material';
import {
	Refresh as IconRefresh,
	PlayCircleOutline as IconPlayCircleOutline,
	PauseCircleOutline as IconPauseCircleOutline,
} from '@mui/icons-material';
import {reloadSimu, pauseSimu, resumeSimu, statusSimu} from '@A8000/store/A8000/simuSlice';
import {Trans} from 'react-i18next';
import WidgetFooter from '../layout/WidgetFooter';
import moment from 'moment';

function SimuPanel(props) {
	const dispatch = useDispatch();
	const simuData = useSelector(({A8000}) => A8000.simu);
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

	const handleReload = useCallback(() => {
		dispatch(reloadSimu());
	}, [dispatch]);

	const handleRun = useCallback(() => {
		if (simuData.running) {
			dispatch(pauseSimu());
		} else {
			dispatch(reloadSimu());
			dispatch(resumeSimu());
		}
	}, [dispatch, simuData.running]);

	if (simuData === null) {
		return null;
	}
	return (
		<>
			<div className='flex justify-around m-1'>
				<Tooltip title={<Trans i18nKey='uppercase.reload'>RELOAD</Trans>}>
					<Button
						onClick={() => {
							handleReload();
						}}
						color='blue'
						buttonType='link'
						size='lg'
						rounded={false}
						block={false}
						iconOnly={true}
						ripple='dark'>
						<IconRefresh sx={{fontSize: 40}} />
					</Button>
				</Tooltip>
				<Tooltip
					title={
						simuData.running ? (
							<Trans i18nKey='uppercase.stop'>STOP</Trans>
						) : (
							<Trans i18nKey='uppercase.start'>START</Trans>
						)
					}>
					<Button
						onClick={() => {
							handleRun();
						}}
						color={simuData.running ? 'red' : 'green'}
						buttonType='link'
						size='lg'
						rounded={false}
						block={false}
						iconOnly={true}
						ripple='dark'>
						{simuData.running ? (
							<IconPauseCircleOutline sx={{fontSize: 40}} />
						) : (
							<IconPlayCircleOutline sx={{fontSize: 40}} />
						)}
					</Button>
				</Tooltip>
				<InputLabel>testStep: {simuData.testStep}</InputLabel>
			</div>
			<div className='flex flex-wrap justify-end w-full px-8'>
				<WidgetFooter updatedAt={updatedAt} onRefresh={handleRefresh} />
			</div>
		</>
	);
}

export default memo(SimuPanel);
