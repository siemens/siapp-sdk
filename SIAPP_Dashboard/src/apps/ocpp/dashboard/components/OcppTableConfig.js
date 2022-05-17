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

import {memo, useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import Button from '@material-tailwind/react/Button';
import {Checkbox, TextField} from '@mui/material';
import {Edit as IconEdit} from '@mui/icons-material';
import {inputTypes} from '@config/constA8000';
import ModalDelete from '@A8000/components/modal/ModalDelete';
import {Trans} from 'react-i18next';
import {useSelector} from 'react-redux';

function OcppTableConfig(props) {
	const ocppTypicals = useSelector(({ocpp}) => ocpp.typicalsOcpp);
	const [editMode, setEditMode] = useState(false);

	const {control, reset, handleSubmit} = useForm({
		mode: 'onChange',
	});

	useEffect(() => {
		reset(props.dataConfig);
	}, [props.dataConfig, reset]);

	function handleRemove(id) {
		props.onRemove(id);
	}

	function onSubmit(model) {
		setEditMode(false);
		props.onChange(props.id, model);
	}

	function handleCancel() {
		setEditMode(false);
		reset(props.dataConfig);
	}

	if (!props.dataConfig && !props.templateGroup && !ocppTypicals[props.templateGroup]) {
		return null;
	}

	// Template available
	if (ocppTypicals[props.templateGroup][props.dataConfig.meta.typeId] !== undefined) {
		return (
			<>
				<div className='mx-auto flex flex-wrap justify-center w-full'>
					<div className='overflow-x-auto w-full mb-5'>
						<table className='items-center w-full bg-transparent border-collapse'>
							<thead>
								<tr>
									<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
										<Trans i18nKey='uppercase.key'>KEY </Trans>
									</th>
									<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
										<Trans i18nKey='uppercase.value'>VALUE </Trans>
									</th>
								</tr>
							</thead>
							<tbody>
								{ocppTypicals[props.templateGroup][props.dataConfig.meta.typeId].userParameters.map(
									(item) =>
										item.key !== 'meta' &&
										item.key !== 'id' && (
											<tr key={item.key}>
												<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
													{item.displayName}
												</th>
												<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
													{item.type === 'boolean' ? (
														<Controller
															name={item.key}
															defaultValue={props.dataConfig[item.key] ? props.dataConfig[item.key] : item.defaultValue}
															control={control}
															render={({field: {onChange, value}}) => (
																<Checkbox
																	checked={value}
																	disabled={!editMode}
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
																name={item.key}
																defaultValue={
																	props.dataConfig[item.key] ? props.dataConfig[item.key] : item.defaultValue
																}
																control={control}
																render={({field: {onChange, value}}) => (
																	<TextField
																		value={value}
																		fullWidth
																		onChange={(ev) => {
																			typeof item.defaultValue === 'number'
																				? onChange(ev.target.valueAsNumber)
																				: onChange(ev.target.value);
																		}}
																		type={inputTypes[item.type]}
																		size='small'
																		disabled={!editMode}
																	/>
																)}
																variant='outlined'
																// required
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
					{editMode ? (
						<div className='flex flex-wrap mx-auto item-center justify-center text-center w-full'>
							<div className='sm:w-1/2 p-2'>
								<Button
									onClick={handleCancel}
									color='blueGray'
									buttonType='outline'
									size='sm'
									rounded={false}
									block={true}
									iconOnly={false}
									ripple='dark'>
									<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
								</Button>
							</div>
							<div className='sm:w-1/2 p-2'>
								<Button
									type='submit'
									onClick={handleSubmit(onSubmit)}
									color='green'
									buttonType='outline'
									size='sm'
									rounded={false}
									block={true}
									iconOnly={false}
									ripple='dark'>
									<Trans i18nKey='uppercase.update'>UPDATE</Trans>
								</Button>
							</div>
						</div>
					) : (
						<div className='flex flex-wrap mx-auto item-center justify-center text-center w-full'>
							<div className='w-full p-2'>
								<Button
									onClick={(e) => setEditMode(true)}
									color='green'
									buttonType='outline'
									size='sm'
									rounded={false}
									block={true}
									iconOnly={false}
									ripple='dark'>
									<IconEdit />
									<Trans i18nKey='button.editConfig'>EDIT CONFIG </Trans>
								</Button>
							</div>
							<div className='w-full p-2'>
								{props.id !== undefined && props.id !== '' && (
									<ModalDelete id={props.id} translate='button.deleteCS' onClick={handleRemove} />
								)}
							</div>
						</div>
					)}
				</div>
			</>
		);
	}

	// Template not available
	return (
		<>
			<div className='mx-auto flex flex-wrap justify-center w-full'>
				<div className='overflow-x-auto w-full mb-5'>
					<table className='items-center w-full bg-transparent border-collapse'>
						<thead>
							<tr>
								<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
									<Trans i18nKey='uppercase.key'>KEY </Trans>
								</th>
								<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
									<Trans i18nKey='uppercase.value'>VALUE </Trans>
								</th>
							</tr>
						</thead>
						<tbody>
							{Object.keys(props.dataConfig).map(
								(item) =>
									typeof props.dataConfig[item] !== 'object' && (
										<tr key={item}>
											<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
												{item}
											</th>
											<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
												{typeof props.dataConfig[item] === 'boolean' ? (
													<Controller
														name={item}
														defaultValue={props.dataConfig[item]}
														control={control}
														render={({field: {onChange, value}}) => (
															<Checkbox
																checked={value}
																disabled={!editMode}
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
															defaultValue={props.dataConfig[item]}
															control={control}
															render={({field: {onChange, value}}) => (
																<TextField
																	value={value}
																	fullWidth
																	onChange={(ev) => {
																		typeof props.dataConfig[item] === 'number'
																			? onChange(ev.target.valueAsNumber)
																			: onChange(ev.target.value);
																	}}
																	type={inputTypes[typeof props.dataConfig[item]]}
																	size='small'
																	disabled={item === 'id' || !editMode}
																/>
															)}
															variant='outlined'
															// required
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
				{editMode ? (
					<div className='flex flex-wrap mx-auto item-center justify-center text-center w-full'>
						<div className='sm:w-1/2 p-2'>
							<Button
								onClick={handleCancel}
								color='blueGray'
								buttonType='outline'
								size='sm'
								rounded={false}
								block={true}
								iconOnly={false}
								ripple='dark'>
								<Trans i18nKey='uppercase.cancel'>CANCEL</Trans>
							</Button>
						</div>
						<div className='sm:w-1/2 p-2'>
							<Button
								type='submit'
								onClick={handleSubmit(onSubmit)}
								color='green'
								buttonType='outline'
								size='sm'
								rounded={false}
								block={true}
								iconOnly={false}
								ripple='dark'>
								<Trans i18nKey='uppercase.update'>UPDATE</Trans>
							</Button>
						</div>
					</div>
				) : (
					<div className='flex flex-wrap mx-auto item-center justify-center text-center w-full'>
						<div className='w-full p-2'>
							<Button
								onClick={(e) => setEditMode(true)}
								color='green'
								buttonType='outline'
								size='sm'
								rounded={false}
								block={true}
								iconOnly={false}
								ripple='dark'>
								<IconEdit />
								<Trans i18nKey='button.editConfig'>EDIT CONFIG </Trans>
							</Button>
						</div>
						<div className='w-full p-2'>
							{props.id !== undefined && props.id !== '' && (
								<ModalDelete id={props.id} translate='button.deleteCS' onClick={handleRemove} />
							)}
						</div>
					</div>
				)}
			</div>
		</>
	);
}

export default memo(OcppTableConfig);
