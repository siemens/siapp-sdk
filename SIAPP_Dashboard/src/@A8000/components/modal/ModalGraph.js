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
	Tooltip,
} from '@mui/material';
import {Trans} from 'react-i18next';

function ModalGraph(props) {
	const [showModal, setShowModal] = useState(false);
	const [graphName, setGraphName] = useState('');
	const [graphTopic, setGraphTopic] = useState('');
	const [graphType, setGraphType] = useState('');
	const [graphSort, setGraphSort] = useState(100);

	useEffect(() => {
		if (props.data !== undefined) {
			setGraphName(props.data.name);
			setGraphTopic(props.data.topic);
			setGraphType(props.data.type);
			if (props.data.sort !== undefined) setGraphSort(props.data.sort);
		}
	}, [props]);

	function handleChange() {
		props.onClick({...props.data, name: graphName, topic: graphTopic, type: graphType, sort: graphSort});
		setShowModal(false);
		if (props.mode === 'ADD') {
			setGraphName('');
			setGraphTopic('');
			setGraphType('');
			setGraphType(100);
		}
	}

	function handleCancel() {
		setShowModal(false);
		if (props.mode === 'ADD') {
			setGraphName('');
			setGraphTopic('');
			setGraphType('');
			setGraphType(100);
		}
	}

	return (
		<>
			<Tooltip title={props.mode === 'ADD' ? '' : <Trans i18nKey='button.editTopic'>EDIT TOPIC</Trans>}>
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
							<Trans i18nKey='button.editTopic'>EDIT TOPIC</Trans>
						))}
				</Button>
			</Tooltip>
			<Dialog fullWidth size='lg' open={showModal} onClose={handleCancel}>
				<DialogTitle>
					{props.mode === 'ADD' ? (
						<Trans i18nKey='button.addTopic'>ADD TOPIC</Trans>
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
								value={graphType}
								onChange={(e) => {
									setGraphType(e.target.value);
								}}
								label='Type'>
								{props.typicals.map((item) => (
									<MenuItem key={item.type} value={item.type}>
										{item.typeName}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</div>
					<div className='flex flex-wrap justify-center w-full my-3'>
						<TextField
							fullWidth
							value={graphName}
							onInput={(e) => setGraphName(e.target.value)}
							size='small'
							label='Display Name'
							variant='outlined'
						/>
					</div>
					<div className='flex flex-wrap justify-center w-full mb-3'>
						<TextField
							fullWidth
							onInput={(e) => setGraphTopic(e.target.value)}
							type='text'
							size='small'
							label='Topic'
							variant='outlined'
							value={graphTopic}
							InputProps={{
								startAdornment: <InputAdornment position='start'>{props.prefix}</InputAdornment>,
							}}
						/>
					</div>
					<div className='flex flex-wrap justify-center w-full mb-3'>
						<TextField
							fullWidth
							onInput={(e) => setGraphSort(e.target.valueAsNumber)}
							type='number'
							size='small'
							label='Sort Order'
							variant='outlined'
							value={graphSort}
						/>
					</div>
				</DialogContent>
				<DialogActions>
					<Button color='blueGray' buttonType='outline' onClick={handleCancel} ripple='dark'>
						<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
					</Button>

					{graphName !== '' && graphTopic !== '' && graphType !== '' ? (
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

export default memo(ModalGraph);
