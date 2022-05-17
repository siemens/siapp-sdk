---
title: SIAPP Dashboard
author: Peter Stern
affiliation: Siemens AG
date: 02.05.2022
---

# SIAPP Dashboard

`Version 0.7.2`
`Date 02.05.2022`

## Description

SIAPP Dashboard is used as a frontend on a SIAPP of SICAM A8000 device.

Siapp core provides a REST-API interface to handle other SIAPPs like OCPP, openADR and MQTT messages.
It can subscribe to MQTT topics and store these values to a database/archive. All stored values can be acessed with the REST-API.
The REST interface has also an file explorer implemented.

You can either use the prebuild version (build directory) or adapt the template and use your own version.

## History

0.8.0

- mqttSim instead of ocppSim
- add path in FileExplorer
- delete timeout for requests
- support OPCUA-Server

  0.7.0

- First official Version

## BUILD-Version

1. import custom_web-\*.tar to persist_data/import
2. restart the SICAM A8000

## OWN-Version

1. npm install
2. npm run build
3. create tar custom_web-vX.X.X.tar in build directory
4. import custom_web-\*.tar to persist_data/import
5. restart the SICAM A8000

## SRC directory

@A8000 - A8000 library
@assets - assets library
@config - configuration files
@lodash - lodash library
apps - custom apps
