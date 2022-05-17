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

import {useDispatch, useSelector} from 'react-redux';
import Button from '@material-tailwind/react/Button';
import {Refresh as IconRefresh} from '@mui/icons-material';
import {reloadOcpp} from '../store/ocppStatusSlice';
import {memo} from 'react';
import {Trans} from 'react-i18next';

function OcppReset(props) {
	const dispatch = useDispatch();
	const ocppMeta = useSelector(({ocpp}) => ocpp.configOcpp.meta);

	function handleOcppReset() {
		setTimeout(() => {
			dispatch(reloadOcpp());
		}, 1000);
	}

	if (!ocppMeta || (props.mode !== 'static' && ocppMeta.loaded)) {
		return null;
	}
	return (
		<>
			<div className='flex flex-col justify-center w-full m-1'>
				<Button
					onClick={() => {
						handleOcppReset();
					}}
					color={props.mode === 'static' ? 'green' : 'red'}
					buttonType='outline'
					size='regular'
					rounded={false}
					block={false}
					iconOnly={false}
					ripple='dark'>
					<IconRefresh />
					<Trans i18nKey='button.resetOcpp'>RESET OCPP </Trans>
				</Button>
			</div>
		</>
	);
}

export default memo(OcppReset);
