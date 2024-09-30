/* 
 * siapp-sdk
 *
 * SPDX-License-Identifier: MIT
 * Copyright 2020 Siemens AG
 *
 * Authors:
 *   Lukas Wimmer <lukas.wimmer@siemens.com>
 *
 */

#pragma once
#include <stdint.h>
#include <float.h>
#include <math.h>

/* Quality flags */
#define EDGE_QUALITY_VALID_VALUE           0x00  /* unset */
#define EDGE_QUALITY_FLAG_NOT_TOPICAL      0x01  /* Bit 1 */
#define EDGE_QUALITY_FLAG_OVERFLOW         0x02  /* Bit 2 */
#define EDGE_QUALITY_FLAG_OPERATOR_BLOCKED 0x04  /* Bit 3 */
#define EDGE_QUALITY_FLAG_SUBSITUTED       0x08  /* Bit 4 */
#define EDGE_QUALITY_FLAG_TEST             0x10  /* Bit 5 */
#define EDGE_QUALITY_FLAG_INVALID          0x20  /* Bit 6 */

/* Return Values for Edge Data Interface */
typedef enum {
   E_EDGE_DATA_RETVAL_OK = 0,
   E_EDGE_DATA_RETVAL_NOK = -1,
   E_EDGE_DATA_RETVAL_UNKNOWN_TOPIC = -2,
   E_EDGE_DATA_RETVAL_INVALID_VALUE = -3,
   E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY = -4,
   E_EDGE_DATA_RETVAL_UNKNOWN_HANDLE = -5,
} E_EDGE_DATA_RETVAL;

/* Data Type */
typedef enum {
   E_EDGE_DATA_TYPE_UNKNOWN = 0,
   E_EDGE_DATA_TYPE_INT32 = 1,
   E_EDGE_DATA_TYPE_UINT32 = 2,
   E_EDGE_DATA_TYPE_INT64 = 3,
   E_EDGE_DATA_TYPE_UINT64 = 4,
   E_EDGE_DATA_TYPE_FLOAT32 = 5,
   E_EDGE_DATA_TYPE_DOUBLE64 = 6,
} E_EDGE_DATA_TYPE;

/* Supported Data Types for an Edge Data Value */
typedef union {
   int32_t                       int32;
   uint32_t                      uint32;
   int64_t                       int64;
   uint64_t                      uint64;
   float_t                       float32;
   double_t                      double64;
} T_EDGE_DATA_VALUE;

/* Full Edge Data Value */
typedef struct {
   const char* topic;        /* value name    */
   uint32_t                      handle;        /* value handle  */
   E_EDGE_DATA_TYPE              type;          /* value type    */
   uint32_t                      quality;       /* see EDGE_QUALITY_FLAG_ defines ... for details */
   T_EDGE_DATA_VALUE             value;         /* value         */
   int64_t                       timestamp64;   /* timestamp     */
} T_EDGE_DATA;

/* Typedef for Edge Data Handle  */
typedef uint32_t T_EDGE_DATA_HANDLE;

/* Edge Data List */
typedef struct {
   T_EDGE_DATA_HANDLE* read_handle_list;
   uint32_t    read_handle_list_len;
   T_EDGE_DATA_HANDLE* write_handle_list;
   uint32_t    write_handle_list_len;
}  T_EDGE_DATA_LIST;

/* EVENT CALLBACK FUNCTION */
typedef void (*cb_edge_data_subscribe) (T_EDGE_DATA* event);

/* LOGGER CALLBACK FUNCTION */
typedef void (*cb_edge_data_logger) (const char* text);

/**********/
#ifdef __cplusplus
extern "C" {
#endif

   /* INIT EDGE DATA */
   extern E_EDGE_DATA_RETVAL edge_data_connect();

   extern E_EDGE_DATA_RETVAL edge_data_disconnect();

   /* DISCOVER INIT */
   extern const T_EDGE_DATA_LIST* edge_data_discover();

   /* GET HANDLE FOR A READABLE TOPIC */
   extern T_EDGE_DATA_HANDLE edge_data_get_readable_handle(const char* topic);

   /* GET HANDLE FOR A WRITEABLE TOPIC */
   extern T_EDGE_DATA_HANDLE edge_data_get_writeable_handle(const char* topic);

   /* GET DATA ACCESS POINTER */
   extern T_EDGE_DATA* edge_data_get_data(T_EDGE_DATA_HANDLE handle);

   /*************************/
   /* SYNC DATA(READ/WRITE) */
   /*************************/

   /* READ MULTIPLE DATA LIST ENTRIES */
   extern E_EDGE_DATA_RETVAL edge_data_sync_read(T_EDGE_DATA_HANDLE* read_handle_list, uint32_t read_handle_list_len);

   /* WRITE MULTIPLE DATA LIST ENTRIES (Sync update or trigger an event is managed by the backend) */
   extern E_EDGE_DATA_RETVAL edge_data_sync_write(T_EDGE_DATA_HANDLE* write_handle_list, uint32_t write_handle_list_len);

   /**********************/
   /* REGISTER CALLBACKS */
   /**********************/

   /* SUBSCRIBE FOR A TOPIC/EVENT */
   extern E_EDGE_DATA_RETVAL edge_data_subscribe_event(uint32_t handle, cb_edge_data_subscribe cb);

   /* REGISTER LOGGER CALLBACK */
   extern E_EDGE_DATA_RETVAL edge_data_register_logger(cb_edge_data_logger cb);

#ifdef __cplusplus
}
#endif

