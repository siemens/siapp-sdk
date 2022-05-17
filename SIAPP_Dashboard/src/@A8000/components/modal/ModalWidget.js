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

import React, {memo, useEffect, useState} from 'react';
import {Edit as IconEdit, ControlPoint as IconControlPoint} from '@mui/icons-material';
import Button from '@material-tailwind/react/Button';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	InputLabel,
	MenuItem,
	FormControl,
	Select,
} from '@mui/material';
import {Trans} from 'react-i18next';

function ModalWidget(props) {
	const [showModal, setShowModal] = useState(false);
	const [widgetName, setWidgetName] = useState('');
	const [defaultView, setDefaultView] = useState(0);

	useEffect(() => {
		if (props.data !== undefined) {
			setWidgetName(props.data.name);
			setDefaultView(props.data.defaultView);
		}
	}, [props]);

	function handleChange() {
		props.onClick({name: widgetName, defaultView: defaultView});
		setShowModal(false);
		if (props.mode === 'ADD') {
			setWidgetName('');
			setDefaultView(0);
		}
	}

	function handleCancel() {
		setShowModal(false);
		if (props.mode === 'ADD') {
			setWidgetName('');
			setDefaultView(0);
		}
	}

	return (
		<>
			<Button
				onClick={(e) => setShowModal(true)}
				className='mt-10'
				color={props.mode === 'ADD' ? 'lightBlue' : 'green'}
				buttonType='outline'
				size='sm'
				rounded={false}
				block={true}
				iconOnly={false}
				ripple='dark'>
				{props.mode === 'ADD' ? <IconControlPoint /> : <IconEdit />}
				{props.mode === 'ADD' ? (
					<Trans i18nKey='button.addWidget'>ADD WIDGET </Trans>
				) : (
					<Trans i18nKey='button.editWidget'>EDIT WIDGET </Trans>
				)}
			</Button>
			<Dialog fullWidth size='lg' open={showModal} onClose={handleCancel}>
				<DialogTitle>
					{props.mode === 'ADD' ? (
						<Trans i18nKey='button.addWidget'>ADD WIDGET</Trans>
					) : (
						<Trans i18nKey='button.editWidget'>EDIT WIDGET </Trans>
					)}
				</DialogTitle>
				<DialogContent>
					<div className='flex flex-wrap justify-center w-full my-3'>
						<TextField
							fullWidth
							autoFocus
							value={widgetName}
							onInput={(e) => setWidgetName(e.target.value)}
							size='small'
							label='Widget Name'
							variant='outlined'
						/>
					</div>
					<div className='flex flex-wrap justify-center'>
						<FormControl variant='standard' className='w-full' sx={{m: 1, minWidth: 200}}>
							<InputLabel id='selectType-label'>Default View</InputLabel>
							<Select
								labelId='selectType-label'
								id='selectType'
								value={defaultView}
								onChange={(e) => {
									setDefaultView(e.target.value);
								}}
								label='Default View'>
								<MenuItem value={0}>
									<Trans i18nKey='uppercase.graph'>GRAPH</Trans>
								</MenuItem>
								<MenuItem value={1}>
									<Trans i18nKey='uppercase.data'>DATA</Trans>
								</MenuItem>
								<MenuItem value={2}>
									<Trans i18nKey='uppercase.control'>CONTROL </Trans>
								</MenuItem>
							</Select>
						</FormControl>
					</div>
				</DialogContent>
				<DialogActions>
					<Button color='blueGray' buttonType='outline' onClick={handleCancel} ripple='dark'>
						<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
					</Button>

					{widgetName !== '' ? (
						<Button buttonType='outline' color='green' onClick={handleChange} ripple='light'>
							{props.mode === 'ADD' ? (
								<Trans i18nKey='uppercase.add'>ADD</Trans>
							) : (
								<Trans i18nKey='uppercase.update'>UPDATE</Trans>
							)}
						</Button>
					) : (
						<Button buttonType='link' color='gray' ripple='light'>
							{props.mode === 'ADD' ? (
								<Trans i18nKey='uppercase.add'>ADD</Trans>
							) : (
								<Trans i18nKey='uppercase.update'>UPDATE</Trans>
							)}
						</Button>
					)}
				</DialogActions>
			</Dialog>
		</>
	);
}

export default memo(ModalWidget);
