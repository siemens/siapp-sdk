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
import ModalDelete from '@A8000/components/modal/ModalDelete';
import ModalTopicsMqtt from '@A8000/components/modal/ModalTopicsMqtt';
import {Trans} from 'react-i18next';

function TableTopicsMqtt(props) {
	function handleRemove(id) {
		props.onRemove(id);
	}

	function handleEdit(data, id) {
		props.onChange(data, id);
	}

	function handleAdd(data) {
		props.onAdd(data);
	}

	if (!props.data) {
		return null;
	}
	return (
		<>
			<div className='overflow-x-auto mb-5'>
				<table className='items-center w-full bg-transparent border-collapse'>
					<thead>
						<tr>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.topic'>TOPIC </Trans>
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-3 text-sm whitespace-nowrap font-bold text-left'>
								<Trans i18nKey='uppercase.value'>VALUE </Trans>
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
						{props.data.map((item, id) => (
							<tr key={item.topic}>
								<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-4 text-left'>
									{item.topic}
								</th>
								<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-4 text-left'>
									{item.message.value}
								</th>
								<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-4 text-left'>
									{item.message.dataType.toUpperCase()}
								</th>
								<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-4 text-left flex flex-wrap justify-start'>
									<ModalTopicsMqtt id={id} mode='UPDATE' data={item} iconOnly={true} onClick={handleEdit} />
									<ModalDelete id={id} translate='button.deleteTopic' iconOnly onClick={handleRemove} />
								</th>
							</tr>
						))}
					</tbody>
				</table>
				<ModalTopicsMqtt mode='ADD' iconOnly={false} onClick={handleAdd} />
			</div>
		</>
	);
}

export default memo(TableTopicsMqtt);
