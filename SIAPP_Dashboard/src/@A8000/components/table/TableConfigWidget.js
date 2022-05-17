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
import ModalWidget from '@A8000/components/modal/ModalWidget';
import ModalDelete from '../modal/ModalDelete';

function TableConfigWidget(props) {
	function handleRemove(id) {
		props.onRemove(id);
	}

	function handleChangeWidget(model) {
		props.onChange(props.id, model);
	}

	if (!props.dataConfig) {
		return null;
	}

	return (
		<>
			<div className='mx-auto flex flex-wrap justify-center w-full'>
				<div className='flex flex-wrap mx-auto item-center justify-center text-center w-full'>
					<div className='w-full p-2'>
						<ModalWidget mode='UPDATE' data={props.dataConfig} onClick={handleChangeWidget} />
					</div>
					<div className='w-full p-2'>
						{props.id !== undefined && props.id !== '' && (
							<ModalDelete id={props.id} translate='button.deleteWidget' onClick={handleRemove} />
						)}
					</div>
				</div>
			</div>
		</>
	);
}

export default memo(TableConfigWidget);
