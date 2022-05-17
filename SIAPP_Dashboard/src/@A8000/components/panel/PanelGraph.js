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
import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import moment from 'moment';
import {InputLabel, MenuItem, FormControl, Select} from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import GraphModel from '@A8000/models/GraphModel';
import {getArchiveByTopic} from '@A8000/store/A8000/mqtt/mqttDataSlice';
import WidgetFooter from '../layout/WidgetFooter';
import {setPeriod} from '@A8000/store/A8000/statusSlice';
import {getMqttStates} from '@A8000/store/A8000/mqtt/mqttDataSlice';
import {Trans} from 'react-i18next';
import {typicalsSelectPeriod} from '@config/typicalsA8000';
import {configRoles} from '@config/configAuth';

function PanelGraph(props) {
	const dispatch = useDispatch();
	const status = useSelector(({A8000}) => A8000.status);
	const auth = useSelector(({auth}) => auth);
	const [series, setSeries] = useState();
	const [options, setOptions] = useState();
	const [isCancelled, setIsCancelled] = useState(true);
	const [updatedAt, setUpdatedAt] = useState(0);
	const [refresh, setRefresh] = useState(true);

	const getApiArchive = useCallback(async () => {
		const toTime = moment().valueOf();
		if (toTime - updatedAt >= status.updateData * 1000 || refresh) {
			let fromTime = toTime;
			if (status.graphPeriod !== 0) {
				fromTime = moment().subtract(status.graphPeriod, 'hours').valueOf();
			}
			let seriesData = [];
			await Promise.all(
				props.graphData.map(async (item, idItem) => {
					const dataApi = await dispatch(getArchiveByTopic(props.topicId + item.topic, fromTime, toTime));
					const newData = {name: item.name, data: dataApi};
					seriesData[idItem] = newData;
				}),
			);
			setRefresh(false);
			setUpdatedAt(toTime);
			setSeries(seriesData);
			setOptions({xaxis: {min: fromTime, max: toTime}});
			if (!isCancelled) return seriesData;
		}
	}, [updatedAt, refresh, status, props, isCancelled, dispatch]);

	useEffect(() => {
		setIsCancelled(false);
		if (props.isVisible) getApiArchive().then();
		return () => {
			setIsCancelled(true);
		};
	}, [getApiArchive, props.isVisible]);

	const graphData = useMemo(() => {
		return GraphModel({series: series, options: options});
	}, [options, series]);

	const handleRefresh = useCallback(() => {
		setRefresh(true);
	}, []);

	const handlePeriod = useCallback(
		(e) => {
			dispatch(setPeriod(e.target.value));
			setRefresh(true);
			dispatch(getMqttStates());
		},
		[dispatch],
	);

	return (
		<>
			{graphData.series !== [] && (
				<div className='w-full'>
					<ReactApexChart
						options={graphData.options}
						series={graphData.series}
						type={graphData.options.chart.type}
						height={graphData.options.chart.height}
					/>
				</div>
			)}
			<div className='flex flex-wrap justify-between w-full px-8'>
				{_.intersection(configRoles['operator'], auth.roles).length > 0 && (
					<div className='flex flex-wrap justify-start'>
						<FormControl variant='standard' className='w-full' sx={{m: 1, minWidth: 200}}>
							<InputLabel id='selectPeriod-label'>
								<Trans i18nKey='uppercase.period'>PERIOD </Trans>
							</InputLabel>
							<Select
								labelId='selectPeriod-label'
								id='selectPeriod'
								value={status.graphPeriod}
								onChange={handlePeriod}
								label='Period'>
								{typicalsSelectPeriod.map((item) => (
									<MenuItem key={item.id} value={item.value}>
										<Trans i18nKey={item.translate}>{item.name} </Trans>
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</div>
				)}
				<WidgetFooter updatedAt={updatedAt} onRefresh={handleRefresh} />
			</div>
		</>
	);
}

export default memo(PanelGraph);
