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
import {useDispatch, useSelector} from 'react-redux';
import withReducer from '@A8000/store/withReducer';
import reducer from './store';
import ModalAddStation from './components/ModalAddStation';
import {addStation} from './store/ocppConfigSlice';
import WidgetOcpp from './widgets/WidgetOcpp';
import WidgetStation from './widgets/WidgetStation';
import {configRoles} from '@config/configAuth';

function OcppDashboard() {
	const dispatch = useDispatch();
	const auth = useSelector(({auth}) => auth);
	const configOcpp = useSelector(({ocpp}) => ocpp.configOcpp);
	const ocppTypicals = useSelector(({ocpp}) => ocpp.typicalsOcpp);
	const graphMqtt = useSelector(({A8000}) => A8000.mqtt.graphMqtt);
	const dataMqtt = useSelector(({A8000}) => A8000.mqtt.dataMqtt);

	function handleAddStation(selectedType, csId) {
		dispatch(addStation(selectedType, csId));
	}

	if (configOcpp.state === null || configOcpp.config === undefined) {
		return null;
	}
	return (
		<div className='container mx-auto max-w-full -mt-8 grid grid-cols-1 px-4 mb-16'>
			<div className='flex items-stretch flex-wrap'>
				<div className='flex flex-col w-full px-2 mb-12'>
					<WidgetOcpp
						color='orange'
						dataConfig={configOcpp.config.generalOCPP}
						graphMqtt={graphMqtt}
						dataMqtt={dataMqtt}
					/>
				</div>
				{configOcpp.config.stationsOCPP.map((item, idItem) => (
					<div key={item.meta.id} className='flex flex-col w-full px-2 mb-12'>
						<WidgetStation color='lightBlue' id={idItem} dataConfig={item} graphMqtt={graphMqtt} dataMqtt={dataMqtt} />
					</div>
				))}
				{_.intersection(configRoles['admin'], auth.roles).length > 0 && ocppTypicals && (
					<ModalAddStation data={ocppTypicals.stationsOCPP} onClick={handleAddStation} />
				)}
			</div>
		</div>
	);
}

export default withReducer('ocpp', reducer)(OcppDashboard);
