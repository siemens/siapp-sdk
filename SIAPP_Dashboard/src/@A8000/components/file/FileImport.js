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

import {memo, useRef} from 'react';
import {useDispatch} from 'react-redux';
import Button from '@material-tailwind/react/Button';
import {Tooltip} from '@mui/material';
import {Upload as IconUpload} from '@mui/icons-material';
import {toast} from 'react-toastify';
import {optionsToast} from '@A8000/components/layout/AlertMessage';
import {fileUpload} from '@A8000/store/A8000/fileSlice';
import {Trans} from 'react-i18next';

function FileImport(props) {
	const dispatch = useDispatch();
	const hiddenFileInput = useRef(null);

	const handleUploadButton = () => {
		hiddenFileInput.current.click();
	};

	const handleUploadWeb = (event) => {
		if (event.target.files[0].name.startsWith('custom_web') && event.target.files[0].name.endsWith('.tar')) {
			dispatch(fileUpload('import/', event.target.files[0]));
		} else {
			toast.error(<Trans i18nKey='alert.errorWebUpload'>"Only 'custom_web*.tar' for web!"</Trans>, optionsToast);
			event.target.value = null;
		}
	};

	return (
		<div className='overflow-x-auto mb-5'>
			<div className='flex justify-start'>
				<Tooltip title={<Trans i18nKey='uppercase.upload'>UPLOAD</Trans>}>
					<Button
						type='file'
						onClick={handleUploadButton}
						color='blue'
						buttonType='outline'
						size='sm'
						rounded={false}
						block={true}
						iconOnly={false}
						ripple='dark'>
						<Trans i18nKey='uppercase.webUpload'>WEB UPLOAD</Trans>
						<IconUpload />
					</Button>
				</Tooltip>
				<input type='file' hidden ref={hiddenFileInput} accept='.tar' onChange={handleUploadWeb} />
			</div>
		</div>
	);
}

export default memo(FileImport);
