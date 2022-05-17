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
import {memo, useEffect, useState} from 'react';
import Button from '@material-tailwind/react/Button';
import H6 from '@material-tailwind/react/Heading6';
import {TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Slider, Typography} from '@mui/material';
import {Edit as IconEdit} from '@mui/icons-material';
import {Trans, useTranslation} from 'react-i18next';

function ControlSlider(props) {
	const newTopic = props.prefix + props.data.topic;
	const topicData = _.find(props.dataMqtt, {id: newTopic});
	const [value, setValue] = useState(props.data.config.default);
	const [editValue, setEditValue] = useState('');
	const [error, setError] = useState(false);
	const [errorText, setErrorText] = useState('');
	const [showModal, setShowModal] = useState(false);
	const {t} = useTranslation();

	useEffect(() => {
		if (topicData !== undefined) {
			setValue(topicData.value);
		}
	}, [topicData]);

	function handleValue(event, val) {
		setValue(val);
	}

	function handleChange(event, val) {
		props.onChange(props.data, val);
	}

	function handleSend() {
		if (!error) {
			const val = parseFloat(editValue);
			setShowModal(false);
			props.onChange(props.data, val);
			setValue(val);
		}
	}

	function handleCancel() {
		setShowModal(false);
		setEditValue(value);
		setError(false);
	}

	function handleEdit() {
		setEditValue(value);
		setError(false);
		setShowModal(true);
	}

	function handleEditChange(e) {
		const newValue = e.target.value;
		const val = parseFloat(newValue);
		const inv = 1.0 / props.data.config.step;
		let err = '';
		if (isNaN(val) || (props.data.dataType === 'int' && parseInt(val) !== val) || val === '') {
			err = t('uppercase.value') + ' ';
		} else {
			if (val > props.data.config.max) err = err + 'MAX ';
			if (val < props.data.config.min) err = err + 'MIN ';
			if (val !== Math.round(val * inv) / inv) err = err + 'STEP ';
		}

		if (err !== '') {
			setError(true);
			setErrorText(err);
		} else {
			setError(false);
			setErrorText('');
		}
		setEditValue(newValue);
	}

	if (!props.data) {
		return null;
	}
	return (
		<>
			<div className='flex flex-wrap justify-start w-full'>
				<div className='flex flex-wrap justify-between w-full px-10'>
					<div className='text-left w-3/6'>
						<Typography color='primary' variant='caption' gutterBottom>
							{props.data.config.min}
						</Typography>
					</div>
					<div className='text-right w-3/6'>
						<Typography color='primary' variant='caption' gutterBottom>
							{props.data.config.max}
						</Typography>
					</div>
				</div>
				<div className='flex justify-center w-full px-8 pb-0'>
					<Slider
						aria-label={props.data.name}
						value={value}
						valueLabelDisplay='on'
						step={props.data.config.step}
						marks={props.data.config.max / props.data.config.step > 20 ? false : true}
						min={props.data.config.min}
						max={props.data.config.max}
						onChange={handleValue}
						onChangeCommitted={handleChange}
					/>
				</div>
				<div className='flex flex-wrap justify-between w-full px-8'>
					<div className='text-left w-5/6'>
						<H6 color='lightBlue'>{props.data.name}</H6>
					</div>
					<div className='flex justify-end w-1/6'>
						<Tooltip title={<Trans i18nKey='button.editValue'>EDIT VALUE</Trans>}>
							<Button
								onClick={handleEdit}
								color='green'
								buttonType='link'
								size='sm'
								rounded={false}
								block={false}
								iconOnly={true}
								ripple='dark'>
								<IconEdit />
							</Button>
						</Tooltip>
					</div>
				</div>
			</div>

			<Dialog fullWidth size='sm' open={showModal} onClose={() => setShowModal(false)}>
				<DialogTitle>{<Trans i18nKey='button.editValue'>EDIT VALUE</Trans>}</DialogTitle>
				<DialogContent>
					<div className='flex flex-wrap justify-start w-full py-3'>
						<TextField
							fullWidth
							onChange={handleEditChange}
							type='number'
							size='small'
							label={props.data.name}
							variant='outlined'
							value={editValue}
							error={error}
							helperText={error && 'Error: ' + errorText}
						/>
					</div>
				</DialogContent>
				<DialogActions>
					<Button color='blueGray' buttonType='link' onClick={handleCancel} ripple='dark'>
						<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
					</Button>
					{error ? (
						<Button buttonType='link' color='gray' ripple='light'>
							<Trans i18nKey='uppercase.send'>SEND</Trans>
						</Button>
					) : (
						<Button buttonType='outline' color='green' onClick={handleSend} ripple='light'>
							<Trans i18nKey='uppercase.send'>SEND</Trans>
						</Button>
					)}
				</DialogActions>
			</Dialog>
		</>
	);
}

export default memo(ControlSlider);
