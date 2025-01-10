SIAPP SDK EdgeDataApi
===============

Similar to the C-based [EDGEDATAAPI](./EDGEDATAAPI.md) this demo project shows how to interact with Python 3 via ctypes.

Table of Contents
----------------
 - [Python based EdgeDataApi](#python-based-edgedataapi)
 - [Code Snippets](#code-snippets)


Python based EdgeDataApi
===============
The EdgeDataApi for Python is a wrapper based on the C-based API and contains a single C++ source file (edgedata.cpp) and several include files. 
An example of how to create the shared object for the Python C wrapper module can be found in [DemoPy/Dockerfile](./Dockerfile).

**Connect/Re-connect**

The `connect()` function establishes a connection to the edge data source.
		
```PY
import edgedataapi

if edgedataapi.connect():
   ...
```


**Disconnect**

The `disconnect()` function disconnects from the edge data source.
```PY
import edgedataapi

if edgedataapi.connect():
   ...
   edgedataapi.disconnect()
```

**Discover**

The discover mechanism returns the current information about all available data points as topic names to the target application. This way, configured signals can be read out without knowing the exact names.
```PY
import edgedataapi

   ...
   discover_info = edgedataapi.discover()
   for topic in discover_info["read"]:
      print(f"Discovered Read Topic: {topic}")

   for topic in discover_info["write"]:
      print(f"Discovered Write Topic: {topic}")
```


**Get Data by Topic**

The `read()` function reads data from the edge data source. The input parameter is the target topic of the data object. If you do not call `sync_read()`, the data object will not be updated from the backend.

```PY
import edgedataapi
   ...
   if not edgedataapi.sync_read():
      print("Sync read failed")
      edgedataapi.disconnect()
      exit(-2)
   dataobject = edgedataapi.read("read01")
   print(dataobject)
   # {'topic': 'read01', 'value': 0, 'handle': 1, 'type': 'int32', 'quality': ['NOT_TOPICAL'], 'timestamp': 1724313995978099000}
```


**Write Data by Topic**

The `write()` function writes data to the edge data backend. The input parameters are the target topic of the data object, the data value, the quality and the time of data change. If you do not call `sync_write()`, the data object will not be synchronized to the backend.

```PY
import edgedataapi
   ...
   if not edgedataapi.write(topic, value, ["VALID_VALUE"], int(time.time_ns())):
       print("Write failed")
   if not edgedataapi.sync_write():
      print("Sync write failed")
      edgedataapi.disconnect()
      exit(-2)

   if not edgedataapi.write(topic, value, ["FLAG_OVERFLOW", "TEST"], int(time.time_ns())):
```

At least the topic and the value or the topic with a quality indicator must be written. Other input parameters are optional. If the time is not set, the current time is used instead.

Possible quality flags:
| Quality        | Detail Description |
| ------------- | ------------- | 
| VALID_VALUE        | if valid no other flag should be used |
| FLAG_OVERFLOW      | value is out of range |
| NOT_TOPICAL        | no valid data source |
| OPERATOR_BLOCKED   | value is blocked |
| SUBSITUTED         | value is subsituted |
| TEST         | value is in test mode |
| INVALID         | value is invalid |

**Synchronize data from/to backend (Read/Write)**

The `sync_write()` function writes all previously written data objects synchronously to the edge data. 
In contrast, `sync_read()` synchronizes all available input data to the edge data.

**Subscribe for a change**

The `edgecallbacks` class provides callback functions for handling edge data events.

```PY
import edgedataapi
   ...
class usercallback(edgecallbacks):
    def cb_edge_data_subscribe(self, event):
        print(f"User Event Notification: {event}")
        # User Event Notification: {'topic': 'read01', 'value': 10, 'handle': 1, 'type': 'int32', 'quality': ['NOT_TOPICAL', 'SUBSITUTED', 'TEST'], 'timestamp': 1724314000086430000}

callback = usercallback()

```



**Register Logging**

Register a logger callback function for debugging purposes.
```PY
import edgedataapi
   ...
class usercallback(edgecallbacks):
    def cb_edge_data_logger(self, text):
        print(f"User Logger: {text}")
        # User Logger: Try to disconnect

callback = usercallback()

```



Code Snippets
===============

**Simple Test Program accessable via SSH "/run.py"**

[DemoPy/src/run.py](./DemoPy/src/run.py)

**Helper to convert the C-based EDGEDATAAPI to Python via `ctypes`.**
[DemoPy/src/edgedataapi.py](./DemoPy/src/edgedataapi)

