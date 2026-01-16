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
#include <edgedata.h>
#include "edgedata_generated.h"

#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <cinttypes>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <stdbool.h>
#include <stdint.h>
#include <pthread.h>
#include <string.h>
#include <vector>
#include <time.h>
#include <sys/time.h>
#include <map>
#include <sys/socket.h>
#include <sys/un.h>
#include <netinet/in.h>
#include <stdarg.h>
#include <signal.h>
#include <unistd.h>
#include <sys/syscall.h>
#include <pwd.h>
//#include <arpa/inet.h>

#define MSG_MAX_FULL_SIZE                 4096
#define MAX_PAYLOAD_SIZE                  (MSG_MAX_FULL_SIZE - sizeof(EDGEDATA_RPC_HEADER))
#define MAX_NUMBER_SUPPORTED_DATAPOINTS   10000
#define SOCKET_TIMEOUT_SECONDS            8
#define KEEP_ALIVE_PING_SECONDS           3
#define MAX_DISCOVERED_DATAPOINTS_PER_MSG 20

#define MSG_TYPE_PING                     0
#define MSG_TYPE_DISCOVER                 1
#define MSG_TYPE_UPDATE_DATA              2


#define MSG_CONTROL_FLAG_REQUEST        0x01
#define MSG_CONTROL_FLAG_REPLY          0x02

#define ENABLE_DEBUG_LOCK_LOG   0
#define ENABLE_DEBUG_IPC_LOG    0
#define ENABLE_DEBUG_RPC_LOG    0
#define ENABLE_DEBUG_FB_LOG     0
#define ENABLE_INFO_LOG         0
#define ENABLE_ERROR_LOG        1

/* Source type flags */
#define EDGE_SOURCE_FLAG_READ           0x0001  /* Bit 1 */
#define EDGE_SOURCE_FLAG_WRITE          0x0002  /* Bit 2 */

#define gettid() syscall(SYS_gettid)

#if ENABLE_INFO_LOG != 0
#define INFO_LOG(...)  edgedata_logger("INFO: ", __FILE__, __LINE__, gettid(), __VA_ARGS__)
#else
#define INFO_LOG(...)
#endif
#if ENABLE_DEBUG_IPC_LOG != 0
#define DEBUG_IPC_LOG(...)  edgedata_logger("DEBUG IPC: ", __FILE__, __LINE__, gettid(), __VA_ARGS__)
#else
#define DEBUG_IPC_LOG(...)
#endif
#if ENABLE_DEBUG_RPC_LOG != 0
#define DEBUG_RPC_LOG(...)  edgedata_logger("DEBUG RPC: ", __FILE__, __LINE__, gettid(), __VA_ARGS__) 
#else
#define DEBUG_RPC_LOG(...)
#endif
#if ENABLE_DEBUG_FB_LOG != 0
#define DEBUG_FB_LOG(...)   edgedata_logger("DEBUG FB: ", __FILE__, __LINE__, gettid(), __VA_ARGS__)
#else
#define DEBUG_FB_LOG(...)
#endif
#if ENABLE_ERROR_LOG != 0
#define ERROR_LOG(...)      edgedata_logger("ERROR: ", __FILE__, __LINE__, gettid(), __VA_ARGS__)
#else
#define ERROR_LOG(...)
#endif
#if ENABLE_DEBUG_LOCK_LOG != 0
#define DEBUG_LOCK_LOG(...)       edgedata_logger("DEBUG LOCK: ", __FILE__, __LINE__, gettid(), __VA_ARGS__)
#else
#define DEBUG_LOCK_LOG(...)
#endif

#define ENTER_CRITICAL_SECTION(__fd) DEBUG_LOCK_LOG("Lock Critical Section\n"); pthread_mutex_lock(&__fd->critical_section_mutex); DEBUG_LOCK_LOG("Lock Ciritical Section OK\n")
#define LEAVE_CRITICAL_SECTION(__fd) DEBUG_LOCK_LOG("UnLock Ciritical Section\n"); pthread_mutex_unlock(&__fd->critical_section_mutex)

