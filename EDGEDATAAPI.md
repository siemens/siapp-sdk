SIAPP SDK EdgeDataApi
===============

This page contains the description and usage of the “EdgeDataApi”, which allows a SIAPP to access different SICAM RTUs signals. Such a signal can be based on Hardware PINs of connected IO modules or assigned protocols.
The following chapters explain the usage of this interface.

Table of Contents
----------------
 - [C based EdgeDataApi](#c-based-edgedataapi)
 - [Code Snippets](#code-snippets)


C based EdgeDataApi
===============
The EdgeDataApi directory includes a single C++ Source File (edgedata.cpp) and several include files, which should be compiled and linked against a SIAPP. 
The full application interface can be found in [edgedataapi/include/edgedata.h](./edgedataapi/include/edgedata.h)

**Connect/Re-connect**

By calling `edge_data_connect()`, the application tries to establish or re-establish a connection to the data backend. In the case of re-connect: All memory pointers, previously returned by the API, become invalid!
		
| E_EDGE_DATA_RETVAL        | Detail Description |
| ------------- | ------------- | 
| E_EDGE_DATA_RETVAL_OK      | Connection established/re-established to backend |
| E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY      | Connection established/re-established to backend |

**Disconnect**

The function `edge_data_disconnect()` can be used to shutdown the communication to the backend.

| E_EDGE_DATA_RETVAL        | Detail Description |
| ------------- | ------------- | 
| E_EDGE_DATA_RETVAL_OK      | Connection successfully shutdown |

**Discover**

The Discover mechanism returns the current information about all assigned data points to the target application instance. This can be used to read out configured signals without knowing the exact name.  

```C
const T_EDGE_DATA_LIST *edge_data_discover()
```

The return value contains the list of read and writes data access handles. For more details, see examples below.

**Access Handle by Name**

In contrast to the Discover mechanism, a data access handle can be requested by a readable or writeable topic with:

```C
T_EDGE_DATA_HANDLE edge_data_get_readable_handle(const char *topic);
```
```C
T_EDGE_DATA_HANDLE edge_data_get_writeable_handle(const char *topic);
```

For unknown topics the function returns the value 0, which means no signal with the target topic is assigned to the current application instance.

**Access data pointer**

The function `edge_data_get_data()` can be used to access assigned read or write values. The return values give access to the `T_EDGE_DATA` data pointer based on access handles. As long as no Re-Connect or Disconnect is forced, the same memory pointer will be returned for a target handle. 

The `T_EDGE_DATA` struct contains the description (`topic`, `handle`, `type`, `source`) and the current process data information (`quality`, `value`, `timestamp64`). Process data could be manipulated if the source field flag is set to `EDGE_SOURCE_FLAG_WRITE`. Otherwise (if source field is set to `EDGE_SOURCE_FLAG_READ`) the process data should be read only.

```C
/* Full Edge Data Value */
typedef struct {
   const char                    *topic;        /* value name    */
   uint32_t                      handle;        /* value handle  */
   E_EDGE_DATA_TYPE              type;          /* value type    */
   uint32_t                      quality;       /* see EDGE_QUALITY_FLAG_ ... for details */
   T_EDGE_DATA_VALUE             value;         /* value         */
   int64_t                       timestamp64;   /* timestamp     */
} T_EDGE_DATA;
```

When `edge_data_sync_read()` or `edge_data_sync_write()` are be used, the content of the pointer is being synchronized with the backend and should not be touched concurrently.

**Synchronize data from backend (Read)**

Update a list of handles which are assigned as read values from the backend.
```C
E_EDGE_DATA_RETVAL edge_data_sync_read (T_EDGE_DATA_HANDLE *read_handle_list, uint32_t read_handle_list_len);
```
| E_EDGE_DATA_RETVAL        | Detail Description |
| ------------- | ------------- | 
| E_EDGE_DATA_RETVAL_OK      | Synchronization was successfully |
| E_EDGE_DATA_RETVAL_UNKNOWN_HANDLE | At least one handle in the list is invalid |
| E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY | Connection aborted |
| E_EDGE_DATA_RETVAL_NOK | Invalid argument |

**Synchronize data from backend (Write)**

Synchronize a list of handles, which are assigned to write from the EdgeApp to the backend.
```C
E_EDGE_DATA_RETVAL edge_data_sync_write (T_EDGE_DATA_HANDLE *write_handle_list, uint32_t write_handle_list_len)
```
| E_EDGE_DATA_RETVAL        | Detail Description |
| ------------- | ------------- | 
| E_EDGE_DATA_RETVAL_OK      | Synchronization was successfully |
| E_EDGE_DATA_RETVAL_UNKNOWN_HANDLE | At least one handle in the list is invalid |
| E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY | Connection aborted |
| E_EDGE_DATA_RETVAL_NOK | Invalid argument |

**Subscribe for a change request**

Register a callback function for a change indication for a specific access handle. 
```C
E_EDGE_DATA_RETVAL edge_data_subscribe_event (uint32_t handle, cb_edge_data_subscribe cb);
```
| E_EDGE_DATA_RETVAL        | Detail Description |
| ------------- | ------------- | 
| E_EDGE_DATA_RETVAL_OK | Subscription was successfull |
| E_EDGE_DATA_RETVAL_UNKNOWN_HANDLE |Target handle is invalid |
| E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY | Connection aborted |
| E_EDGE_DATA_RETVAL_NOK | Invalid argument |

Be aware that the callback blocks the EdgeDataApi and should be processed quickly. For more complex tasks decouple the callback into a different task.
Also do not synchronize your data with `edge_data_sync_read()` or `edge_data_sync_write()` inside the registered callback. 

To unset an previously registered callback, reset the `cb_edge_data_subscribe`-callback with `NULL`.

**Register Logging**

Register a logger callback function for debugging purposes.
```C
E_EDGE_DATA_RETVAL edge_data_register_logger (cb_edge_data_logger cb);
```
| E_EDGE_DATA_RETVAL        | Detail Description |
| ------------- | ------------- | 
| E_EDGE_DATA_RETVAL_OK | Debug Callback registered successfully |


Code Snippets
===============

**Hello world program**

[CodeSnippets/src/hellosiapp.c](./CodeSnippets/src/hellosiapp.c)

**Read an input signal and mirror it to an output signal**

[CodeSnippets/src/simple_dido.c](./CodeSnippets/src/simple_dido.c)

**Subscribe for a change notification**

[CodeSnippets/src/subscribe.c](./CodeSnippets/src/subscribe.c)

**Use discover mechanism to detect all existings topics**

[CodeSnippets/src/discover.c](./CodeSnippets/src/discover.c)


