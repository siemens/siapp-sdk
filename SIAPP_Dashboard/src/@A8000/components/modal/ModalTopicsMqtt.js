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
	InputAdornment,
} from '@mui/material';
import {Trans} from 'react-i18next';

function ModalTopicsMqtt(props) {
	const [showModal, setShowModal] = useState(false);
	const [mqttTopic, setMqttTopic] = useState('');
	const [mqttValue, setMqttValue] = useState('');
	const [mqttType, setMqttType] = useState('');

	useEffect(() => {
		if (props.data !== undefined) {
			setMqttValue(props.data.message.value);
			setMqttTopic(props.data.topic);
			setMqttType(props.data.message.dataType);
		}
	}, [props]);

	function handleChange() {
		props.onClick({value: mqttValue, topic: mqttTopic, type: mqttType}, props.id);
		setShowModal(false);
		if (props.mode === 'ADD') {
			setMqttValue('');
			setMqttTopic('');
			setMqttType('');
		}
	}

	function handleCancel() {
		setShowModal(false);
		if (props.mode === 'ADD') {
			setMqttValue('');
			setMqttTopic('');
			setMqttType('');
		}
	}

	return (
		<>
			<Button
				onClick={(e) => setShowModal(true)}
				color={props.mode === 'ADD' ? 'lightBlue' : 'green'}
				buttonType={props.iconOnly ? 'link' : 'outline'}
				size='sm'
				rounded={false}
				block={true}
				iconOnly={props.iconOnly}
				ripple='dark'>
				{props.mode === 'ADD' ? <IconControlPoint /> : <IconEdit />}
				{!props.iconOnly &&
					(props.mode === 'ADD' ? (
						<Trans i18nKey='button.addTopic'>ADD TOPIC</Trans>
					) : (
						<Trans i18nKey='button.editTopic'>EDIT TOPIC </Trans>
					))}
			</Button>
			<Dialog fullWidth size='lg' open={showModal} onClose={handleCancel}>
				<DialogTitle>
					{props.mode === 'ADD' ? (
						<Trans i18nKey='button.add'>ADD TOPIC</Trans>
					) : (
						<Trans i18nKey='button.editTopic'>EDIT TOPIC</Trans>
					)}
				</DialogTitle>
				<DialogContent>
					<div className='flex flex-wrap justify-center'>
						<FormControl variant='standard' className='w-full' sx={{m: 1, minWidth: 200}}>
							<InputLabel id='selectType-label'>Type</InputLabel>
							<Select
								autoFocus
								labelId='selectType-label'
								id='selectType'
								value={mqttType}
								onChange={(e) => {
									setMqttType(e.target.value);
								}}
								label='Type'>
								<MenuItem value='string'>STRING</MenuItem>
								<MenuItem value='int'>INT</MenuItem>
								<MenuItem value='float'>FLOAT</MenuItem>
							</Select>
						</FormControl>
					</div>
					<div className='flex flex-wrap justify-center w-full my-3'>
						<TextField
							fullWidth
							onInput={(e) => setMqttTopic(e.target.value)}
							type='text'
							size='small'
							label='Topic'
							variant='outlined'
							value={mqttTopic}
							InputProps={{
								startAdornment: <InputAdornment position='start'>{props.prefix}</InputAdornment>,
							}}
						/>
					</div>
					<div className='flex flex-wrap justify-center w-full mb-3'>
						<TextField
							fullWidth
							type={mqttType === 'string' ? 'text' : 'number'}
							value={mqttValue}
							onInput={(e) => {
								mqttType === 'string' ? setMqttValue(e.target.value) : setMqttValue(e.target.valueAsNumber);
							}}
							size='small'
							label='Value'
							variant='outlined'
						/>
					</div>
				</DialogContent>
				<DialogActions>
					<Button color='blueGray' buttonType='outline' onClick={handleCancel} ripple='dark'>
						<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
					</Button>

					{mqttValue !== '' && mqttTopic !== '' && mqttType !== '' ? (
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

export default memo(ModalTopicsMqtt);
