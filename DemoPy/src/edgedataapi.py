'''
siapp-sdk

SPDX-License-Identifier: MIT
Copyright 2024 Siemens AG

Author:
Lukas Wimmer <lukas.wimmer@siemens.com>

'''

from ctypes import *
from enum import Enum
import time


c_lib = CDLL("./edgedata.so")


class E_EDGE_DATA_QUALITY(Enum):
    VALID_VALUE = 0,
    NOT_TOPICAL = 1,
    FLAG_OVERFLOW = 2,
    OPERATOR_BLOCKED = 4,
    SUBSITUTED = 8,
    TEST = 16,
    INVALID = 32


class E_EDGE_DATA_RETVAL(Enum):
    E_EDGE_DATA_RETVAL_OK = 0,
    E_EDGE_DATA_RETVAL_NOK = -1,
    E_EDGE_DATA_RETVAL_UNKNOWN_TOPIC = -2,
    E_EDGE_DATA_RETVAL_INVALID_VALUE = -3,
    E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY = -4,
    E_EDGE_DATA_RETVAL_UNKNOWN_HANDLE = -5


class E_EDGE_DATA_TYPE(c_int):
    UNKNOWN = 0,
    INT32 = 1,
    UINT32 = 2,
    INT64 = 3,
    UINT64 = 4,
    FLOAT32 = 5,
    DOUBLE64 = 6


class T_EDGE_DATA_VALUE(Union):
    _fields_ = [("int32", c_int32),
                ("uint32", c_uint32),
                ("int64", c_int64),
                ("uint64", c_uint64),
                ("float32", c_float),
                ("double64", c_double)]


class T_EDGE_DATA(Structure):
    _fields_ = [("topic", c_char_p),
                ("handle", c_uint32),
                ("type", E_EDGE_DATA_TYPE),
                ("quality", c_uint32),
                ("value", T_EDGE_DATA_VALUE),
                ("timestamp64", c_int64)]


T_EDGE_DATA_HANDLE = c_uint32


class T_EDGE_DATA_LIST(Structure):
    _fields_ = [("read_handle_list", POINTER(T_EDGE_DATA_HANDLE)),
                ("read_handle_list_len", c_uint32),
                ("write_handle_list", POINTER(T_EDGE_DATA_HANDLE)),
                ("write_handle_list_len", c_uint32)]   


def data2dict(data):
    topic = data.contents.topic.decode("utf-8")
    handle = data.contents.handle
    quality = []
    if int(data.contents.quality) == int(E_EDGE_DATA_QUALITY.VALID_VALUE.value[0]):
        quality.append(E_EDGE_DATA_QUALITY.VALID_VALUE.name)
    else:
        if int(data.contents.quality) & int(E_EDGE_DATA_QUALITY.FLAG_OVERFLOW.value[0]):
            quality.append(E_EDGE_DATA_QUALITY.FLAG_OVERFLOW.name)
        if int(data.contents.quality) & int(E_EDGE_DATA_QUALITY.NOT_TOPICAL.value[0]):
            quality.append(E_EDGE_DATA_QUALITY.NOT_TOPICAL.name)
        if int(data.contents.quality) & int(E_EDGE_DATA_QUALITY.OPERATOR_BLOCKED.value[0]):
            quality.append(E_EDGE_DATA_QUALITY.OPERATOR_BLOCKED.name)
        if int(data.contents.quality) & int(E_EDGE_DATA_QUALITY.SUBSITUTED.value[0]):
            quality.append(E_EDGE_DATA_QUALITY.SUBSITUTED.name)
        if int(data.contents.quality) & int(E_EDGE_DATA_QUALITY.TEST.value[0]):
            quality.append(E_EDGE_DATA_QUALITY.TEST.name)
        if int(data.contents.quality) & int(E_EDGE_DATA_QUALITY.INVALID.value):
            quality.append(E_EDGE_DATA_QUALITY.INVALID.name)

    if data.contents.type.value == E_EDGE_DATA_TYPE.INT32[0]:
        value = data.contents.value.int32
        type = "int32"
    elif data.contents.type.value == E_EDGE_DATA_TYPE.UINT32[0]:
        value = data.contents.value.uint32
        type = "uint32"
    elif data.contents.type.value == E_EDGE_DATA_TYPE.INT64[0]:
        value = data.contents.value.int64
        type = "int64"
    elif data.contents.type.value == E_EDGE_DATA_TYPE.UINT64[0]:
        value = data.contents.value.uint64
        type = "uint64"
    elif data.contents.type.value == E_EDGE_DATA_TYPE.FLOAT32[0]:
        value = data.contents.value.float32
        type = "float32"
    elif data.contents.type.value == E_EDGE_DATA_TYPE.DOUBLE64[0]:
        value = data.contents.value.double64
        type = "double64"
    else:
        value = None
        type = "unknown"

    timestamp = data.contents.timestamp64
    return {"topic": topic, "value": value, "handle": handle, "type": type, "quality": quality, "timestamp": timestamp}


