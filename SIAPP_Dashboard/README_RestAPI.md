---
title: RestAPI for SIAPP CORE
author: Stephan Willenig
affiliation: Siemens AG
date: 29.04.2022
---

<img src="https://new.siemens.com/etc.clientlibs/siemens-sites/components/content/header/clientlibs/resources/logo/siemens-logo-default.svg" height="25" align="right" />

# SIAPP CORE

`Version 3.3.6`
`Date 29.04.2022`

## Description

Siapp core provides a REST-API interface to handle other SIAPPs like OCPP, openADR and MQTT messages.
It can subscribe to MQTT topics and store these values to a database/archive. All stored values can be acessed with the REST-API.
The REST interface has also an file explorer implemented.

## Siemens signal format

### Signal format for the archive

This json format is necessary to store a signal in the database (archive). A MQTT message without that format will not be stored in the database.

```json
{
	"topic": "Station_2/Charger7/MittelwertSpannungUL-N",
	"timestamp": 1630669237179,
	"value": 76.882,
	"dataType": "Float",
	"state": "[]",
	"meta": {
		"name": "MittelwertSpannungUL-N",
		"unit": "V"
	}
}
```

### Signal format from siapp_core

If you read from the archive with the REST-API, you get this format back.
The keys `min_value` and `max_value` are created from the siapp_core to track also measurement peak
The `archive_timestamp` indicates the time of saving in the archive.

```json
{
	"topic": "Station_2/Charger7/MittelwertSpannungUL-N",
	"timestamp": 1630669237179,
	"value": 76.882,
	"min_value": 70.12,
	"max_value": 87.18,
	"dataType": "Float",
	"state": "[]",
	"meta": {
		"name": "MittelwertSpannungUL-N",
		"unit": "V",
		"archive_timestamp": 1630669270684
	}
}
```

# REST-API Commands

---

The REST-API is available at **http://ip-address:8088/api**

All requests answered as _json_ or as _csv_ format.

## Test

---

To test if the REST-API is working and a connection is possible.

### Test

The test can be a GET or a post request.

```http
POST/GET /api/test
Host: <IP>:8088
Content-Type: text/plain
```

**Return:**

```json
{
	"status": "ok",
	"message": "Siapp Core REST-API is working correct"
}
```

## Authentication

---

It is necessary to login and authenticate for access.
The _Basic Authentication_ returns a token with must be used for every request.
Accounts can be managed with the SICAM Device Manager.

### Basic Authentication

Use Basic Authentication: _Basic username:password_

