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
import {memo, useCallback, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import Button from '@material-tailwind/react/Button';
import H6 from '@material-tailwind/react/Heading6';
import {Tooltip, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Slider} from '@mui/material';
import {
	PlayCircleOutline as IconPlayCircleOutline,
	PauseCircleOutline as IconPauseCircleOutline,
	Refresh as IconRefresh,
	SettingsSuggestOutlined as IconSettingsSuggestOutlined,
} from '@mui/icons-material';
import Moment from 'react-moment';
import moment from 'moment';
import {Trans} from 'react-i18next';
import {getMqttStates} from '@A8000/store/A8000/mqtt/mqttDataSlice';
import {setRunUpdate, setUpdatePeriod} from '@A8000/store/A8000/statusSlice';
import {configRoles} from '@config/configAuth';

function WidgetFooter(props) {
	const dispatch = useDispatch();
	const status = useSelector(({A8000}) => A8000.status);
	const auth = useSelector(({auth}) => auth);
	const [showModal, setShowModal] = useState(false);
	const [updateData, setUpdateData] = useState(status.updateData);

	function handleUpdateData(event, val) {
		setUpdateData(val);
	}
	function handleCancel() {
		setShowModal(false);
		setUpdateData(status.updateData);
	}
	function handleShow() {
		setShowModal(true);
		setUpdateData(status.updateData);
	}
	const handleUpdate = useCallback(
		(runUpdate) => {
			dispatch(setRunUpdate(runUpdate));
			if (props.onRefresh) props.onRefresh();
			dispatch(getMqttStates());
		},
		[dispatch, props],
	);

	const handleSettings = useCallback(() => {
		setShowModal(false);
		dispatch(setUpdatePeriod({updateData: updateData}));
	}, [dispatch, updateData]);

	return (
		<>
			<div className='flex flex-wrap align-bottom justify-start pt-8'>
				{_.intersection(configRoles['operator'], auth.roles).length > 0 && (
					<>
						<Tooltip
							title={
								status.runUpdate ? (
									<Trans i18nKey='uppercase.stop'>STOP</Trans>
								) : (
									<Trans i18nKey='uppercase.start'>START</Trans>
								)
							}>
							<Button
								onClick={() => {
									handleUpdate(!status.runUpdate);
								}}
								color='gray'
								buttonType='link'
								size='sm'
								rounded
								block={false}
								iconOnly
								ripple='dark'>
								{status.runUpdate ? <IconPauseCircleOutline /> : <IconPlayCircleOutline />}
							</Button>
						</Tooltip>
						<Tooltip title={<Trans i18nKey='uppercase.refresh'>REFRESH</Trans>}>
							<Button
								onClick={() => {
									handleUpdate(status.runUpdate);
								}}
								color='gray'
								buttonType='link'
								size='sm'
								rounded
								block={false}
								iconOnly
								ripple='dark'>
								<IconRefresh />
							</Button>
						</Tooltip>{' '}
					</>
				)}
				{_.intersection(configRoles['admin'], auth.roles).length > 0 && (
					<>
						{' '}
						<Tooltip title={<Trans i18nKey='uppercase.settings'>SETTINGS</Trans>}>
							<Button
								onClick={handleShow}
								color='gray'
								buttonType='link'
								size='sm'
								rounded
								block={false}
								iconOnly
								ripple='dark'>
								<IconSettingsSuggestOutlined />
							</Button>
						</Tooltip>
					</>
				)}
				<Typography style={{color: 'gray'}} sx={{textAlign: 'center', m: 1}} variant='caption' gutterBottom>
					<Moment format='YYYY-MM-DD HH:mm:ss'>{moment(props.updatedAt)}</Moment>
				</Typography>
			</div>

			<Dialog fullWidth size='sm' open={showModal} onClose={handleCancel}>
				<DialogTitle>
					<Trans i18nKey='uppercase.settings'>SETTINGS </Trans>
				</DialogTitle>
				<DialogContent>
					<div className='flex flex-wrap justify-start w-full'>
						<div className='flex justify-center w-full px-8 pt-8'>
							<Slider
								aria-label='updateData'
								value={updateData}
								valueLabelDisplay='on'
								step={10}
								min={10}
								max={60}
								marks={false}
								onChange={handleUpdateData}
							/>
						</div>
						<div className='flex flex-wrap justify-between w-full px-10'>
							<div className='text-left w-1/6'>
								<Typography color='primary' variant='caption' gutterBottom>
									10
								</Typography>
							</div>
							<div className='text-center w-4/6'>
								<H6 color='lightBlue'>
									<Trans i18nKey='text.updateData'>UPDATE DATA (s)</Trans>
								</H6>
							</div>
							<div className='text-right w-1/6'>
								<Typography color='primary' variant='caption' gutterBottom>
									60
								</Typography>
							</div>
						</div>
					</div>
				</DialogContent>
				<DialogActions>
					<Button color='blueGray' buttonType='link' onClick={handleCancel} ripple='dark'>
						<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
					</Button>
					<Button buttonType='outline' color='green' onClick={handleSettings} ripple='light'>
						<Trans i18nKey='uppercase.update'>UPDATE </Trans>
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default memo(WidgetFooter);
