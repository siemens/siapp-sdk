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
import {memo, useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {InputLabel, MenuItem, FormControl, Select} from '@mui/material';
import {typicalsMonitor, typicalsControl} from '@config/typicalsA8000';
import {typicalsSelectPeriod} from '@config/typicalsA8000';
import ModalDelete from '@A8000/components/modal/ModalDelete';
import ModalGraph from '@A8000/components/modal/ModalGraph';
import {
	addMqttGraphConfig,
	deleteMqttGraphConfig,
	editMqttGraphConfig,
	addMqttGraphControl,
	deleteMqttGraphControl,
	editMqttGraphControl,
	setGraphPeriod,
} from '@A8000/store/A8000/mqtt/mqttGraphSlice';
import ModalConfig from '../modal/ModalConfig';
import {Trans} from 'react-i18next';

function TableGraph(props) {
	const dispatch = useDispatch();

	const handleAddGraph = useCallback(
		(data) => {
			const newData = {
				...data,
				group: props.group,
			};
			dispatch(addMqttGraphConfig(newData));
		},
		[dispatch, props.group],
	);

	const handleRemoveGraph = useCallback(
		(id) => {
			dispatch(deleteMqttGraphConfig(id));
		},
		[dispatch],
	);

	const handleChangeGraph = useCallback(
		(data) => {
			dispatch(editMqttGraphConfig(data));
		},
		[dispatch],
	);

	const handleAddControl = useCallback(
		(data) => {
			const typical = _.find(typicalsControl, {type: data.type});
			const newData = {
				...data,
				group: props.group,
				...typical,
			};
			dispatch(addMqttGraphControl(newData));
		},
		[dispatch, props.group],
	);

	const handleRemoveControl = useCallback(
		(id) => {
			dispatch(deleteMqttGraphControl(id));
		},
		[dispatch],
	);

	const handleChangeControl = useCallback(
		(data) => {
			const old = _.find(props.graphMqtt.control, {id: data.id});
			const typical = _.find(typicalsControl, {type: data.type});
			if (data.type !== old.type) {
				const newData = {
					...data,
					group: props.group,
					...typical,
				};
				dispatch(editMqttGraphControl(newData));
			} else {
				dispatch(editMqttGraphControl(data));
			}
		},
		[dispatch, props.graphMqtt.control, props.group],
	);

	if (!props.graphMqtt) {
		return null;
	}
	return (
		<>
			<div className='flex flex-wrap justify-center'>
				<FormControl variant='standard' className='w-full' sx={{m: 1, minWidth: 200}}>
					<InputLabel id='selectPeriod-label'>
						<Trans i18nKey='text.defaultPeriod'>DEFAULT PERIOD</Trans>
					</InputLabel>
					<Select
						labelId='selectPeriod-label'
						id='selectPeriod'
						value={props.graphMqtt.status.graphPeriod}
						onChange={(e) => {
							dispatch(setGraphPeriod(e.target.value));
						}}
						label='Period'>
						{typicalsSelectPeriod.map((item) => (
							<MenuItem key={item.id} value={item.value}>
								<Trans i18nKey={item.translate}>{item.name} </Trans>
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</div>
			<div className='overflow-x-auto mb-3'>
				<table className='items-center w-full bg-transparent border-collapse'>
					<thead>
						<tr>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.sort'>SORT </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.monitoringDirection'>MONITORING DIRECTION </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.topic'>TOPIC </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.type'>TYPE </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.action'>ACTION </Trans>
							</th>
						</tr>
					</thead>
					<tbody>
						{props.graphMqtt.graph
							.filter((topic) => topic.group === props.group)
							.sort((a, b) => (a.sort > b.sort ? 1 : -1))
							.map((item) => (
								<tr key={item.id}>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
										{item.sort}
									</th>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
										{item.name}
									</th>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
										{props.id + item.topic}
									</th>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
										{item.typeName !== undefined ? item.typeName : item.type}
									</th>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left flex flex-wrap justify-start'>
										<ModalGraph
											prefix={props.id}
											mode='UPDATE'
											data={item}
											typicals={typicalsMonitor}
											iconOnly={true}
											onClick={handleChangeGraph}
										/>
										<ModalDelete id={item.id} translate='button.deleteTopic' iconOnly onClick={handleRemoveGraph} />
									</th>
								</tr>
							))}
					</tbody>
				</table>
				<ModalGraph prefix={props.id} mode='ADD' typicals={typicalsMonitor} iconOnly={false} onClick={handleAddGraph} />
			</div>
			<div className='overflow-x-auto mb-3'>
				<table className='items-center w-full bg-transparent border-collapse'>
					<thead>
						<tr>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.sort'>SORT </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.controlingDirection'>CONTROLING DIRECTION </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.topic'>TOPIC </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.type'>TYPE </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.action'>ACTION </Trans>
							</th>
						</tr>
					</thead>
					<tbody>
						{props.graphMqtt.control
							.filter((topic) => topic.group === props.group)
							.sort((a, b) => (a.sort > b.sort ? 1 : -1))
							.map((item) => (
								<tr key={item.id}>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 text-left'>
										{item.sort}
									</th>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 text-left'>
										{item.name}
									</th>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 text-left'>
										{props.id + item.topic}
									</th>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 text-left'>
										{item.typeName !== undefined ? item.typeName : item.type}
									</th>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 text-left flex flex-wrap justify-start'>
										<ModalGraph
											prefix={props.id}
											mode='UPDATE'
											data={item}
											typicals={typicalsControl}
											iconOnly={true}
											onClick={handleChangeControl}
										/>
										<ModalConfig data={item} onChange={handleChangeControl} />
										<ModalDelete id={item.id} translate='button.deleteTopic' iconOnly onClick={handleRemoveControl} />
									</th>
								</tr>
							))}
					</tbody>
				</table>
				<ModalGraph
					prefix={props.id}
					mode='ADD'
					typicals={typicalsControl}
					iconOnly={false}
					onClick={handleAddControl}
				/>
			</div>
		</>
	);
}

export default memo(TableGraph);
