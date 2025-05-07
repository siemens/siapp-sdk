#!/usr/bin/python3

'''
siapp-sdk

SPDX-License-Identifier: MIT
Copyright 2024 Siemens AG

Author:
Lukas Wimmer <lukas.wimmer@siemens.com>

'''

from edgedataapi import edgedataapi, edgecallbacks
import time


# register callbacks by function overloading if needed
class usercallback(edgecallbacks):
    def cb_edge_data_subscribe(self, event):
        print(f"User Event Notification: {event}")

    def cb_edge_data_logger(self, text):
        print(f"User Logger: {text}")


if __name__ == "__main__":
    callback = usercallback()
    if edgedataapi.connect():

        discover_info = edgedataapi.discover()

        for topic in discover_info["read"]:
            print(f"Discovered Read Topic: {topic}")

        for topic in discover_info["write"]:
            print(f"Discovered Write Topic: {topic}")

        for topic in discover_info["read"]:
            print(f"Manual Read Data: {edgedataapi.read(topic)}")

        time.sleep(2)

        # sync all current read data to get a snapshot
        # (otherwise data will not be updated)
        if not edgedataapi.sync_read():
            print("Sync read failed")
            edgedataapi.disconnect()
            exit(-1)
        for topic in discover_info["read"]:
            print(f"Manual Read Data: {edgedataapi.read(topic)}")

        value = 1
        for topic in discover_info["write"]:
            if not edgedataapi.write(topic, value, ["VALID_VALUE"], int(time.time_ns())):
                print("Write failed")
            value = value + 1
        # sync only written data objects
        if not edgedataapi.sync_write():
            print("Sync write failed")
            edgedataapi.disconnect()
            exit(-2)

        for topic in discover_info["write"]:
            print(f"Manual Write Data: {edgedataapi.read(topic)}")

        for topic in discover_info["write"]:
            if not edgedataapi.write(topic, value, ["FLAG_OVERFLOW", "TEST"], int(time.time_ns())):
                print("Write failed")
            value = value + 1

        if not edgedataapi.sync_write():
            print("Sync write failed")
            edgedataapi.disconnect()
            exit(-2)
        time.sleep(20)
        # wait for notifications
        edgedataapi.disconnect()
    else:
        print("Connection failed")
        exit(-3)