#define ENTER_WAIT_FOR_REPLY(__fd) DEBUG_LOCK_LOG("Lock Wait for Reply\n"); pthread_mutex_lock(&__fd->wait_for_reply_mutex); DEBUG_LOCK_LOG("Lock Wait for Reply OK\n")
#define LEAVE_WAIT_FOR_REPLY(__fd) DEBUG_LOCK_LOG("UnLock Wait for Reply\n"); pthread_mutex_unlock(&__fd->wait_for_reply_mutex)

#define ENTER_ACCESS_DATA() DEBUG_LOCK_LOG("Lock Access Data\n"); pthread_mutex_lock(&edge_data_access_mutex); DEBUG_LOCK_LOG("Lock Access Data OK\n")
#define LEAVE_ACCESS_DATA() DEBUG_LOCK_LOG("UnLock Access Data\n"); pthread_mutex_unlock(&edge_data_access_mutex)

#define ENTER_ACCESS_APP() DEBUG_LOCK_LOG("Lock Access APP\n"); pthread_mutex_lock(&edge_app_access_mutex); DEBUG_LOCK_LOG("Lock Access APP OK\n")
#define LEAVE_ACCESS_APP() DEBUG_LOCK_LOG("UnLock Access APP\n"); pthread_mutex_unlock(&edge_app_access_mutex)

typedef struct {
   uint32_t msg_type;
   uint32_t msg_payload_len;
   uint32_t msg_sequence;
   uint8_t  msg_control_flags;
   uint8_t  msg_reserve[3];
} EDGEDATA_RPC_HEADER;

typedef struct {
   EDGEDATA_RPC_HEADER header;
   unsigned char payload[MSG_MAX_FULL_SIZE - sizeof(EDGEDATA_RPC_HEADER)];
} EDGEDATA_RPC_FULL_MSG;

typedef void (*fct_callback_message)(void* fd, unsigned char* payload, uint32_t payload_len);
typedef uint32_t(*fct_callback_message_with_reply)(void* fd, unsigned char* payload, uint32_t payload_len, unsigned char* payload_reply, uint32_t max_payload_reply_len);
typedef int32_t(*fct_read) (int32_t fd, void* buff, uint32_t buff_len);
typedef int32_t(*fct_write) (int32_t fd, void* buff, uint32_t buff_len);
typedef void (*fct_error_connection) (void* fd);

typedef struct {
   uint32_t                message_type;
   fct_callback_message    cb;
} EDGEDATA_CALLBACK;

typedef struct {
   uint32_t                         message_type;
   fct_callback_message_with_reply  cb;
} EDGEDATA_CALLBACK_WITH_REPLY;

typedef struct {
   std::string* p_topic;
   T_EDGE_DATA* external;
   T_EDGE_DATA* internal;
   cb_edge_data_subscribe  cb;
} EDGEDATA_VALUES;

typedef struct {
   /* Read/Write Low Level */
   int32_t                                   read_fd;
   int32_t                                   write_fd;
   bool                                      b_channel_type_stream;
   std::string                               read_channel_name;
   std::string                               write_channel_name;
   bool                                      b_connected;
   fct_read                                  read;
   fct_write                                 write;
   fct_error_connection                      error_connection_cb;
   /* Read/Write Messages */
   EDGEDATA_RPC_FULL_MSG                     send_message;
   EDGEDATA_RPC_FULL_MSG                     recv_message;
   /* RPC Layer           */
   uint32_t                                  sequence;
   bool                                      b_wait_for_reply;
   bool                                      b_wait_for_reply_error;
   uint32_t                                  wait_for_reply_sequence;
   pthread_mutex_t                           wait_for_reply_mutex;
   pthread_mutex_t                           single_concurrent_request_mutex;
   pthread_mutex_t                           critical_section_mutex;
   pthread_t                                 p_thread_recv;
   pthread_t                                 p_thread_keep_alive;
   bool                                      b_shutdown;

   /* Callback Layer */
   std::vector<EDGEDATA_CALLBACK>            callbacks;
   std::vector<EDGEDATA_CALLBACK_WITH_REPLY> callbacks_with_reply;
   /* Application Layer */
   std::map<uint32_t, EDGEDATA_VALUES>       read_values;
   std::map<uint32_t, EDGEDATA_VALUES>       write_values;
   /* State of Discover write and read values */
   std::map<uint32_t, EDGEDATA_VALUES>::iterator  it_read_discover_info;
   std::map<uint32_t, EDGEDATA_VALUES>::iterator  it_write_discover_info;
} EDGEDATA_IPC_FD;

