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

import {saveA8000} from '@config/configInit';
import Button from '@material-tailwind/react/Button';
import {Save as IconSave} from '@mui/icons-material';
import {memo, useEffect, useState} from 'react';
import {Trans} from 'react-i18next';
import {useDispatch} from 'react-redux';
import {useSelector} from 'react-redux';

function SaveButton(props) {
	const dispatch = useDispatch();
	const status = useSelector(({A8000}) => A8000.status);

	const [showStatus, setShowStatus] = useState(false);

	useEffect(() => {
		if (status !== undefined && status.save !== undefined && status.save.length > 0) {
			setShowStatus(true);
		} else {
			setShowStatus(false);
		}
	}, [status]);

	function handleSave() {
		dispatch(saveA8000());
	}
	return (
		<>
			{showStatus && (
				<div className='flex flex-col justify-center w-full m-1'>
					<Button
						onClick={() => {
							handleSave();
						}}
						color='red'
						buttonType='outline'
						size='regular'
						rounded={false}
						block={false}
						iconOnly={false}
						ripple='dark'>
						<IconSave />
						<Trans i18nKey='button.saveAll'>SAVE ALL</Trans>
					</Button>
				</div>
			)}
		</>
	);
}

export default memo(SaveButton);
