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
	TextField,
	InputLabel,
	MenuItem,
	FormControl,
	Select,
} from '@mui/material';
import {ControlPoint as IconControlPoint} from '@mui/icons-material';
import {Trans} from 'react-i18next';

function ModalAddStation(props) {
	const [showModal, setShowModal] = useState(false);
	const [selectedType, setSelectedType] = useState('');
	const [csId, setCsId] = useState('');

	function handleAdd() {
		setShowModal(false);
		props.onClick(selectedType, csId);
		setSelectedType('');
		setCsId('');
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
				<Trans i18nKey='button.addCS'>ADD CHARGING STATION </Trans>
			</Button>
			<Dialog fullWidth size='lg' open={showModal} onClose={handleCancel}>
				<DialogTitle>
					<Trans i18nKey='button.addCS'>ADD CHARGING STATION </Trans>
				</DialogTitle>
				<DialogContent>
					<div className='mb-3'>
						<TextField
							fullWidth
							id='idCS'
							name='idCS'
							onChange={(e) => setCsId(e.target.value)}
							type='text'
							size='small'
							label='ID'
							variant='outlined'
							defaultValue=''
						/>
					</div>
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
				</DialogContent>
				<DialogActions>
					<Button color='blueGray' buttonType='outline' onClick={handleCancel} ripple='dark'>
						<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
					</Button>

					{selectedType !== '' && csId !== '' ? (
						<Button buttonType='outline' color='green' onClick={handleAdd} ripple='light'>
							<Trans i18nKey='uppercase.add'>ADD </Trans>
						</Button>
					) : (
						<Button buttonType='link' color='gray' ripple='light'>
							<Trans i18nKey='uppercase.add'>ADD </Trans>
						</Button>
					)}
				</DialogActions>
			</Dialog>
		</>
	);
}

export default memo(ModalAddStation);
