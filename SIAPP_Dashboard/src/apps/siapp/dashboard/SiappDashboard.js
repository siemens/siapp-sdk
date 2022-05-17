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
import {memo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import ModalWidget from '@A8000/components/modal/ModalWidget';
import {addMqttGraphWidget} from '@A8000/store/A8000/mqtt/mqttGraphSlice';
import WidgetGraph from './widgets/WidgetGraph';
import ModelConfigWidget from '@A8000/models/ModelConfigWidget';
import {configRoles} from '@config/configAuth';

function SiappDashboard() {
	const dispatch = useDispatch();
	const auth = useSelector(({auth}) => auth);
	const graphMqtt = useSelector(({A8000}) => A8000.mqtt.graphMqtt);
	const dataMqtt = useSelector(({A8000}) => A8000.mqtt.dataMqtt);

	function handleAddWidget(widget) {
		dispatch(addMqttGraphWidget(widget));
	}

	return (
		<div className='container mx-auto max-w-full -mt-8 grid grid-cols-1 px-4 mb-16'>
			<div className='flex items-stretch flex-wrap'>
				{graphMqtt.widgets &&
					graphMqtt.widgets.map((item) => (
						<div key={item.id} className='flex flex-col w-full px-2 mb-12'>
							<WidgetGraph
								color='lightBlue'
								dataConfig={ModelConfigWidget(item)}
								graphMqtt={graphMqtt}
								dataMqtt={dataMqtt}
							/>
						</div>
					))}
				{_.intersection(configRoles['admin'], auth.roles).length > 0 && (
					<ModalWidget mode='ADD' onClick={handleAddWidget} />
				)}
			</div>
		</div>
	);
}

export default memo(SiappDashboard);
