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

import {memo, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {cloneDeep} from 'lodash-es';
import Button from '@material-tailwind/react/Button';
import {Tooltip} from '@mui/material';
import {Upload as IconUpload, Download as IconDownload, Refresh as IconRefresh} from '@mui/icons-material';
import ModalAddFolder from '../modal/ModalAddFolder';
import ModalDelete from '../modal/ModalDelete';
import {fileList, fileDelete, fileDownload, fileUpload, fileMkDir} from '@A8000/store/A8000/fileSlice';
import {Trans} from 'react-i18next';

function FileList(props) {
	const dispatch = useDispatch();
	const hiddenFileInput = useRef(null);
	const listDir = useSelector(({A8000}) => A8000.file);
	const [folder, setFolder] = useState([]);

	function handleFolderIn(item) {
		const newFolder = cloneDeep(folder);
		newFolder.push(item + '/');
		setFolder(newFolder);
	}

	function handleFolderOut() {
		const newFolder = cloneDeep(folder);
		newFolder.splice(folder.length - 1, 1);
		setFolder(newFolder);
	}

	const handleUploadButton = (event) => {
		hiddenFileInput.current.click();
	};

	const handleUpload = (event) => {
		dispatch(fileUpload(folder.join(''), event.target.files[0]));
	};

	function handleRemove(id) {
		dispatch(fileDelete(id));
	}

	function handleAddFolder(id) {
		dispatch(fileMkDir(folder.join('') + id));
	}

	function handleRemoveFolder(id) {
		handleFolderOut();
		dispatch(fileDelete(id));
	}

	if (listDir.state === null) {
		return (
			<div className='overflow-x-auto mb-5'>
				<table className='items-center w-full bg-transparent border-collapse'>
					<thead>
						<tr>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-2 text-sm whitespace-nowrap font-bold text-left w-4/5'>
								/persist_data/{folder.length > 0 && folder.join('')}
							</th>
							<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-2 text-sm whitespace-nowrap font-bold text-left w-1/5'>
								<div className='flex justify-start'>
									<Tooltip title={<Trans i18nKey='uppercase.refresh'>REFRESH</Trans>}>
										<Button
											onClick={(e) => dispatch(fileList())}
											color='green'
											buttonType='link'
											size='sm'
											rounded={false}
											block={true}
											iconOnly
											ripple='dark'>
											<IconRefresh />
										</Button>
									</Tooltip>
								</div>
							</th>
						</tr>
					</thead>
					<tbody></tbody>
				</table>
			</div>
		);
	}
	return (
		<div className='overflow-x-auto mb-5'>
			<table className='items-center w-full bg-transparent border-collapse'>
				<thead>
					<tr>
						<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-2 text-sm whitespace-nowrap font-bold text-left w-4/5'>
							/persist_data/{folder.length > 0 && folder.join('')}
						</th>
						<th className='px-2 text-purple-500 align-middle border-b border-solid border-gray-200 py-2 text-sm whitespace-nowrap font-bold text-left w-1/5'>
							<div className='flex justify-start'>
								<Tooltip title={<Trans i18nKey='uppercase.upload'>UPLOAD</Trans>}>
									<Button
										type='file'
										onClick={handleUploadButton}
										color='blue'
										buttonType='link'
										size='sm'
										rounded={false}
										block={true}
										iconOnly
										ripple='dark'>
										<IconUpload />
									</Button>
								</Tooltip>
								<input type='file' hidden ref={hiddenFileInput} onChange={handleUpload} />
								<Tooltip title={<Trans i18nKey='uppercase.refresh'>REFRESH</Trans>}>
									<Button
										onClick={(e) => dispatch(fileList())}
										color='green'
										buttonType='link'
										size='sm'
										rounded={false}
										block={true}
										iconOnly
										ripple='dark'>
										<IconRefresh />
									</Button>
								</Tooltip>
								<ModalAddFolder onClick={handleAddFolder} />
								{folder.length > 0 && (
									<ModalDelete
										id={folder.join('')}
										translate='button.deleteFolder'
										iconOnly
										onClick={handleRemoveFolder}
									/>
								)}
							</div>
						</th>
					</tr>
				</thead>
				<tbody>
					{folder.length > 0 && (
						<>
							<tr>
								<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
									<Button
										onClick={handleFolderOut}
										style={{justifyContent: 'flex-start'}}
										color='blue'
										buttonType='link'
										size='sm'
										rounded={false}
										block={false}
										iconOnly={false}>
										[..]
									</Button>
								</th>
								<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'></th>
							</tr>
						</>
					)}
					{listDir.map((item) => {
						const redItem = item.replace(folder.join(''), '');
						const splitItem = redItem.split('/');
						if (!item.startsWith(folder.join('')) || splitItem.length > 1) {
							return null;
						}
						return (
							<tr key={item}>
								{item.indexOf('.') === -1 && (
									<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
										<Button
											onClick={(e) => handleFolderIn(redItem)}
											style={{justifyContent: 'flex-start', textTransform: 'none'}}
											color='blue'
											buttonType='link'
											size='sm'
											rounded={false}
											block={false}
											iconOnly={false}>
											{redItem}
										</Button>
									</th>
								)}
								<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
									{item.indexOf('.') > -1 && <> {redItem} </>}
								</th>
								<th className='border-b border-gray-200 align-middle font-light text-sm whitespace-nowrap px-2 py-1 text-left'>
									{item.indexOf('.') > -1 && (
										<div className='flex justify-start'>
											<Tooltip title={<Trans i18nKey='uppercase.download'>DOWNLOAD</Trans>}>
												<Button
													onClick={(e) => dispatch(fileDownload(folder.join(''), redItem))}
													color='blue'
													buttonType='link'
													size='sm'
													rounded={false}
													block={true}
													iconOnly
													ripple='dark'>
													<IconDownload />
												</Button>
											</Tooltip>
											<ModalDelete id={item} translate='uppercase.delete' iconOnly onClick={handleRemove} />
										</div>
									)}
								</th>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

export default memo(FileList);