#ifdef __cplusplus
extern "C" {
#endif
   extern char pre_logger_text[20];
   extern EDGEDATA_IPC_FD* edge_data_fd;

   extern EDGEDATA_IPC_FD* edgedata_ipc_fifo_server_listen(const char* channel_name);
   extern EDGEDATA_IPC_FD* edgedata_ipc_fifo_client_connect(const char* channel_name);
   extern EDGEDATA_IPC_FD* edgedata_ipc_unix_server_listen(const char* channel_name, const char* user);
   extern EDGEDATA_IPC_FD* edgedata_ipc_unix_client_connect(const char* channel_name);
   extern EDGEDATA_IPC_FD* edgedata_ipc_unix_server_listen_with_error_cb(const char* channel_name, const char* user, fct_error_connection cb);

   extern void edgedata_ipc_disconnect(EDGEDATA_IPC_FD** fd);
   extern bool edgedata_ipc_is_connected(EDGEDATA_IPC_FD* fd);

   extern bool edgedata_rpc_send_fire_and_forget(EDGEDATA_IPC_FD* fd, uint32_t message_type, unsigned char* payload, uint32_t payload_len);
   extern bool edgedata_rpc_send_request(EDGEDATA_IPC_FD* fd, uint32_t message_type, unsigned char* payload, uint32_t payload_len);
   extern bool edgedata_rpc_send_reply(EDGEDATA_IPC_FD* fd, uint32_t message_type, uint32_t reply_sequence, unsigned char* payload, uint32_t payload_len);
   extern void edgedata_rpc_dummy_ack(void* fd, unsigned char* p_payload, uint32_t payload_len);

   extern void edgedata_thread_start_thread_recv(EDGEDATA_IPC_FD* fd);
   extern bool edgedata_rpc_recv(EDGEDATA_IPC_FD* fd, uint32_t* p_message_type, uint32_t* p_sequence, uint8_t* p_msg_control_flags, unsigned char** p_payload, uint32_t* p_payload_len);
   extern void edgedata_thread_start_keep_alive(EDGEDATA_IPC_FD* fd);

   extern void edgedata_callback_with_reply_register(EDGEDATA_IPC_FD* fd, uint32_t message_type, fct_callback_message_with_reply cb);
   extern void edgedata_callback_register(EDGEDATA_IPC_FD* fd, uint32_t message_type, fct_callback_message cb);

   extern bool edgedata_data_discover_add(EDGEDATA_IPC_FD* fd, const char* topic, uint32_t handle, E_EDGE_DATA_TYPE type, uint32_t source, uint32_t quality, T_EDGE_DATA_VALUE* init_value, int64_t init_timestamp, cb_edge_data_subscribe cb);
   extern void edgedata_data_print_state(EDGEDATA_IPC_FD* fd);
   extern void edgedata_data_cleanup(EDGEDATA_IPC_FD** fd);

   extern void edgedata_flatbuffers_discover_message_parse(void* fd, unsigned char* p_payload, uint32_t max_payload_len);
   extern uint32_t edgedata_flatbuffers_discover_serialize(EDGEDATA_IPC_FD* fd, unsigned char* p_payload, uint32_t max_payload_len);
   extern uint32_t edgedata_flatbuffers_discover_with_reply(void* fd, unsigned char* payload, uint32_t payload_len, unsigned char* payload_reply, uint32_t max_payload_reply_len);
   extern bool edgedata_flatbuffers_edge_event_send(void* fd, uint32_t handle, E_EDGE_DATA_TYPE type, uint32_t quality, T_EDGE_DATA_VALUE* value, int64_t timestamp64);
   extern uint32_t edgedata_flatbuffers_edge_event_receive(void* fd, unsigned char* payload, uint32_t payload_len, unsigned char* payload_reply, uint32_t max_payload_reply_len);

   extern void edgedata_logger(const char* file, unsigned int line, const char* format, ...);

#ifdef __cplusplus
}
#endif