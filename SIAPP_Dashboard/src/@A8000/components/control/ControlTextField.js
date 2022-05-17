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
import {TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip} from '@mui/material';
import {Edit as IconEdit} from '@mui/icons-material';
import Button from '@material-tailwind/react/Button';
import H6 from '@material-tailwind/react/Heading6';
import {Trans, useTranslation} from 'react-i18next';

function ControlTextField(props) {
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

	function handleSend() {
		if (!error) {
			let val = editValue;
			if (props.data.dataType === 'float' || props.data.dataType === 'int') {
				val = parseFloat(val);
			}
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
		let err = '';
		if (props.data.dataType === 'float' || props.data.dataType === 'int') {
			const inv = 1.0 / props.data.config.step;
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
		}
		setEditValue(newValue);
	}

	if (!props.data) {
		return null;
	}
	return (
		<>
			<div className='flex flex-wrap align-middle justify-start w-full px-8'>
				<div className='text-left w-2/6'>
					<H6 color='lightBlue'>{props.data.name}</H6>
				</div>
				<div className='text-center w-2/6'>
					<H6 color='lightBlue'>{value}</H6>
				</div>
				<div className='flex justify-end w-2/6'>
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

			<Dialog fullWidth size='sm' open={showModal} onClose={() => setShowModal(false)}>
				<DialogTitle>
					<Trans i18nKey='button.editValue'>EDIT VALUE</Trans>
				</DialogTitle>
				<DialogContent>
					<div className='flex flex-wrap justify-start w-full py-3'>
						<TextField
							fullWidth
							onChange={handleEditChange}
							type={props.data.dataType === 'string' ? 'text' : 'number'}
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

export default memo(ControlTextField);