def cb_edgedata_sub(event):
    edgecallbacks().cb_edge_data_subscribe(data2dict(event))


def cb_edgedata_log(text):
    edgecallbacks().cb_edge_data_logger(text)


global edgecallbacks_instance
edgecallbacks_instance = None

class edgecallbacks():
    def __new__(cls):
        global edgecallbacks_instance

        if cls is not edgecallbacks:
            edgecallbacks_instance = super(edgecallbacks, cls).__new__(cls)
        if edgecallbacks_instance:
            return edgecallbacks_instance
        else:
            # return default callback handler
            return super(edgecallbacks, cls).__new__(cls)

    def cb_edge_data_logger(self, text):
        # print(f"Default Logger: {text}")
        pass

    def cb_edge_data_subscribe(self, event):
        # self.cb_edge_data_logger(f"Default Event Notification: {event}")
        pass


class edgedataapi:
    written_data_handle_list = []
    readable_data_handle_list = []
    readable_data_handle_list_len = 0
    CB_EDGE_DATA_SUBSCRIBE = CFUNCTYPE(None, POINTER(T_EDGE_DATA))
    CB_EDGE_DATA_LOGGER = CFUNCTYPE(None, c_char_p)
    ref_cb_data_subscribe = CB_EDGE_DATA_SUBSCRIBE(cb_edgedata_sub)
    ref_cb_data_logger = CB_EDGE_DATA_LOGGER(cb_edgedata_log)

    def __edge_data_connect__() -> E_EDGE_DATA_RETVAL:
        edge_data_connect = c_lib.edge_data_connect
        return edge_data_connect()

    def __edge_data_disconnect__() -> E_EDGE_DATA_RETVAL:
        edge_data_disconnect = c_lib.edge_data_disconnect
        return edge_data_disconnect()

    def __edge_data_discover__():
        edge_data_discover = c_lib.edge_data_discover
        edge_data_discover.restype = POINTER(T_EDGE_DATA_LIST)
        edge_data_list = edge_data_discover()
        return edge_data_list

    def __edge_data_get_readable_handle__(topic):
        edge_data_get_readable_handle = c_lib.edge_data_get_readable_handle
        edge_data_get_readable_handle.argtypes = [c_char_p]
        edge_data_get_readable_handle.restype = T_EDGE_DATA_HANDLE
        return edge_data_get_readable_handle(topic.encode('utf-8'))

    def __edge_data_get_writeable_handle__(topic):
        edge_data_get_writeable_handle = c_lib.edge_data_get_writeable_handle
        edge_data_get_writeable_handle.argtypes = [c_char_p]
        edge_data_get_writeable_handle.restype = T_EDGE_DATA_HANDLE
        return edge_data_get_writeable_handle(topic.encode('utf-8')) 

    def __edge_data_get_data__(handle):
        edge_data_get_data = c_lib.edge_data_get_data
        edge_data_get_data.argtypes = [c_uint32]
        edge_data_get_data.restype = POINTER(T_EDGE_DATA)
        return edge_data_get_data(handle)

    def __edge_data_sync_read__(read_handle_list: T_EDGE_DATA_HANDLE, read_handle_list_len: c_uint32) -> E_EDGE_DATA_RETVAL:
        edge_data_sync_read = c_lib.edge_data_sync_read
        return edge_data_sync_read(read_handle_list, read_handle_list_len)

    def __edge_data_sync_write__(write_handle_list: T_EDGE_DATA_HANDLE, write_handle_list_len: c_uint32) -> E_EDGE_DATA_RETVAL:
        edge_data_sync_write = c_lib.edge_data_sync_write
        return edge_data_sync_write(write_handle_list, write_handle_list_len)

    def __edge_data_subscribe_event__(handle) -> E_EDGE_DATA_RETVAL:
        edge_data_subscribe_event = c_lib.edge_data_subscribe_event
        edge_data_subscribe_event.argtypes = [c_uint32, edgedataapi.CB_EDGE_DATA_SUBSCRIBE]
        return edge_data_subscribe_event(handle, edgedataapi.ref_cb_data_subscribe)

    def __edge_data_register_logger__() -> E_EDGE_DATA_RETVAL:
        edge_data_register_logger = c_lib.edge_data_register_logger
        edge_data_register_logger.argtypes = [edgedataapi.CB_EDGE_DATA_LOGGER]
        return edge_data_register_logger(edgedataapi.ref_cb_data_logger)

    discover_info = []

    def connect():
        edgedataapi.written_data_handle_list = []
        edgedataapi.discover_info = None
        retval = edgedataapi.__edge_data_connect__()
        edgecallbacks().cb_edge_data_logger("Try to connect to edgedataapi")
        if retval is not E_EDGE_DATA_RETVAL.E_EDGE_DATA_RETVAL_OK.value[0]:
            edgecallbacks().cb_edge_data_logger(f"Error: Cant connect to edgedataapi: {retval}")
            return False
        edgecallbacks().cb_edge_data_logger("Connected to edgedataapi")

        edgedataapi.discover_info = edgedataapi.__edge_data_discover__()

        for i in range(edgedataapi.discover_info.contents.read_handle_list_len):
            read_handle = edgedataapi.discover_info.contents.read_handle_list[i]
            edgedataapi.__edge_data_subscribe_event__(read_handle)
        return True

    def disconnect():
        edgecallbacks().cb_edge_data_logger("Try to disconnect")
        disconnect_return = edgedataapi.__edge_data_disconnect__()
        edgecallbacks().cb_edge_data_logger(f"disconnected {disconnect_return}")
        time.sleep(2)
        return disconnect_return

    def discover():
        if edgedataapi.discover_info is None:
            return None
        ret_discover_info = {"read": [], "write": []}
        for i in range(edgedataapi.discover_info.contents.read_handle_list_len):
            read_handle = edgedataapi.discover_info.contents.read_handle_list[i]
            read_data = edgedataapi.__edge_data_get_data__(read_handle)
            topic = read_data.contents.topic.decode("utf-8")
            ret_discover_info["read"].append(topic)
        for i in range(edgedataapi.discover_info.contents.write_handle_list_len):
            write_handle = edgedataapi.discover_info.contents.write_handle_list[i]
            write_data = edgedataapi.__edge_data_get_data__(write_handle)
            topic = write_data.contents.topic.decode("utf-8")
            ret_discover_info["write"].append(topic)
        return ret_discover_info

    def read(topic):
        try:
            read_data = edgedataapi.__edge_data_get_data__(edgedataapi.__edge_data_get_readable_handle__(topic))
            return data2dict(read_data)
        except Exception as e:
            edgecallbacks().cb_edge_data_logger(f"An error occurred: {e}")
            return None

    def write(topic, value=None, quality=None, timestamp=None):
        data_write = edgedataapi.__edge_data_get_data__(edgedataapi.__edge_data_get_writeable_handle__(topic))
        f_error = False
        if data_write == 0:
            return
        if value is None and quality is None:
            edgecallbacks().cb_edge_data_logger("Error: at least one value or quality parameter must be set")
            f_error = True
        if value is not None:
            if isinstance(value, int):
                if data_write.contents.type.value == E_EDGE_DATA_TYPE.INT32[0]:
                    if (value <= 2147483647) and (value >= -2147483648):
                        data_write.contents.value.int32 = value
                    else:
                        edgecallbacks().cb_edge_data_logger(f"Error: int32 out of range for topic {topic}")
                        f_error = True
                elif data_write.contents.type.value == E_EDGE_DATA_TYPE.UINT32[0]:
                    if (value <= 4294967295) and (value >= 0):
                        data_write.contents.value.uint32 = value
                    else:
                        edgecallbacks().cb_edge_data_logger(f"Error: uint32 out of range for topic {topic}")
                        f_error = True
                elif data_write.contents.type.value == E_EDGE_DATA_TYPE.INT64[0]:
                    if (value <= 9223372036854775807) and (value >= -9223372036854775808):
                        data_write.contents.value.int64 = value
                    else:
                        edgecallbacks().cb_edge_data_logger(f"Error: int64 out of range for topic {topic}")
                        f_error = True
                elif data_write.contents.type.value == E_EDGE_DATA_TYPE.UINT64[0]:
                    if (value <= 18446744073709551615) and (value >= 0):
                        data_write.contents.value.uint64 = value
                    else:
                        edgecallbacks().cb_edge_data_logger(f"Error: uint64 out of range for topic {topic}")
                        f_error = True
                else:
                    # Convert to float
                    value = float(value)
            if isinstance(value, float):
                if data_write.contents.type.value == E_EDGE_DATA_TYPE.FLOAT32[0]:
                    if (value <= 3.4e38) and (value >= -3.4e38):
                        data_write.contents.value.float32 = value
                    else:
                        edgecallbacks().cb_edge_data_logger(f"Error: float out of range for topic {topic}")
                        f_error = True
                elif data_write.contents.type.value == E_EDGE_DATA_TYPE.DOUBLE64[0]:
                    if (value <= 1.7e308) and (value >= -1.7e308):
                        data_write.contents.value.double64 = value
                    else:
                        edgecallbacks().cb_edge_data_logger(f"Error: double out of range for topic {topic}")
                        f_error = True
                else:
                    edgecallbacks().cb_edge_data_logger(f"Error: Invalid Datatype for topic {topic}")
                    f_error = True
            elif not isinstance(value, int):
                edgecallbacks().cb_edge_data_logger(f"Error: input parameter value is not an int or float for topic {topic}")
                f_error = True
        if quality:
            if type(quality) is not list:
                quality = [quality]
            quality_bitmask = 0
            for each in quality:
                if each not in E_EDGE_DATA_QUALITY.__members__:
                    edgecallbacks().cb_edge_data_logger(f"Error: Invalid quality parameter for topic {topic}")
                    f_error = True
                    break
                quality_bitmask = quality_bitmask + int(E_EDGE_DATA_QUALITY[each].value[0])
            data_write.contents.quality = c_uint32(quality_bitmask)
        if timestamp:
            data_write.contents.timestamp64 = timestamp
        else:
            data_write.contents.timestamp64 = 0
        if f_error:
            return False
        if data_write.contents.handle not in edgedataapi.written_data_handle_list:
            edgedataapi.written_data_handle_list.append(data_write.contents.handle)
        edgecallbacks().cb_edge_data_logger(f"Data written {data2dict(data_write)}")
        return True

    def sync_read():
        retval = edgedataapi.__edge_data_sync_read__(edgedataapi.discover_info.contents.read_handle_list, edgedataapi.discover_info.contents.read_handle_list_len)
        if retval is not E_EDGE_DATA_RETVAL.E_EDGE_DATA_RETVAL_OK.value[0]:
            edgecallbacks().cb_edge_data_logger(f"Error: Cant sync read data: {retval}")
            return False
        edgecallbacks().cb_edge_data_logger("Readable data synchronized")
        return True

    def sync_write():
        write_handles = (T_EDGE_DATA_HANDLE * (len(edgedataapi.written_data_handle_list)))()
        for i in range(len(edgedataapi.written_data_handle_list)):
            write_handles[i] = edgedataapi.written_data_handle_list[i]
        retval = edgedataapi.__edge_data_sync_write__(write_handles, len(edgedataapi.written_data_handle_list))
        edgedataapi.written_data_handle_list = []
        if retval is not E_EDGE_DATA_RETVAL.E_EDGE_DATA_RETVAL_OK.value[0]:
            edgecallbacks().cb_edge_data_logger(f"Error: Cant sync write data: {retval}")
            return False
        edgecallbacks().cb_edge_data_logger("Writeable data synchronized")
        return True
