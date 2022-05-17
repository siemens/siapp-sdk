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
import {Controller, useForm} from 'react-hook-form';
import Button from '@material-tailwind/react/Button';
import {Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, Tooltip} from '@mui/material';
import {HandymanOutlined as IconHandymanOutlined} from '@mui/icons-material';
import {inputTypes} from '@config/constA8000';
import {Trans} from 'react-i18next';

function ModalConfig(props) {
	const [showModal, setShowModal] = useState(false);

	const {control, handleSubmit} = useForm({
		mode: 'onChange',
	});

	function onSubmit(model) {
		setShowModal(false);
		props.onChange({...props.data, config: model});
	}

	function handleCancel() {
		setShowModal(false);
	}

	if (!props.data) {
		return null;
	}
	return (
		<>
			<Tooltip title={<Trans i18nKey='uppercase.settings'>SETTINGS</Trans>}>
				<Button
					onClick={(e) => setShowModal(true)}
					color='blue'
					buttonType='link'
					size='sm'
					rounded={false}
					block={true}
					iconOnly
					ripple='dark'>
					<IconHandymanOutlined />
				</Button>
			</Tooltip>
			<Dialog fullWidth size='lg' open={showModal} onClose={handleCancel}>
				<DialogTitle>
					<Trans i18nKey='uppercase.settings'>SETTINGS</Trans>
				</DialogTitle>
				<DialogContent>
					<div className='mx-auto flex flex-wrap justify-center w-full'>
						<div className='overflow-x-auto w-full mb-5'>
							<table className='items-center w-full bg-transparent border-collapse'>
								<thead>
									<tr>
										<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
											KEY
										</th>
										<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
											VALUE
										</th>
									</tr>
								</thead>
								<tbody>
									{Object.keys(props.data.config).map(
										(item) =>
											typeof props.data.config[item] !== 'object' && (
												<tr key={item}>
													<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
														{item}
													</th>
													<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
														{typeof props.data.config[item] === 'boolean' ? (
															<Controller
																name={item}
																defaultValue={props.data.config[item]}
																control={control}
																render={({field: {onChange, value}}) => (
																	<Checkbox
																		checked={value}
																		onChange={(ev) => onChange(ev.target.checked)}
																		size='small'
																	/>
																)}
																variant='outlined'
																// required
															/>
														) : (
															<>
																<Controller
																	name={item}
																	defaultValue={props.data.config[item]}
																	control={control}
																	render={({field: {onChange, value}}) => (
																		<TextField
																			value={value}
																			fullWidth
																			onChange={(ev) => {
																				typeof props.data.config[item] === 'number'
																					? onChange(ev.target.valueAsNumber)
																					: onChange(ev.target.value);
																			}}
																			type={inputTypes[typeof props.data.config[item]]}
																			size='small'
																		/>
																	)}
																	variant='outlined'
																/>
															</>
														)}
													</th>
												</tr>
											),
									)}
								</tbody>
							</table>
						</div>
					</div>
				</DialogContent>
				<DialogActions>
					<Button color='blueGray' buttonType='outline' onClick={handleCancel} ripple='dark'>
						<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
					</Button>
					<Button buttonType='outline' color='green' onClick={handleSubmit(onSubmit)} ripple='light'>
						<Trans i18nKey='uppercase.update'>UPDATE</Trans>
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default memo(ModalConfig);