Usage description from [wikipedia](https://en.wikipedia.org/wiki/Basic_access_authentication 'Basic_access_authentication') :

> The Authorization header field is constructed as follows:
>
> 1. The username and password are combined with a single colon (:). This means that the username itself cannot contain a colon.
> 2. The resulting string is encoded into an octet sequence. The character set to use for this encoding is by default unspecified, as long as it is compatible with US-ASCII, but the server may suggest use of UTF-8 by sending the charset parameter.
> 3. The resulting string is encoded using a variant of Base64 (+/ and with padding).
> 4. The authorization method and a space (e.g. "Basic ") is then prepended to the encoded string.
>    For example, if the browser uses Aladdin as the username and open sesame as the password, then the field's value is the Base64 encoding of Aladdin:open sesame, or QWxhZGRpbjpvcGVuIHNlc2FtZQ==. Then the Authorization header field will appear as:
>
> Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==

Get back the `access-token` & `access-role` in the json body and as cookie. It is possible to use this token only with the parameter key `access_token`. Or to use it only with the Cookie _Cookie: access_token=U1MnL1xZ..._
This token is necessary for all other requests.
It also shows the Role `access_role`, the other Roles 'roles', the API version `api_version` and the API building date `api_build_date`.

```http
POST /api/auth
Host: <IP>:8088
Authorization: Basic d2lraTpwZWRpYQ==
```

**Return:**

```json
{
	"access_role": "Installer",
	"access_token": "9nzgouYCEB6ttmwtnw9KDCVvNe57VQ/LqjT03AbUZhsDq6Vx",
	"api_build_date": "Jan 31 2022",
	"api_version": "3.2.4",
	"roles": ["Viewer", "Operator", "Engineer", "Installer"]
}
```

### Log out

To log out the current user. Reset token and user role access.

```http
POST /api/log_out
Host: <IP>:8088
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain

```

**Return:**

```json
{
	"status": "ok",
	"message": "User 'TestUser' logged out"
}
```

### Reset role access

Reset user role access to `Viewer` and dissable `Admin` functions.

```http
POST /api/access_viewer
Host: <IP>:8088
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain

```

**Return:**

```json
{
	"status": "ok",
	"message": "Role from 'TestUser' changed to 'Viewer'"
}
```

## File handling

---

Read (export) and write (import) files to change a configuration. Use the key parameter `filename` for the file-path and file-name.
Example for file: `/config/siapp_core_file.txt`
Example for path: `/config/directory`

### Import a file

Only with Admin access.

This command import (wirte) a file to the system. It can be used with the path `write_file` or `import_file`.

```http
POST /api/write_file or /api/import_file
Host: <IP>:8088
filename: <filename>
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain

<file content>
```

**Return:**

```json
{
	"status": "ok",
	"message": "file successfully written"
}
```

### Export a file

This command export (read) a file form the system. It can be used with the path `read_file` or `export_file`.
The `admin/` directory is locked for normal user. Only a admin user has access to this directory.

```http
POST /api/read_file or /api/export_file
Host: <IP>:8088
filename: <filename>
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

**Return:**

```http
<file content>
```

### List Directories as json

This command show all directories and files in the given path as json format (json array).
The `admin/` directory is locked for normal user. Only a admin user has access to this directory.

```http
POST /api/list_dir or /api/list_dir_json
Host: <IP>:8088
filename: <path>
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

**Return:**

```json
["dir_1", "dir_2", "dir_2/file.txt"]
```

### List Directories as csv

This command show all directories and files in the given path as csv format.
The `admin/` directory is locked for normal user. Only a admin user has access to this directory.

```http
POST /api/list_dir_csv
Host: <IP>:8088
filename: <path>
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

**Return:**

```text
dir_1
dir_2
dir_2/file.txt
```

### Create Directories

Only with Admin access.

This command create recursively all directories in the given path. Use the parameter `filename` for the path. The path must be relativ.
Example for path: `/config/directory`

```http
POST /api/create_dir or /api/mkdir
Host: <IP>:8088
filename: <path>
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

**Return:**

```json
{
	"status": "ok",
	"message": "Directroy 'persist_data/test/' successfully created"
}
```

### Delete Directories and Files

Only with Admin access.

This command delete recursively all directories and files in the given path. Use the parameter `filename` for the path and filename.
Example for file: `/config/siapp_core_file.txt`
Example for path: `/config/directory`

```http
POST /api/delete or /api/rm
Host: <IP>:8088
filename: <path>
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

**Return:**

```json
{
	"status": "ok",
	"message": "'persist_data/test/' (2 files) successfully deleted"
}
```

## Signal list

---

Signal lists have included all possible signals from the edgeAPI.
This signal list can be updated, reloaded and shown.

### Get read Signallist

Get the read signals as json format.

```http
POST /api/signallist_read
Host: <IP>:8088
access_token: NW5yNmItaT00Xl9QJVpzZ1hGMn1YaWgpRVJQNDNjRkg
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
```

**Return:**

```json
[{}, {}, {}]
```

### Get write Signallist

Get the write signals as json format.

```http
POST /api/signallist_write
Host: <IP>:8088
access_token: NW5yNmItaT00Xl9QJVpzZ1hGMn1YaWgpRVJQNDNjRkg
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
```

**Return:**

```json
[{}, {}, {}]
```

### Update read Signallist

Update the read signals.

```http
POST /api/update_signallist_read
Host: <IP>:8088
access_token: NW5yNmItaT00Xl9QJVpzZ1hGMn1YaWgpRVJQNDNjRkg
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
```

**Return:**

```json
{
	"status": "ok",
	"message": "read signal list up to date"
}
```

### Update write Signallist

Update the write signals.

```http
POST /api/update_signallist_write
Host: <IP>:8088
access_token: NW5yNmItaT00Xl9QJVpzZ1hGMn1YaWgpRVJQNDNjRkg
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
```

**Return:**

```json
{
	"status": "ok",
	"message": "write signal list up to date"
}
```

## MQTT

---

A MQTT broker is necessary. Signal messages are handled over MQTT.
A MQTT message can be published, topics can be subscribed and unsubscribed.

### Publish a message

It is possible to publish a MQTT message with this REST-API. To publish a MQTT message, the path `/mqtt_publish` is used.
The body must include a json object with two key values, `"topic"` & `"message"`. The key `"topic"` needs the MQTT topic as string value. The key `"message"` can contain any json format.
The json object can include the boolean key value `"retain"`, the MQTT message will be retained if true (field is optional).
The json object can include the integer key value `"qos"`, the quality of the MQTT message will be defined (field is optional). There are 3 options:

0. At most once (0)
1. At least once (1)
2. Exactly once (2).

The key values for `"qos"` and `"retain"` are optional. Default values for `"qos"` is `1` and `"retain"` is `false`.

In this example the format can be a json object or a json array with objects.
A status message is returned to indicate a successful publishing of the MQTT message.
This is a example request:

```http
POST /api/mqtt_publish
Host: <IP>:8088
access_token: Q1deXntyOjlsZjJXR2R6XW9yL3w4RT1wPiopMHRpITg=
Cookie: access_token=RGhJPkV4Lnd5LiwwelQnPkRaLT5tQSFNZFZ8SWpsey8=
Content-Type: application/json
```

json object:

```json
{
	"topic": "Station3/setpoint/imax",
	"retain": false,
	"qos": 1,
	"message": {
		"timestamp": 1650526077,
		"dataType": "Float",
		"value": 7.4,
		"state": [],
		"meta": {
			"name": "Station3/setpoint/imax",
			"unit": ""
		}
	}
}
```

json array:

```json
[
	{
		"topic": "Station3/setpoint/value",
		"retain": false,
		"qos": 1,
		"message": {
			"timestamp": 1650526077,
			"dataType": "Float",
			"value": 7.4,
			"state": [],
			"meta": {
				"name": "Station3/setpoint/value",
				"unit": ""
			}
		}
	},
	{
		"topic": "Station3/mesasurement/value",
		"retain": true,
		"qos": 0,
		"message": "Testmessage 2"
	}
]
```

**Return:**

```json
{
	"status": "ok"
}
```

### Subscribe a MQTT Topic

To subscribe the MQTT client (siapp_core) to a topic.
The body must include a json object with the key value `"topic"`. The key `"topic"` needs to be a string value.
The json object can include the integer key value `"qos"`, the quality of the MQTT message will be defined (field is optional).
To subscirbe more topics at once, an json array with objects can be used.

```http
POST /api/mqtt_subscribe_topic
Host: <IP>:8088
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: application/json
```

json object:

```json
{
	"topic": "Station7/Ladesäule1/data/imax",
	"qos": 1
}
```

json array:

```json
[
	{
		"topic": "Station7/Ladesäule1/data/imax",
		"qos": 1
	},
	{
		"topic": "Station2/Ladesäule3/data/imax",
		"qos": 1
	},
	{
		"topic": "Station1/data/#",
		"qos": 0
	}
]
```

**Return:**

```json
{
	"status": "ok",
	"message": "MQTT topic subscribed"
}
```

### Unsubscribe a MQTT Topic

To unsubscribe the MQTT client (siapp_core) to a topic.
The body must include a json object with the key value `"topic"`. The key `"topic"` needs to be a string value.
To unsubscirbe more topics at once, an json array with objects can be used.

```http
POST /api/mqtt_unsubscribe_topic
Host: <IP>:8088
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: application/json
```

json object:

```json
{
	"topic": "Station7/Ladesäule1/data/imax"
}
```

json array:

```json
[
	{
		"topic": "Station7/Ladesäule1/data/imax",
		"qos": 1
	},
	{
		"topic": "Station2/Ladesäule3/data/imax",
		"qos": 1
	},
	{
		"topic": "Station1/data/#",
		"qos": 0
	}
]
```

**Return:**

```json
{
	"status": "ok",
	"message": "MQTT topic unsubscribed"
}
```

### List all subscribed MQTT Topics as json

```http
POST /api/mqtt_list_topics or /api/mqtt_list_topics_json
Host: <IP>:8088
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

**Return:**

```json
["cmdRead/edgeapi/#", "cmdRead/#", "cmdWrite/siapp_core/#", "Testsignal/#", "Testsignal/Ladesäule1/i_max"]
```

### List all subscribed MQTT Topics as csv

```http
POST /api/mqtt_list_topics_csv
Host: <IP>:8088
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

**Return:**

```text
cmdRead/edgeapi/#
cmdWrite/siapp_core/#
Diagnostic/#
Testsignal/#
Testsignal/Ladesäule1/i_max
...
```

### List all current MQTT messages as json

Create a json array with all current mqtt states. A message hat the json key `topic` and `message`.

```http
POST /api/mqtt_current_states or /api/mqtt_current_states_json
Host: <IP>:8088
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

**Return:**

```json
[
	{
		"topic": "Testtopic/station1",
		"message": "Test1"
	},
	{
		"topic": "Testtopic/station2",
		"message": "Test2"
	}
]
```

### List all current MQTT messages as csv

Create a json array with all current mqtt states.

```http
POST /api/mqtt_current_states_csv
Host: <IP>:8088
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

**Return:**

```csv
topic, message
Testsignal/Ladesäule1/imax, {"dataType":"Float","meta":{"name":"Siapp Testvalue","unit":"kW"},"state":"","timestamp":1638438976000,"value":892245.6875}
Testsignal/Ladesäule2/umax, {"dataType":"Float","meta":{"name":"Siapp Testvalue","unit":"kW"},"state":"","timestamp":1638438976000,"value":892245.6875}
```

### MQTT predefined json list

This list defines the MQTT signals to be subscribed and the MQTT signals to be published when the software is started.
The filename must be `mqtt_ulist.json` and can be found in the path `configuration/mqtt_ulist.json`. The format must be a json object which includes the keys `"subscribeMQTT"` and `"publishMQTT"`.

To subscribe to a topic, the key `"topic"` (string) is necessary. The key `"qos"` (int) is optional and default `1` if not specified.

To publish a MQTT message, the keys `"topic"` (string) and `"message"` are necessary. `"message"` can be any json type.
The keys `"qos"` (int) and `"retain"` (bool) are optional. Default values for `"qos"` is `1` and `"retain"` is `false`.

This is an example of the predefined json list:

#### Exmaple of mqtt_ulist.json

```json
{
	"subscribeMQTT": [
		{
			"topic": "Testsignal_1/mqtt/...",
			"qos": 1
		},
		{
			"topic": "Testsignal_2/mqtt/...",
			"qos": 2
		}
	],
	"publishMQTT": [
		{
			"topic": "Testsignal_1/mqtt/...",
			"retain": true,
			"qos": 2,
			"message": "This is a test message"
		},
		{
			"topic": "Testsignal_2/mqtt/...",
			"retain": false,
			"qos": 1,
			"message": "This is an other test message"
		}
	]
}
```

#### Publish the MQTT topics in json list

This command publishes the predefined MQTT json list. This list will be published at the startup of the software and alos with this trigger.

```http
POST /api/mqtt_publish_ulist
Host: <IP>:8088
access_token: Q1deXntyOjlsZjJXR2R6XW9yL3w4RT1wPiopMHRpITg=
Cookie: access_token=RGhJPkV4Lnd5LiwwelQnPkRaLT5tQSFNZFZ8SWpsey8=
Content-Type: text/plain
```

**Return:**

```json
{
	"status": "ok",
	"message": "published the MQTT topics from user list"
}
```

## Signal to RTU

This command publishes one or more signals to the RTU. It is using the edge_data_api and the edge_wrapper.

```http
POST /api/signals_to_rtu
Host: <IP>:8088
access_token: Q1deXntyOjlsZjJXR2R6XW9yL3w4RT1wPiopMHRpITg=
Cookie: access_token=RGhJPkV4Lnd5LiwwelQnPkRaLT5tQSFNZFZ8SWpsey8=
Content-Type: text/plain
```

json object:

```json
{
	"topic": "out/siapp_test",
	"value": 7.4
}
```

json array:

```json
[
	{
		"topic": "out/siapp_test",
		"value": 7.4
	},
	{
		"topic": "out/set_modbus_signal",
		"value": 85
	}
]
```

**Return:**

```json
{
	"status": "ok",
	"message": "RTU signals published"
}
```

## Database and Archive

---

All subscribed topics from the MQTT client are stored in the database if they have the [siemens SYS-format](#Siemens-signal-format).
Messages can be selected from the archive as a json or as csv format.

### Get signal entries with variable filter as json

This request get the filtered entries from the archive. The filter can be `"topic"` and a timespawn with `"from"` & `"to"`.
If the json field is not available, the filter is inactive. The body must include a json object.
The timestamp (from, to) filters the `archite_timestamp` (ms - milliseconds) and not the timestamp fron the signal itself. The standard archive insert repeats in 1min periods.
To get different signals at once, a json array can be used.

```http
POST /api/signals or /api/signals_json
Host: <IP>:8088
access_token: cn08LSRDNGFUVF1uNSAqVng2PydATkxga3s2ajNsJiY=
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: application/json
```

json object:

```json
{
	"topic": "Station7/Ladesäule1/data/vmax",
	"from": 1617010163000,
	"to": 1617010452000
}
```

json array:

```json
[
	{
		"topic": "Station1/Ladesäule1/data/imax",
		"from": 1617010163000,
		"to": 1617010452000
	},
	{
		"topic": "Station1/Ladesäule2/data/energy",
		"from": 1617010163000,
		"to": 1617010452000
	},
	{
		"topic": "Station7/Ladesäule1/data/vmax",
		"from": 1617010163000,
		"to": 1617010452000
	}
]
```

**Return:**

```json
[
	{
		"topic": "Station7/Ladesäule1/data/vmax",
		"timestamp": "1617010163000",
		"dataType": "Float",
		"value": "40.0",
		"min_value": "38.2",
		"max_value": "43.8",
		"meta": {
			"name": "Siapp Testvalue",
			"unit": "kW",
			"archive_timestamp": 1630669270684
		},
		"state": "[]"
	}
]
```

### Get signal entries with variable filter as csv

This request get the filtered entries from the archive. The filter can be `"topic"` and a timespawn with `"from"` & `"to"`.
If the json field is not available, the filter is deactivated. The body must include a json object.

```http
POST /api/signals_csv
Host: <IP>:8088
access_token: cn08LSRDNGFUVF1uNSAqVng2PydATkxga3s2ajNsJiY=
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: application/json
```

```json
{
	"topic": "Station7/Ladesäule1/data/vmax",
	"from": 1617010163000,
	"to": 1617010452000
}
```

}

````
json array:
```json
[
    {
        "topic": "Station1/Ladesäule1/data/imax",
        "from": 1617010163000,
        "to": 1617010452000
    },
    {
        "topic": "Station1/Ladesäule2/data/energy",
        "from": 1617010163000,
        "to": 1617010452000
    },
    {
        "topic": "Station7/Ladesäule1/data/vmax",
        "from": 1617010163000,
        "to": 1617010452000
    }
]
````

**Return:**

```csv
topic, timestamp, value, min_value, max_value, dataType, state, name, unit, archive_timestamp
topic, timestamp, value, min_value, max_value, dataType, state, name, unit, archive_timestamp
topic, timestamp, value, min_value, max_value, dataType, state, name, unit, archive_timestamp
```

## Miscellaneous

---

Miscellaneous REST-API functions.

### Update the HTML Page

Only with Admin access.

This command update the html page. All files must be zipped. -> A **.zip** is nessecarry.

```http
POST /api/update_html
Host: <IP>:8088
access_token: U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
```

**Return:**

```http
status_code: 200

HTML successfully updated
```

```http
status_code: 500

HTML can not be updated
```

### Logged on user list as json

Get the list with all logged users. It shows the user name, ip, last login, role and time left in secondes.

```http
POST /api/user_list or /api/user_list_json
Host: <IP>:8088
access_token: cn08LSRDNGFUVF1uNSAqVng2PydATkxga3s2ajNsJiY=
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: application/json
```

```json
[
	{
		"ip": "127.0.0.1",
		"last login": "Fri Jan 28 14:23:10 2022\n",
		"name": "TestUser",
		"role": "Installer",
		"roles": ["Viewer", "Operator", "Engineer", "Installer"],
		"time left": 1000
	}
]
```

### Logged on user list as csv

Get the list with all logged users. It shows the user name, ip, last login, role and time left in secondes.

```http
POST /api/user_list_csv
Host: <IP>:8088
access_token: cn08LSRDNGFUVF1uNSAqVng2PydATkxga3s2ajNsJiY=
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

```csv
user name, ip, role, roles, time left, last login
TestUser, 127.0.0.1, Installer, Viewer/Operator/Engineer/Installer/, 1000.000000, Fri Jan 28 14:23:57 2022
```

### Statistic as json

Return the siapp statistic in a json object.

```http
POST /api/statistic or /api/statistic_json
Host: <IP>:8088
access_token: cn08LSRDNGFUVF1uNSAqVng2PydATkxga3s2ajNsJiY=
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: application/json
```

```json
{
	"MQTT messages": 5541,
	"MQTT messages / min": 2341.267605,
	"MQTT sub.topics": 43,
	"Signal messages": 5537,
	"Signals to archive": 287,
	"http requests": 6,
	"running time": 2
}
```

### Statistic

Return the siapp statistic.

```http
POST /api/statistic_csv
Host: <IP>:8088
access_token: cn08LSRDNGFUVF1uNSAqVng2PydATkxga3s2ajNsJiY=
Cookie: access_token=U1MnL1xZRXNlOWFRNCJjO2oneFYsI0pPKyZkUlxHbS0=
Content-Type: text/plain
```

```text
STATISTICS
┌───────────────────────┬───────────────────────────────┐
   running time [min]   │ 72
   MQTT sub. topics     │ 43
   MQTT messages        │ 165989
   MQTT messages / min  │ 2295.307675
   Signal messages      │ 8254
   Signals to archive   │ 8254
   http requests        │ 32
└───────────────────────┴───────────────────────────────┘
```

## Error and ok Messages

---

These messages are returned from the REST-API.

### Error messages

Error messages will be returned as json.

```json
{
	"status": "error",
	"message": "fault description"
}
```

### OK messages

Success messages will be returned as json.

```json
{
	"status": "ok",
	"message": "description"
}
```

# Info

---

## ChangeLog

| Version | Date       | Change                        | Description                                                                                                                 |
| ------- | ---------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 3.3.6   | 29.04.2022 | REST_API                      | Implemented .zip import/export                                                                                              |
| 3.3.5   | 22.04.2022 | siapp core                    | Implement REST->RTU signal push and debug deadlock                                                                          |
| 3.3.4   | 20.04.2022 | siapp core                    | Implement role user directory access                                                                                        |
| 3.3.3   | 12.04.2022 | siapp core                    | Debugging                                                                                                                   |
| 3.2.9   | 24.02.2022 | siapp core                    | Single instance call                                                                                                        |
| 3.2.8   | 22.02.2022 | homee                         | Homee implementation                                                                                                        |
| 3.2.5   | 03.02.2022 | user role management          | Debug log out and role access                                                                                               |
| 3.2.4   | 02.02.2022 | user role management, archive | implemented user log out and archive saves only signals with a valid timestamp. Added SIAPP name and version info by logon. |
| 3.2.3   | 28.01.2022 | user role management          | implemented user role management                                                                                            |
| 3.2.2   | 14.01.2022 | archive                       | Optimized and stable archive, README agenda linked                                                                          |
| 3.2.1   | 23.12.2021 | archive                       | Archive _continuouse_ or _by value change_ mode                                                                             |
| 3.2.0   | 15.12.2021 | archive                       | Archive filter with `archive_timestamp`                                                                                     |

## ToDo List

The **bold** is currently in development.

- [x] Archive implementation
- [x] Archive Test
- [x] Archive continuous mode
- [x] Implement list directory function
- [x] Implement user role management
- [x] Implement user role security
- [x] Implement json and csv reply
- [x] Implement AIT REST-API
- [x] Test AIT REST-API
- [x] Debug archive crash
- [x] Role Management
- [x] Implement REST Interface for CLUE
- [x] Implement role user directory access
- [x] Implement DeviceManager predefined values
- [x] persist_data .zip import/export
- [ ] **MQTT Test Dashboard**
- [ ] Implement firebase user for CLUE
- [ ] Live settings
- [ ] Implement HTTPS server & certificate management
- [ ] Implement HTTPS update management
- [ ] Clean up REST-API commands

## Developer

- [Stephan Willenig](mailto:stephan.willenig@siemens.com)
- [Lukas Binder](mailto:lukas.binder@siemens.com)

## [UP](#siapp-core)
