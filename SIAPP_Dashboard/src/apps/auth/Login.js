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

import {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Controller, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import serviceA8000 from '@A8000/utils/serviceA8000';
import * as yup from 'yup';
import _ from '@lodash';
import Card from '@material-tailwind/react/Card';
import CardHeader from '@material-tailwind/react/CardHeader';
import CardBody from '@material-tailwind/react/CardBody';
import CardFooter from '@material-tailwind/react/CardFooter';
import Button from '@material-tailwind/react/Button';
import Checkbox from '@material-tailwind/react/Checkbox';
import H5 from '@material-tailwind/react/Heading5';
import {InputLabel, MenuItem, FormControl, Select, TextField} from '@mui/material';
import {Trans, useTranslation} from 'react-i18next';
import i18next from 'i18next';
import {authLanguage} from '@A8000/store/authSlice';
import CookieConsent, {resetCookieConsentValue} from 'react-cookie-consent';
import {i18nResources} from '@config/configI18n';

const schema = yup.object().shape({
	username: yup.string().required('Please enter your username.'),
	password: yup.string().required('Please enter your password.'),
});

const defaultValues = {
	username: '',
	password: '',
};

export default function Login() {
	const dispatch = useDispatch();
	const auth = useSelector(({auth}) => auth);
	const {t} = useTranslation();
	const [cookieAccept, setCookieAccept] = useState(false);
	const {control, formState, reset, handleSubmit} = useForm({
		mode: 'onChange',
		defaultValues,
		resolver: yupResolver(schema),
	});

	const {isValid, dirtyFields, errors} = formState;
	const [showPassword, setShowPassword] = useState(false);

	useEffect(() => {
		if (localStorage.getItem('A8000cookieConsent') === null) {
			setCookieAccept(false);
			resetCookieConsentValue();
		} else {
			setCookieAccept(true);
		}
	}, []);

	function changeLng(event) {
		dispatch(authLanguage(event.target.value));
		if (event.target.value !== '') i18next.changeLanguage(event.target.value);
	}

	function onSubmit(model) {
		dispatch(serviceA8000.authA8000(model));
		reset(defaultValues);
	}

	function handleAccept() {
		localStorage.setItem('A8000cookieConsent', true);
		setCookieAccept(true);
	}

	return (
		<div className='px-3 md:px-8 -mt-8'>
			<CookieConsent
				buttonText='ACCEPT'
				buttonStyle={{
					background: 'green',
					color: 'white',
				}}
				onAccept={handleAccept}>
				This website use necessary cookies or similar application to connect SICAM A8000. Accept cookies for LOGIN!
			</CookieConsent>
			<div className='container mx-auto w-96'>
				<form onSubmit={handleSubmit(onSubmit)}>
					<Card>
						<CardHeader color='lightBlue'>
							<H5 color='white' style={{marginBottom: 0}}>
								<Trans i18nKey='uppercase.login'>LOGIN</Trans>
							</H5>
						</CardHeader>

						<CardBody>
							<div className='flex flex-col justify-center w-full'>
								<div className='mb-3'>
									<Controller
										name='username'
										control={control}
										render={({field}) => (
											<TextField
												{...field}
												autoFocus
												autoComplete='username'
												fullWidth
												type='text'
												size='small'
												label={<Trans i18nKey='uppercase.username'>USERNAME </Trans>}
												variant='outlined'
												error={!!errors.username}
												helperText={errors?.username?.message}
												disabled={cookieAccept !== true}
											/>
										)}
										required
									/>
								</div>
								<div className='mb-1'>
									<Controller
										name='password'
										control={control}
										render={({field}) => (
											<TextField
												{...field}
												fullWidth
												autoComplete='current-password'
												type={showPassword ? 'text' : 'password'}
												size='small'
												label={<Trans i18nKey='uppercase.password'>PASSWORD </Trans>}
												variant='outlined'
												error={!!errors.password}
												helperText={errors?.password?.message}
												disabled={cookieAccept !== true}
											/>
										)}
										required
									/>
								</div>
								<div className='flex justify-end bg-bb mt-1'>
									<Checkbox
										onClick={() => {
											setShowPassword(!showPassword);
										}}
										color='lightBlue'
										text={t('text.showPassword')}
										id='checkbox'
										disabled={cookieAccept !== true}
									/>
								</div>
							</div>
						</CardBody>
						<CardFooter>
							<div className='flex justify-center bg-bb'>
								{!_.isEmpty(dirtyFields) && isValid && cookieAccept && (
									<Button
										type='submit'
										color='lightBlue'
										buttonType='filled'
										size='lg'
										rounded={false}
										block={true}
										iconOnly={false}
										ripple='dark'>
										<Trans i18nKey='uppercase.login'>LOGIN</Trans>
									</Button>
								)}
							</div>
							<div className='flex flex-wrap justify-center pt-3'>
								<FormControl variant='standard' className='w-full' sx={{m: 1, minWidth: 200}}>
									<InputLabel id='language-label'>
										<Trans i18nKey='uppercase.language'>LANGUAGE </Trans>
									</InputLabel>
									<Select
										labelId='language-label'
										disabled={cookieAccept !== true}
										id='language'
										value={auth.lng}
										onChange={changeLng}
										label={<Trans i18nKey='uppercase.language'>LANGUAGE </Trans>}>
										{Object.keys(i18nResources).map((item) => (
											<MenuItem key={item} value={item}>
												{i18nResources[item].id}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</div>
						</CardFooter>
					</Card>
				</form>
			</div>
		</div>
	);
}
