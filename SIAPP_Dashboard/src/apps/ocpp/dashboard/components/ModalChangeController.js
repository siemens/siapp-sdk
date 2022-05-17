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

import React, {memo, useState} from 'react';
import Button from '@material-tailwind/react/Button';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	InputLabel,
	MenuItem,
	FormControl,
	Select,
	Switch,
} from '@mui/material';
import {ControlPoint as IconControlPoint} from '@mui/icons-material';
import {Trans} from 'react-i18next';

function ModalChangeController(props) {
	const [showModal, setShowModal] = useState(false);
	const [selectedType, setSelectedType] = useState('');
	const [keepValues, setKeepValues] = useState(true);

	function handleChange() {
		if (keepValues === false) {
			setKeepValues(true);
		} else {
			setKeepValues(false);
		}
	}
	function handleUpdate() {
		setShowModal(false);
		props.onClick(selectedType, keepValues);
		setSelectedType('');
	}

	function handleCancel() {
		setShowModal(false);
		setSelectedType('');
	}

	if (props.data.length === 0) {
		return null;
	}

	return (
		<>
			<Button
				onClick={(e) => setShowModal(true)}
				color='lightBlue'
				buttonType='outline'
				size='small'
				rounded={false}
				block={true}
				iconOnly={false}
				ripple='dark'>
				<IconControlPoint />
				<Trans i18nKey='button.changeController'>CHANGE CONTROLLER </Trans>
			</Button>
			<Dialog fullWidth size='lg' open={showModal} onClose={handleCancel}>
				<DialogTitle>
					<Trans i18nKey='button.changeController'>CHANGE CONTROLLER </Trans>
				</DialogTitle>
				<DialogContent>
					<div className='flex flex-wrap justify-center mt-3'>
						<FormControl variant='standard' className='w-full' sx={{m: 1, minWidth: 200}}>
							<InputLabel id='selectType-label'>Type</InputLabel>
							<Select
								autoFocus
								labelId='selectType-label'
								id='selectType'
								value={selectedType}
								onChange={(e) => {
									setSelectedType(e.target.value);
								}}
								label='Type'>
								{Object.keys(props.data).map((item) => (
									<MenuItem key={props.data[item].meta.typeId} value={props.data[item].meta.typeId}>
										{props.data[item].meta.displayName}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</div>
					<Switch checked={keepValues} onClick={handleChange} color='primary' />
					<Trans i18nKey='text.keepValues'>Keep Values</Trans>
				</DialogContent>
				<DialogActions>
					<Button color='blueGray' buttonType='outline' onClick={handleCancel} ripple='dark'>
						<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
					</Button>

					{selectedType !== '' ? (
						<Button buttonType='outline' color='green' onClick={handleUpdate} ripple='light'>
							<Trans i18nKey='uppercase.update'>UPDATE </Trans>
						</Button>
					) : (
						<Button buttonType='link' color='gray' ripple='light'>
							<Trans i18nKey='uppercase.update'>UPDATE </Trans>
						</Button>
					)}
				</DialogActions>
			</Dialog>
		</>
	);
}

export default memo(ModalChangeController);
