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

import {memo} from 'react';
import _ from '@lodash';
import {Trans} from 'react-i18next';
import WidgetFooter from '../layout/WidgetFooter';
import {useSelector} from 'react-redux';

function TableData(props) {
	const status = useSelector(({A8000}) => A8000.status);

	if (!props.graphMqtt && !props.dataMqtt) {
		return null;
	}
	return (
		<>
			<div className='overflow-x-auto mb-5'>
				<table className='items-center w-full bg-transparent border-collapse'>
					<thead>
						<tr>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.name'>NAME </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.topic'>TOPIC </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.value'>VALUE </Trans>
							</th>
						</tr>
					</thead>
					<tbody>
						{props.graphMqtt.graph
							.filter((topic) => topic.group === props.group && topic.type === 'data')
							.sort((a, b) => (a.sort > b.sort ? 1 : -1))
							.map((item) => (
								<tr key={item.topic}>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-4 text-left'>
										{item.name}
									</th>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-4 text-left'>
										{props.id + item.topic}
									</th>
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-4 text-left'>
										{_.find(props.dataMqtt, {id: item.topic}) !== undefined &&
											_.find(props.dataMqtt, {id: item.topic}).value}
									</th>
								</tr>
							))}
					</tbody>
				</table>
				<div className='flex flex-wrap justify-end w-full px-8'>
					<WidgetFooter updatedAt={status.updatedAt} />
				</div>
			</div>
		</>
	);
}

export default memo(TableData);
