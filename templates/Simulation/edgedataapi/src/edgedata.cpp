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

#include "edgedata_internal.h"

using namespace std;
using namespace flatbuffers;
using namespace edgedata_flatbuffers;
using namespace edgedata_flatbuffers::EdgeDataInfo_;

/* *********HIERARCHICALLY LAYER VIEW**************** */
/* LOG Layer                                          */
/*      Supports different Log Levels                 */
/* ************************************************** */
/* IPC Layer                                          */
/*      Connect to data channel (Open/Close)          */
/*      Read Write based on File handle               */
/* RPC Layer                                          */
/*      Message Framing                               */
/*      Fire and Forget, Request, Reply, ACK, Timeout */
/* CALLBACK Layer                                     */
/*      Register Callback for different Message Types */
/* THREAD Layer                                       */
/*      Receiving Thread, Keep Alive Thread           */
/* ************************************************** */
/* FLATBUFFER Layer                                   */
/*      Flatbuffer                                    */
/* EDGE DATA Layer                                    */
/*      Manage actual values and sync mechanism       */
/* ************************************************** */
/* EDGE DATA Application Layer                        */
/*      Interface for Application                     */
/* ************************************************** */

   /* ************************************ */
   /* **************LOG LAYER************* */
   /* ************************************ */

static cb_edge_data_logger s_cb = NULL;

void edgedata_logger(const char* pre_text, const char* file, unsigned int line, unsigned int pid, const char* format, ...)
{
   va_list arg;
   char buffer[200];
   int buffer_len = 0;
   cb_edge_data_logger tmp_cb = s_cb;

   if ((format == NULL) || (tmp_cb == NULL))
   {
      return;
   }
   va_start(arg, format);
   /* Build Log Info */
   buffer_len = snprintf(&buffer[buffer_len], sizeof(buffer) - 1, "Line:%d [%u] %s", line, pid, pre_text);
   buffer_len += vsnprintf(&buffer[buffer_len], sizeof(buffer) - 1 - buffer_len, format, arg);
   buffer[sizeof(buffer) - 1] = 0;
   /* call registered log callback */
   tmp_cb(buffer);
   va_end(arg);
}

/* ************************************ */
/* **************IPC LAYER************* */
/* ************************************ */

/* ********** GENERAL ***************** */

static EDGEDATA_IPC_FD* ipc_new_fd(bool b_stream_channel)
{
   EDGEDATA_IPC_FD* fd = new EDGEDATA_IPC_FD();
   if (fd != NULL)
   {
      fd->sequence = 0;
      fd->b_wait_for_reply = false;
      fd->b_wait_for_reply_error = false;
      fd->wait_for_reply_sequence = 0;
      fd->wait_for_reply_mutex = PTHREAD_MUTEX_INITIALIZER;
      fd->single_concurrent_request_mutex = PTHREAD_MUTEX_INITIALIZER;
      fd->critical_section_mutex = PTHREAD_MUTEX_INITIALIZER;
      fd->b_shutdown = false;
      fd->b_channel_type_stream = b_stream_channel;
      fd->b_connected = true;
      fd->it_read_discover_info = fd->read_values.begin();
      fd->it_write_discover_info = fd->write_values.begin();

      pthread_mutex_lock(&fd->wait_for_reply_mutex);
   }
   return fd;
}

/* called only by recv thread */
static void edgedata_ipc_close(EDGEDATA_IPC_FD* fd)
{
   ENTER_CRITICAL_SECTION(fd);
   if (fd->b_connected)
   {
      DEBUG_IPC_LOG("IPC CLOSED\n");
      fd->b_connected = false;
      if (fd->write_fd != 0)
      {
         close(fd->write_fd);
         fd->write_fd = 0;
      }
      if (fd->read_fd != 0)
      {
         close(fd->read_fd);
         fd->read_fd = 0;
      }
   }
   LEAVE_CRITICAL_SECTION(fd);
}

bool edgedata_ipc_is_connected(EDGEDATA_IPC_FD* fd)
{
   if (fd != NULL)
   {
      return fd->b_connected;
   }
   return false;
}

/* called by user */
void edgedata_ipc_disconnect(EDGEDATA_IPC_FD** fd)
{
   if (*fd == NULL)
   {
      return;
   }
   /* only the receive task can close the channel */
   DEBUG_LOCK_LOG("Trigger THREADS to SHUTDOWN\n");
   (*fd)->b_shutdown = true;
   pthread_join((*fd)->p_thread_recv, NULL);
   pthread_join((*fd)->p_thread_keep_alive, NULL);
   /* TODO calls wrong layer !!! */
   edgedata_data_cleanup(fd);
}

bool edgedata_ipc_read(EDGEDATA_IPC_FD* fd)
{
   if (fd == NULL)
   {
      return false;
   }
   DEBUG_IPC_LOG("Try to read\n");
   if (fd->b_channel_type_stream)
   {
      DEBUG_IPC_LOG("Try read Header\n");
      /* read header */
      int32_t retval = fd->read(fd->read_fd, (void*)&fd->recv_message, sizeof(fd->recv_message.header));
      //if (read(fd->read_fd, (void*)&fd->recv_message, sizeof(fd->recv_message.header)) != sizeof(fd->recv_message.header))

      if (retval != sizeof(fd->recv_message.header))
      {
         ERROR_LOG("edgedata_ipc_read Header Read Error (retval=%d)\n", retval);
         return false;
      }
      DEBUG_IPC_LOG("Detected Payload Size: %d\n", fd->recv_message.header.msg_payload_len);

      /* check max size of payload length */
      if (fd->recv_message.header.msg_payload_len > sizeof(fd->recv_message.payload))
      {
         ERROR_LOG("edgedata_ipc_read Max Payload Size Error\n");
         return false;
      }
      DEBUG_IPC_LOG("Try read Payload\n");
      /* read payload (length depends on header) */
      if (fd->read(fd->read_fd, (void*)&fd->recv_message.payload, fd->recv_message.header.msg_payload_len) != (int32_t)fd->recv_message.header.msg_payload_len)
      {
         ERROR_LOG("edgedata_ipc_read Payload Read Error\n");
         return false;
      }
      DEBUG_IPC_LOG("New Payload detected\n");
   }
   else
   {
      /* NOT USED RIGHT NOW!! */
      /*** IS SIZEOF TEST OK????? **/
      DEBUG_IPC_LOG("Try read full Package\n");
      /* read full message */
      if (fd->read(fd->read_fd, (void*)&fd->recv_message, sizeof(fd->recv_message)) != sizeof(fd->recv_message))
      {
         ERROR_LOG("edgedata_ipc_read Header Read Error\n");
         return false;
      }
      /* check max size of payload length */
      if (fd->recv_message.header.msg_payload_len > sizeof(fd->recv_message.payload))
      {
         ERROR_LOG("edgedata_rpc_ipc_read Max Payload Size Error\n");
         return false;
      }
   }
   return true;
}

bool edgedata_ipc_write(EDGEDATA_IPC_FD* fd)
{
   int32_t full_msg_len;
   if (fd == NULL)
   {
      return false;
   }
   full_msg_len = fd->send_message.header.msg_payload_len + sizeof(fd->send_message.header);
   DEBUG_IPC_LOG("Full Message Len: %d, Header Len: %d, Payload Len: %d\n", full_msg_len, (int32_t)sizeof(fd->send_message.header), (int32_t)fd->send_message.header.msg_payload_len);
   /* write full message */
   if (fd->write(fd->write_fd, (void*)&fd->send_message, full_msg_len) != full_msg_len)
   {
      ERROR_LOG("edgedata_rpc_ipc_write Write Error\n");
      return false;
   }
   return true;
}

static int32_t edgedata_ipc_basic_read(int32_t fd, void* buff, uint32_t buff_len)
{
   return read(fd, buff, buff_len);
}

static int32_t edgedata_ipc_basic_write(int32_t fd, void* buff, uint32_t buff_len)
{
   return write(fd, buff, buff_len);
}

/* *********** FIFO *******************


// Server Connect
EDGEDATA_IPC_FD *edgedata_ipc_fifo_server_listen(const char* channel_name)
   {
   EDGEDATA_IPC_FD *fd = ipc_new_fd(true);
   fd->read_channel_name = string(channel_name) + "_client";
   fd->write_channel_name = string(channel_name) + "_server";
   fd->read = edgedata_ipc_fifo_read;
   fd->write = edgedata_ipc_fifo_write;

   mkfifo(fd->write_channel_name.c_str(), 0666);
   mkfifo(fd->read_channel_name.c_str(), 0666);

   fd->write_fd = open(fd->write_channel_name.c_str(), O_WRONLY);
   fd->read_fd  = open(fd->read_channel_name.c_str(), O_RDONLY);// | O_NONBLOCK);
   // if error
   if ((fd->read_fd == 0) || (fd->write_fd == 0))
      {
      ERROR_LOG("Error open fifo server\n");
      delete fd;
      fd = NULL;
      return NULL;
      }
   return fd;
   }


// Client Connect
EDGEDATA_IPC_FD *edgedata_ipc_fifo_client_connect(const char* channel_name)
   {
   EDGEDATA_IPC_FD *fd = ipc_new_fd(true);
   fd->read_channel_name = string(channel_name) + "_server";
   fd->write_channel_name = string(channel_name) + "_client";
   fd->read = edgedata_ipc_fifo_read;
   fd->write = edgedata_ipc_fifo_write;

   fd->write_fd = open(fd->write_channel_name.c_str(), O_WRONLY);
   fd->read_fd  = open(fd->read_channel_name.c_str(), O_RDONLY);// | O_NONBLOCK);
   // if error
   if ((fd->read_fd == 0) || (fd->write_fd == 0))
      {
      ERROR_LOG("Error open fifo client\n");
      delete fd;
      fd = NULL;
      return NULL;
      }
   return fd;
   }
*/

/* *********** UNIX ******************* */
//void pipe_close_handler(int s) {
//ERROR_LOG("Caught SIGPIPE SIGNAL ERROR\n");
//}


EDGEDATA_IPC_FD* edgedata_ipc_unix_server_listen_with_error_cb(const char* channel_name, const char* user, fct_error_connection cb)
{
   EDGEDATA_IPC_FD* fd = edgedata_ipc_unix_server_listen(channel_name, user);
   if (fd != NULL)
   {
      fd->error_connection_cb = cb;
   }
   return fd;
}

EDGEDATA_IPC_FD* edgedata_ipc_unix_server_listen(const char* channel_name, const char* user)
{
   int32_t listen_socket;
   struct timeval tv;
   char cmd[256];

   EDGEDATA_IPC_FD* fd = ipc_new_fd(true);
   tv.tv_sec = SOCKET_TIMEOUT_SECONDS;
   tv.tv_usec = 0;
   fd->read_channel_name = string(channel_name);
   fd->write_channel_name = string(channel_name);
   fd->read = edgedata_ipc_basic_read;
   fd->write = edgedata_ipc_basic_write;
   fd->error_connection_cb = NULL;
   /* catch SIGPIPE error */
   signal(SIGPIPE, SIG_IGN); //pipe_close_handler);  // SIG_IGN ignores it

   listen_socket = socket(AF_LOCAL, SOCK_STREAM, 0);

   if (listen_socket < 0)
   {
      edgedata_data_cleanup(&fd);
      ERROR_LOG("Error create unix socket\n");
      return NULL;
   }

   struct sockaddr_un addr;
   memset(&addr, 0, sizeof(addr));
   addr.sun_family = AF_LOCAL;
   if (fd->read_channel_name.length() >= sizeof(addr.sun_path))
   {
      edgedata_data_cleanup(&fd);
      ERROR_LOG("Error: channel name too long for unix socket path\n");
      return NULL;
   }
   strncpy(addr.sun_path, fd->read_channel_name.c_str(), sizeof(addr.sun_path) - 1);
   addr.sun_path[sizeof(addr.sun_path) - 1] = '\0';

   /* Only unlink if path is a socket or does not exist */
   struct stat st;
   if (lstat(fd->read_channel_name.c_str(), &st) == 0)
   {
      if (S_ISSOCK(st.st_mode))
      {
         unlink(fd->read_channel_name.c_str());
      }
      else
      {
         close(listen_socket);
         edgedata_data_cleanup(&fd);
         ERROR_LOG("Error: path exists and is not a socket: %s\n", addr.sun_path);
         return NULL;
      }
   }

   if (bind(listen_socket, (struct sockaddr*) & addr, sizeof(addr)) < 0)
   {
      close(listen_socket);
      edgedata_data_cleanup(&fd);
      ERROR_LOG("Error bind unix socket %s\n", addr.sun_path);
      return NULL;
   }

   /* we set permission here */
   if (user != NULL)
   {
      struct passwd *pw = getpwnam(user);
      if (pw != NULL)
      {
         (void)chown(addr.sun_path, pw->pw_uid, pw->pw_gid);
      }
      (void)chmod(addr.sun_path, 0777);
   }

   listen(listen_socket, 5);
   socklen_t addrlen = sizeof(struct sockaddr_in);
   fd->write_fd = accept(listen_socket,
      (struct sockaddr*) & addr,
      &addrlen);

   close(listen_socket);
   if (fd->write_fd <= 0)
   {
      edgedata_data_cleanup(&fd);
      ERROR_LOG("Error accept unix socket\n");
      return NULL;
   }
   fd->read_fd = fd->write_fd;

   /* set read socket timeout */
   setsockopt(fd->read_fd, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tv, sizeof tv);
   setsockopt(fd->read_fd, SOL_SOCKET, SO_SNDTIMEO, (const char*)&tv, sizeof tv);
   return fd;
}

EDGEDATA_IPC_FD* edgedata_ipc_unix_client_connect(const char* channel_name)
{
   EDGEDATA_IPC_FD* fd = ipc_new_fd(true);
   struct timeval tv;
   tv.tv_sec = SOCKET_TIMEOUT_SECONDS;
   tv.tv_usec = 0;
   fd->read_channel_name = string(channel_name);
   fd->write_channel_name = string(channel_name);
   fd->read = edgedata_ipc_basic_read;
   fd->write = edgedata_ipc_basic_write;
   fd->error_connection_cb = NULL;

   //catch SIGPIPE error
   signal(SIGPIPE, SIG_IGN);//pipe_close_handler);  // SIG_IGN ignores it

   fd->write_fd = socket(PF_LOCAL, SOCK_STREAM, 0);
   fd->read_fd = fd->write_fd;

   if (fd->write_fd < 0)
   {
      edgedata_data_cleanup(&fd);
      ERROR_LOG("Error create unix socket\n");
      return NULL;
   }
   struct sockaddr_un addr;
   memset(&addr, 0, sizeof(addr));
   addr.sun_family = AF_LOCAL;
   if (fd->read_channel_name.length() >= sizeof(addr.sun_path))
   {
      close(fd->read_fd);
      edgedata_data_cleanup(&fd);
      ERROR_LOG("Error: channel name too long for unix socket path\n");
      return NULL;
   }
   strncpy(addr.sun_path, fd->read_channel_name.c_str(), sizeof(addr.sun_path) - 1);
   addr.sun_path[sizeof(addr.sun_path) - 1] = '\0';

   if (connect(fd->read_fd, (struct sockaddr*) & addr, sizeof(addr)) == -1)
   {
      close(fd->read_fd);
      edgedata_data_cleanup(&fd);
      ERROR_LOG("Error connect unix socket\n");
      return NULL;
   }
   setsockopt(fd->read_fd, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tv, sizeof tv);
   setsockopt(fd->read_fd, SOL_SOCKET, SO_SNDTIMEO, (const char*)&tv, sizeof tv);
   return fd;
}

/* ************************************ */
/* **************RPC LAYER************* */
/* ************************************ */

static bool is_request(uint8_t control_flags)
{
   if ((control_flags & MSG_CONTROL_FLAG_REQUEST) != 0)
   {
      return true;
   }
   return false;
}

static bool is_reply(uint8_t control_flags)
{
   if ((control_flags & MSG_CONTROL_FLAG_REPLY) != 0)
   {
      return true;
   }
   return false;
}

static uint32_t new_sequence_number(EDGEDATA_IPC_FD* fd)
{
   fd->sequence++;
   return fd->sequence;
}

static bool set_package_info(EDGEDATA_IPC_FD* fd, uint32_t message_type, uint32_t reply_sequence, uint8_t control_flags, unsigned char* p_msg_payload, uint32_t msg_payload_len)
{
   EDGEDATA_RPC_HEADER* header;
   if ((fd == NULL) || (p_msg_payload == NULL) || (msg_payload_len > MAX_PAYLOAD_SIZE))
   {
      return false;
   }
   header = (EDGEDATA_RPC_HEADER*)&fd->send_message.header;
   memset(header, 0, sizeof(EDGEDATA_RPC_HEADER));
   /* set header */
   header->msg_type = message_type;
   header->msg_payload_len = msg_payload_len;
   header->msg_control_flags = control_flags;

   if (is_reply(control_flags))
   {  /* use sequence from response */
      header->msg_sequence = reply_sequence;
   }
   else
   {  /* create new sequence number */
      header->msg_sequence = new_sequence_number(fd);
   }

   /* set payload */
   memcpy(&fd->send_message.payload, p_msg_payload, msg_payload_len);
   return true;
}

static bool get_package_info(EDGEDATA_IPC_FD* fd, uint32_t* p_message_type, uint32_t* p_sequence, uint8_t* p_msg_control_flags, unsigned char** p_payload, uint32_t* p_payload_len)
{
   EDGEDATA_RPC_HEADER* header;

   if ((fd == NULL) || (p_message_type == NULL) || (p_sequence == NULL) || (p_msg_control_flags == NULL) || (p_payload == NULL) || (p_payload_len == NULL))
   {
      return false;
   }
   header = (EDGEDATA_RPC_HEADER*)&fd->recv_message.header;
   *p_message_type = header->msg_type;
   *p_sequence = header->msg_sequence;
   *p_payload_len = header->msg_payload_len;
   *p_msg_control_flags = fd->recv_message.header.msg_control_flags;
   *p_payload = fd->recv_message.payload;
   return true;
}

static bool wait_for_response(EDGEDATA_IPC_FD* fd)
{
   ENTER_WAIT_FOR_REPLY(fd);
   if (fd->b_wait_for_reply_error)
   {
      return false;
   }
   return true;
}

static void edgedata_rpc_inform_about_response(EDGEDATA_IPC_FD* fd, uint32_t sequence)
{
   if ((fd->b_wait_for_reply) && (fd->wait_for_reply_sequence == sequence))
   {
      fd->b_wait_for_reply = false;
      fd->b_wait_for_reply_error = false;
      LEAVE_WAIT_FOR_REPLY(fd);
   }
}

void edgedata_rpc_unlock_wait_for_reply_by_timeout(EDGEDATA_IPC_FD* fd)
{
   /* remove wait for reply lock  */
   if (fd->b_wait_for_reply)
   {
      fd->b_wait_for_reply_error = true;
      LEAVE_WAIT_FOR_REPLY(fd);
   }
}

static bool edgedata_rpc_send(EDGEDATA_IPC_FD* fd, uint32_t message_type, uint32_t reply_sequence, uint8_t control_flags, unsigned char* payload, uint32_t payload_len)
{
   bool ret = false;
   if ((fd == NULL) || (payload == NULL))
   {
      return false;
   }
   /* avoids mulitple concurrent requests at the same time (waiting for a reply) */
   if (is_request(control_flags))
   {
      pthread_mutex_lock(&fd->single_concurrent_request_mutex);
   }

   ENTER_CRITICAL_SECTION(fd);
   if ((fd->b_connected) && (fd->write_fd != 0) && (fd->read_fd != 0))
   {
      /* setup header */
      if (set_package_info(fd, message_type, reply_sequence, control_flags, payload, payload_len))
      {
         if (is_request(control_flags))
         {
            /* mark sequence number as wait for */
            fd->b_wait_for_reply = true;
            fd->wait_for_reply_sequence = fd->send_message.header.msg_sequence;
         }
         DEBUG_RPC_LOG("try to write\n");
         if (edgedata_ipc_write(fd))
         {
            DEBUG_RPC_LOG("write finished (Payload: %d)\n", fd->send_message.header.msg_payload_len);
            if (is_request(control_flags))
            {  /* its a request */
               DEBUG_LOCK_LOG("Wait for reponse (messagetype: %d)\n", message_type);
               LEAVE_CRITICAL_SECTION(fd);
               ret = wait_for_response(fd);
               DEBUG_LOCK_LOG("Wait for reponse -> Released\n");
               pthread_mutex_unlock(&fd->single_concurrent_request_mutex);
               return ret;
            }
            else
            {  /* e.g. fire and forget or reply */
               ret = true;;
            }
         }
         else
         {
            ERROR_LOG("Error write message\n");
         }
      }
      else
      {
         ERROR_LOG("RPC send failed (connection already closed)");
      }
   }
   LEAVE_CRITICAL_SECTION(fd);
   if (is_request(control_flags))
   {
      pthread_mutex_unlock(&fd->single_concurrent_request_mutex);
   }
   return ret;
}

bool edgedata_rpc_send_fire_and_forget(EDGEDATA_IPC_FD* fd, uint32_t message_type, unsigned char* payload, uint32_t payload_len)
{
   return edgedata_rpc_send(fd, message_type, 0, 0, payload, payload_len);
}
bool edgedata_rpc_send_request(EDGEDATA_IPC_FD* fd, uint32_t message_type, unsigned char* payload, uint32_t payload_len)
{
   return edgedata_rpc_send(fd, message_type, 0, MSG_CONTROL_FLAG_REQUEST, payload, payload_len);
}
bool edgedata_rpc_send_reply(EDGEDATA_IPC_FD* fd, uint32_t message_type, uint32_t reply_sequence, unsigned char* payload, uint32_t payload_len)
{
   return edgedata_rpc_send(fd, message_type, reply_sequence, MSG_CONTROL_FLAG_REPLY, payload, payload_len);
}

void edgedata_rpc_dummy_ack(void* fd, unsigned char* p_payload, uint32_t payload_len)
{
   /* nothing todo */
}
uint32_t edgedata_rpc_dummy_with_reply_ack(void* fd, unsigned char* payload, uint32_t payload_len, unsigned char* payload_reply, uint32_t max_payload_reply_len)
{
   /* nothing todo */
   return 0;
}

/* only called by recv thread */
bool edgedata_rpc_recv(EDGEDATA_IPC_FD* fd, uint32_t* p_message_type, uint32_t* p_sequence, uint8_t* p_msg_control_flags, unsigned char** p_payload, uint32_t* p_payload_len)
{
   if ((fd == NULL) || (p_payload == NULL) || (p_message_type == NULL))
   {
      return false;
   }
   if (!edgedata_ipc_read(fd))
   {
      return false;
   }
   if (!get_package_info(fd, p_message_type, p_sequence, p_msg_control_flags, p_payload, p_payload_len))
   {
      return false;
   }
   return true;
}

/* *************************************************************************************************************** */

/* ************************************ */
/* **********CALLBACK LAYER************ */
/* ************************************ */
void edgedata_callback_with_reply_register(EDGEDATA_IPC_FD* fd, uint32_t message_type, fct_callback_message_with_reply cb)
{
   EDGEDATA_CALLBACK_WITH_REPLY cb_info;
   cb_info.message_type = message_type;
   cb_info.cb = cb;
   fd->callbacks_with_reply.push_back(cb_info);
}

void edgedata_callback_register(EDGEDATA_IPC_FD* fd, uint32_t message_type, fct_callback_message cb)
{
   EDGEDATA_CALLBACK cb_info;
   cb_info.message_type = message_type;
   cb_info.cb = cb;
   fd->callbacks.push_back(cb_info);
}

void edgedata_callback_with_reply(EDGEDATA_IPC_FD* fd, uint32_t message_type, uint32_t sequence, unsigned char* payload, uint32_t payload_len)
{
   unsigned char payload_reply[MAX_PAYLOAD_SIZE];
   uint32_t payload_reply_len = 0;
   (void)memset(payload_reply, 0, sizeof(payload_reply));

   if ((fd == NULL) || (payload == NULL))
   {
      return;
   }
   for (uint32_t i = 0; i < fd->callbacks_with_reply.size(); i++)
   {
      if (fd->callbacks_with_reply[i].message_type == message_type)
      {
         payload_reply_len = fd->callbacks_with_reply[i].cb((void*)fd, payload, payload_len, payload_reply, MAX_PAYLOAD_SIZE);
         /* send reply */
         (void)edgedata_rpc_send_reply(fd, message_type, sequence, payload_reply, payload_reply_len);
         return;
      }
   }
   /* send empty reply */
   ERROR_LOG("edgedata_callback_with_reply: Error Unknown Message Type %d (Return Empty Reply)\n", message_type);
   (void)edgedata_rpc_send_reply(fd, message_type, sequence, payload_reply, 0);
}

void edgedata_callback(EDGEDATA_IPC_FD* fd, uint32_t message_type, uint32_t sequence, unsigned char* payload, uint32_t payload_len)
{
   if ((fd == NULL) || (payload == NULL))
   {
      return;
   }
   for (uint32_t i = 0; i < fd->callbacks.size(); i++)
   {
      if (fd->callbacks[i].message_type == message_type)
      {
         fd->callbacks[i].cb((void*)fd, payload, payload_len);
         return;
      }
   }
   ERROR_LOG("edgedata_callback Error: Unknown Message Type: %d\n", message_type);
}


/* ************************************ */
/* *********** THREAD LAYER *********** */
/* ************************************ */


void* thread_rpc_keep_alive(void* fd)
{
   uint32_t seconds_not_alive = 0;
   uint32_t latest_sequence = 0;
   EDGEDATA_IPC_FD* m_fd = (EDGEDATA_IPC_FD*)fd;
   edgedata_callback_register(m_fd, MSG_TYPE_PING, edgedata_rpc_dummy_ack);
   edgedata_callback_with_reply_register(m_fd, MSG_TYPE_PING, edgedata_rpc_dummy_with_reply_ack);

   INFO_LOG("Keep Alive Thread STARTED\n");
   while (!m_fd->b_shutdown)
   {
      sleep(1);
      if (m_fd->b_shutdown)
      {
         break;
      }
      //INFO_LOG("Compare RPC Sequence %d with latest %d\n", m_fd->sequence, latest_sequence);
      if (m_fd->sequence == latest_sequence)
      {
         seconds_not_alive++;
      }
      else
      {
         seconds_not_alive = 0;
         latest_sequence = m_fd->sequence;
      }

      if (seconds_not_alive >= KEEP_ALIVE_PING_SECONDS)
      {
         seconds_not_alive = 0;
         unsigned char buff[1];
         if (edgedata_rpc_send_request(m_fd, MSG_TYPE_PING, buff, 0))
         {
            INFO_LOG("Send Ping ok\n");
         }
         else
         {
            INFO_LOG("Send Ping failed\n");
            if (m_fd->error_connection_cb != NULL)
            {
               m_fd->error_connection_cb((void*)m_fd);
            }
         }
      }
   }
   return NULL;
}

void edgedata_thread_start_keep_alive(EDGEDATA_IPC_FD* fd)
{
   if (fd == NULL)
   {
      return;
   }
   pthread_create(&fd->p_thread_keep_alive, NULL, &thread_rpc_keep_alive, fd);
}

void* thread_rpc_recv(void* fd)
{
   uint32_t message_type;
   uint32_t sequence;
   uint32_t payload_len;
   uint8_t  control_flags;
   unsigned char* payload;
   EDGEDATA_IPC_FD* m_fd = (EDGEDATA_IPC_FD*)fd;

   INFO_LOG("RECV Thread STARTED\n");
   while (!m_fd->b_shutdown)
   {
      if (!edgedata_rpc_recv(m_fd, &message_type, &sequence, &control_flags, &payload, &payload_len))
      {
         break;
      }

      if (is_request(control_flags))
      {
         edgedata_callback_with_reply(m_fd, message_type, sequence, payload, payload_len);
      }
      else
      {
         edgedata_callback(m_fd, message_type, sequence, payload, payload_len);
      }

      if (is_reply(control_flags))
      {
         edgedata_rpc_inform_about_response(m_fd, sequence);
      }
   }

   if (m_fd->b_shutdown)
   {
      INFO_LOG("Manually shutdown requested\n");
   }
   else
   {
      ERROR_LOG("shutdown caused by recv error\n");
      if (m_fd->error_connection_cb != NULL)
      {
         m_fd->error_connection_cb((void*)m_fd);
      }
   }
   edgedata_rpc_unlock_wait_for_reply_by_timeout(m_fd);
   edgedata_ipc_close(m_fd);
   return NULL;
}

void edgedata_thread_start_thread_recv(EDGEDATA_IPC_FD* fd)
{
   if (fd == NULL)
   {
      return;
   }
   pthread_create(&fd->p_thread_recv, NULL, &thread_rpc_recv, fd);
}

/* *************************************************************************************************************** */

/* ************************************ */
/* *********Edge Data  LAYER*********** */
/* ************************************ */

/* edge_data_handle_list grows from behind and the beginning */
static T_EDGE_DATA_HANDLE edge_data_handle_list[MAX_NUMBER_SUPPORTED_DATAPOINTS + 1];
static T_EDGE_DATA_LIST edge_data_list = { &edge_data_handle_list[0], 0, &edge_data_handle_list[MAX_NUMBER_SUPPORTED_DATAPOINTS], 0 };
static pthread_mutex_t edge_data_access_mutex = PTHREAD_MUTEX_INITIALIZER;

/* ************ GENERAL *************** */
static EdgeDataType convertTypeToFB(E_EDGE_DATA_TYPE type, T_EDGE_DATA_VALUE* value, flatbuffers::Offset<Anonymous0>* retval_ano0, FlatBufferBuilder& builder)
{
   switch (type)
   {
   case E_EDGE_DATA_TYPE_INT32:
      *retval_ano0 = CreateAnonymous0(builder, value->int32);
      return EdgeDataType_Integer32;
   case E_EDGE_DATA_TYPE_UINT32:
      *retval_ano0 = CreateAnonymous0(builder, 0, value->uint32);
      return EdgeDataType_UnsignedInteger32;
   case E_EDGE_DATA_TYPE_INT64:
      *retval_ano0 = CreateAnonymous0(builder, 0, 0, value->int64);
      return EdgeDataType_Integer64;
   case E_EDGE_DATA_TYPE_UINT64:
      *retval_ano0 = CreateAnonymous0(builder, 0, 0, 0, value->uint64);
      return EdgeDataType_UnsignedInteger64;
   case E_EDGE_DATA_TYPE_FLOAT32:
      *retval_ano0 = CreateAnonymous0(builder, 0, 0, 0, 0, value->float32);
      return EdgeDataType_Float32;
   case E_EDGE_DATA_TYPE_DOUBLE64:
      *retval_ano0 = CreateAnonymous0(builder, 0, 0, 0, 0, 0.0f, value->double64);
      return EdgeDataType_Double64;
   case E_EDGE_DATA_TYPE_UNKNOWN:
   default:
      *retval_ano0 = CreateAnonymous0(builder, 0, 0, 0, 0, 0.0f, 0.0);
      return EdgeDataType_Unknown;
   }
}

static E_EDGE_DATA_TYPE convertTypeFromFB(EdgeDataType type, const Anonymous0* ano, T_EDGE_DATA_VALUE* value)
{
   if (ano == NULL)
   {
      ERROR_LOG("convertTypeFromFB Value missing\n");
      return E_EDGE_DATA_TYPE_UNKNOWN;
   }
   switch (type)
   {
   case EdgeDataType_Integer32:
      value->int32 = ano->integer32();
      return E_EDGE_DATA_TYPE_INT32;
   case EdgeDataType_UnsignedInteger32:
      value->uint32 = ano->unsignedInteger32();
      return E_EDGE_DATA_TYPE_UINT32;
   case EdgeDataType_Integer64:
      value->int64 = ano->integer64();
      return E_EDGE_DATA_TYPE_INT64;
   case EdgeDataType_UnsignedInteger64:
      value->uint64 = ano->unsignedInteger64();
      return E_EDGE_DATA_TYPE_UINT64;
   case EdgeDataType_Float32:
      value->float32 = ano->float32();
      return E_EDGE_DATA_TYPE_FLOAT32;
   case EdgeDataType_Double64:
      value->double64 = ano->double64();
      return E_EDGE_DATA_TYPE_DOUBLE64;
   case EdgeDataType_Unknown:
   default:
      ERROR_LOG("convertTypeFromFB Unkonwn Datatype\n");
      value->int64 = 0;
      return E_EDGE_DATA_TYPE_UNKNOWN;
   }
}

uint32_t edgedata_data_print_value(T_EDGE_DATA_VALUE* value, E_EDGE_DATA_TYPE type, char* value_as_text, uint32_t max_len_value_as_string)
{
   uint32_t pos = 0;
   switch (type)
   {
   case    E_EDGE_DATA_TYPE_INT32:
      pos = snprintf(value_as_text, max_len_value_as_string, "%d", value->int32);
      break;
   case	E_EDGE_DATA_TYPE_UINT32:
      pos = snprintf(value_as_text, max_len_value_as_string, "%u", value->uint32);
      break;
   case	E_EDGE_DATA_TYPE_INT64:
      pos = snprintf(value_as_text, max_len_value_as_string, "%" PRId64, value->int64);
      break;
   case	E_EDGE_DATA_TYPE_UINT64:
      pos = snprintf(value_as_text, max_len_value_as_string, "%" PRIu64, value->uint64);
      break;
   case	E_EDGE_DATA_TYPE_FLOAT32:
      pos = snprintf(value_as_text, max_len_value_as_string, "%f", value->float32);
      break;
   case	E_EDGE_DATA_TYPE_DOUBLE64:
      pos = snprintf(value_as_text, max_len_value_as_string, "%lf", value->double64);
      break;
   case E_EDGE_DATA_TYPE_UNKNOWN:
   default:
      pos = snprintf(value_as_text, max_len_value_as_string, "UNKNOWN");
      break;
   }
   return pos;
}

void edgedata_data_print_state(EDGEDATA_IPC_FD* fd)
{
   ENTER_ACCESS_DATA();
   ERROR_LOG("edgedata_data_print_state data: (INTERNAL-EXTERNAL)\n");
   for (map<uint32_t, EDGEDATA_VALUES>::iterator it = fd->read_values.begin(); it != fd->read_values.end(); it++)
   {
      T_EDGE_DATA* entry = it->second.internal;
      T_EDGE_DATA* entry2 = it->second.external;
      ERROR_LOG("READ Topic: %s, handle: %d-%d, quality: %d-%d, type; %d-%d, timestamp: %ld-%ld, value: %d-%d\n",
         entry->topic, entry->handle, entry2->handle,
         entry->quality, entry2->quality,
         entry->type, entry2->type, entry->timestamp64, entry2->timestamp64,
         entry->value.uint32, entry2->value.uint32);
   }
   for (map<uint32_t, EDGEDATA_VALUES>::iterator it = fd->write_values.begin(); it != fd->write_values.end(); it++)
   {
      T_EDGE_DATA* entry = it->second.internal;
      T_EDGE_DATA* entry2 = it->second.external;
      ERROR_LOG("READ Topic: %s, handle: %d-%d, quality: %d-%d, type; %d-%d, timestamp: %ld-%ld, value: %d-%d\n",
         entry->topic, entry->handle, entry2->handle,
         entry->quality, entry2->quality,
         entry->type, entry2->type, entry->timestamp64, entry2->timestamp64,
         entry->value.uint32, entry2->value.uint32);
   }
   LEAVE_ACCESS_DATA();
}

void edgedata_data_cleanup(EDGEDATA_IPC_FD** fd)
{
   ENTER_ACCESS_DATA();
   if (fd != NULL)
   {
      if (*fd != NULL)
      {
         //TODO check if memory leak after disconnect!!!!!!!!!
         for (map<uint32_t, EDGEDATA_VALUES>::iterator it = (*fd)->read_values.begin(); it != (*fd)->read_values.end(); it++)
         {
            delete it->second.p_topic;
            delete it->second.internal;
            delete it->second.external;
         }
         for (map<uint32_t, EDGEDATA_VALUES>::iterator it = (*fd)->write_values.begin(); it != (*fd)->write_values.end(); it++)
         {
            delete it->second.p_topic;
            delete it->second.internal;
            delete it->second.external;
         }
         delete (*fd);
      }
      *fd = NULL;
   }
   LEAVE_ACCESS_DATA();
}

/* ************ Event Data Update ************ */
void edgedata_data_event_message_info(EDGEDATA_IPC_FD* fd, const edgedata_flatbuffers::EdgeDataInfo* t) /* TODO APPEND HERE WITH MULTIPLE EVENTS */
{
   /* Update data */

   ENTER_ACCESS_DATA();
   map<uint32_t, EDGEDATA_VALUES>::iterator it = fd->read_values.find(t->handle());
   if (it != fd->read_values.end())
   {
      //T_EDGE_DATA_VALUE value;
      const Anonymous0* ano0 = t->value();
      it->second.internal->type = convertTypeFromFB(t->type(), ano0, &it->second.internal->value);
      it->second.internal->quality = t->quality();
      it->second.internal->timestamp64 = t->timestamp64();
      // edgedata_data_print_value (&it->second.internal->value, it->second.internal->type, str_value, sizeof (str_value) - 1);
      // INFO_LOG ("Topic %s updated with value: %s\n", it->second.internal->topic, str_value);
   }
   LEAVE_ACCESS_DATA();

   /* Trigger Callback if available */
   it = fd->read_values.find(t->handle());
   if (it != fd->read_values.end())
   {
      if (it->second.cb != NULL)
      {
         T_EDGE_DATA copy_data;
         (void)memcpy(&copy_data, it->second.internal, sizeof(T_EDGE_DATA));
         it->second.cb(&copy_data);
      }
   }
   /* Update WRITE data */
   ENTER_ACCESS_DATA();
   it = fd->write_values.find(t->handle());
   if (it != fd->write_values.end())
   {
      //T_EDGE_DATA_VALUE value;
      const Anonymous0* ano0 = t->value();
      it->second.internal->type = convertTypeFromFB(t->type(), ano0, &it->second.internal->value);
      it->second.internal->quality = t->quality();
      it->second.internal->timestamp64 = t->timestamp64();
   }
   LEAVE_ACCESS_DATA();

   /* Trigger Callback if available */
   it = fd->write_values.find(t->handle());
   if (it != fd->write_values.end())
   {
      if (it->second.cb != NULL)
      {
         T_EDGE_DATA copy_data;
         (void)memcpy(&copy_data, it->second.internal, sizeof(T_EDGE_DATA));
         it->second.cb(&copy_data);
      }
   }
}

/* ************ Discover Data Update ********** */
static void edgedata_data_clean_discover_info()
{
   (void)memset(edge_data_handle_list, 0, sizeof(edge_data_handle_list));
   edge_data_list.read_handle_list = &edge_data_handle_list[0];
   edge_data_list.write_handle_list = &edge_data_handle_list[MAX_NUMBER_SUPPORTED_DATAPOINTS];
   edge_data_list.read_handle_list_len = 0;
   edge_data_list.write_handle_list_len = 0;
}

void edgedata_data_update_discover_info(EDGEDATA_IPC_FD* fd, const flatbuffers::VectorIterator<flatbuffers::Offset<edgedata_flatbuffers::EdgeDataInfo>, const edgedata_flatbuffers::EdgeDataInfo*> t)
{
   uint32_t source = t->source();

   DEBUG_FB_LOG("Add to discover list\n");
   map<uint32_t, EDGEDATA_VALUES>::iterator it;
   if ((source & EDGE_SOURCE_FLAG_READ) != 0)
   {
      it = fd->read_values.find(t->handle());
      if (it != fd->read_values.end())
      {
         ERROR_LOG("Entry already exists in discover read list\n");
         return;
      }
   }
   else
   {
      it = fd->write_values.find(t->handle());
      if (it != fd->write_values.end())
      {
         ERROR_LOG("Entry already exists in discover write list\n");
         return;
      }
   }

   if ((edge_data_list.read_handle_list_len + edge_data_list.write_handle_list_len) >= MAX_NUMBER_SUPPORTED_DATAPOINTS)
   {
      ERROR_LOG("Too many discover objects!\n");
      return;
   }
   /* add it (its new)       */
   EDGEDATA_VALUES values;
   T_EDGE_DATA value_info;
   values.p_topic = new std::string();
   values.p_topic->assign(t->topic()->c_str());
   value_info.topic = values.p_topic->c_str();
   value_info.handle = t->handle();
   const Anonymous0* ano0 = t->value();
   value_info.type = convertTypeFromFB(t->type(), ano0, &value_info.value);
   value_info.quality = t->quality();
   value_info.timestamp64 = t->timestamp64();

   if ((source & EDGE_SOURCE_FLAG_READ) != 0)
   {
      values.internal = new T_EDGE_DATA(value_info);
      values.external = new T_EDGE_DATA(value_info);
      values.cb = NULL;
      fd->read_values.insert(std::make_pair(value_info.handle, values));
      edge_data_list.read_handle_list[edge_data_list.read_handle_list_len] = value_info.handle;
      edge_data_list.read_handle_list_len++;
   }
   if ((source & EDGE_SOURCE_FLAG_WRITE) != 0)
   {
      values.internal = new T_EDGE_DATA(value_info);
      values.external = new T_EDGE_DATA(value_info);
      values.cb = NULL;
      fd->write_values.insert(std::make_pair(value_info.handle, values));
      edge_data_list.write_handle_list--;
      edge_data_list.write_handle_list[0] = value_info.handle;  /* the write list grows in opposite direction !! */
      edge_data_list.write_handle_list_len++;
   }
}

/* Only server side using */
bool edgedata_data_discover_add(EDGEDATA_IPC_FD* fd, const char* topic, uint32_t handle, E_EDGE_DATA_TYPE type, uint32_t source, uint32_t quality, T_EDGE_DATA_VALUE* init_value, int64_t init_timestamp, cb_edge_data_subscribe cb)
{
   EDGEDATA_VALUES values;
   T_EDGE_DATA internal;

   if (fd->read_values.size() + fd->write_values.size() >= MAX_NUMBER_SUPPORTED_DATAPOINTS)
   {
      return false;
   }

   values.p_topic = new string();
   values.p_topic->assign(topic);
   internal.topic = values.p_topic->c_str();
   internal.handle = handle;
   internal.type = type;
   internal.quality = quality;
   (void)memset(&internal.value, 0, sizeof(T_EDGE_DATA_VALUE));
   memcpy(&internal.value, init_value, sizeof(T_EDGE_DATA_VALUE));
   internal.timestamp64 = init_timestamp;
   values.internal = new T_EDGE_DATA(internal);
   values.external = new T_EDGE_DATA(internal);
   values.cb = cb;
   if (source == EDGE_SOURCE_FLAG_READ)
   {
      fd->read_values.insert(std::make_pair(handle, values));
      fd->it_read_discover_info = fd->read_values.begin();
   }
   else
   {
      fd->write_values.insert(std::make_pair(handle, values));
      fd->it_write_discover_info = fd->write_values.begin();
   }
   return true;
}

/* ************************************ */
/* *********FB DATA    LAYER*********** */
/* ************************************ */

/* ************ DISOVER *************** */

/* Build Discover Reply on Server side */
uint32_t edgedata_flatbuffers_discover_serialize(EDGEDATA_IPC_FD* fd, unsigned char* p_payload, uint32_t max_payload_len)
{
   uint32_t serialized_datapoints = 0;

   DEBUG_FB_LOG("Enter edgedata_flatbuffers_discover_serialize\n");

   FlatBufferBuilder builder(MSG_MAX_FULL_SIZE);
   std::vector<flatbuffers::Offset<EdgeDataInfo>> discover_list;
   /* serialize read topics */
   for (; (fd->it_read_discover_info != fd->read_values.end() && serialized_datapoints < MAX_DISCOVERED_DATAPOINTS_PER_MSG); fd->it_read_discover_info++)
   {
      T_EDGE_DATA* entry = fd->it_read_discover_info->second.internal;
      auto topic = builder.CreateString(entry->topic);
      flatbuffers::Offset<Anonymous0> ano0;
      EdgeDataType type = convertTypeToFB(entry->type, &entry->value, &ano0, builder);
      auto new_discover_entry = CreateEdgeDataInfo(builder, topic, entry->handle, type, EDGE_SOURCE_FLAG_READ, entry->quality, entry->timestamp64, ano0);
      discover_list.push_back(new_discover_entry);
      serialized_datapoints++;
   }
   /* serialize write topics */
   for (; (fd->it_write_discover_info != fd->write_values.end() && serialized_datapoints < MAX_DISCOVERED_DATAPOINTS_PER_MSG); fd->it_write_discover_info++)
   {
      T_EDGE_DATA* entry = fd->it_write_discover_info->second.internal;
      auto topic = builder.CreateString(entry->topic);
      flatbuffers::Offset<Anonymous0> ano0;
      EdgeDataType type = convertTypeToFB(entry->type, &entry->value, &ano0, builder);
      auto new_discover_entry = CreateEdgeDataInfo(builder, topic, entry->handle, type, EDGE_SOURCE_FLAG_WRITE, entry->quality, entry->timestamp64, ano0);
      discover_list.push_back(new_discover_entry);
      serialized_datapoints++;
   }
   auto discover_list_vector = builder.CreateVector(discover_list);
   EdgeDiscoverMessageBuilder discover_message_builder(builder);
   discover_message_builder.add_DiscoverList(discover_list_vector);
   builder.Finish(discover_message_builder.Finish());

   if (serialized_datapoints == 0)
   {
      DEBUG_FB_LOG("no more discover messages left (send last empty one)\n");
      return 0;
   }
   if (builder.GetSize() < max_payload_len)
   {
      memcpy(p_payload, builder.GetBufferPointer(), builder.GetSize());
      DEBUG_FB_LOG("discover message serialize finish\n");
      return builder.GetSize();
   }
   ERROR_LOG("edgedata_flatbuffer_discover_build Size Overflow of Discover Message %d (builder.GetSize()) < %d (max payload_len)\n", builder.GetSize(), max_payload_len);
   return 0;
}

/* Parse Discover Reply on Client Side */
void edgedata_flatbuffers_discover_message_parse(void* fd, unsigned char* p_payload, uint32_t payload_len)
{
   DEBUG_FB_LOG("Enter edgedata_flatbuffers_discover_message_parse\n");
   if (payload_len == 0)
   {
      return;
   }
   flatbuffers::Verifier verifier(p_payload, payload_len);
   if (!verifier.VerifyBuffer<edgedata_flatbuffers::EdgeDiscoverMessage>(nullptr))
   {
      ERROR_LOG("Error flatbuffer\n");
      return;
   }
   const edgedata_flatbuffers::EdgeDiscoverMessage* discover_reply = flatbuffers::GetRoot<edgedata_flatbuffers::EdgeDiscoverMessage>(p_payload);
   EDGEDATA_IPC_FD* m_fd = (EDGEDATA_IPC_FD*)fd;

   if (discover_reply == NULL)
   {
      ERROR_LOG("edgedata_flatbuffers_discover_message_parse parse error\n");
      return;
   }
   const flatbuffers::Vector<flatbuffers::Offset<EdgeDataInfo>>* p_discover_list = discover_reply->DiscoverList();
   if (p_discover_list == NULL)
   {
      ERROR_LOG("edgedata_flatbuffers_discover_message_parse parse error 2\n");
      return;
   }

   /* iterate over discover list */
   for (auto t = p_discover_list->begin(); t != p_discover_list->end(); t++)
   {
      edgedata_data_update_discover_info(m_fd, t);
   }
}

/* Server side callback for discover request with reply */
uint32_t edgedata_flatbuffers_discover_with_reply(void* fd, unsigned char* payload, uint32_t payload_len, unsigned char* payload_reply, uint32_t max_payload_reply_len)
{
   /*
   if (payload_len == 0)
   {
   }
   else
   {  // app sends discover info 
   } */
   /* Server side */
   return edgedata_flatbuffers_discover_serialize((EDGEDATA_IPC_FD*)fd, payload_reply, max_payload_reply_len);
}



/* ************ EVENT MSG************** */
/* Send a single event */
bool edgedata_flatbuffers_edge_event_send(void* fd, uint32_t handle, E_EDGE_DATA_TYPE type, uint32_t quality, T_EDGE_DATA_VALUE* value, int64_t timestamp64)
{
   FlatBufferBuilder builder(MSG_MAX_FULL_SIZE);
   flatbuffers::Offset<Anonymous0> ano0;
   EdgeDataType type_fb = convertTypeToFB(type, value, &ano0, builder);
   auto new_event = CreateEdgeDataInfo(builder, 0, handle, type_fb, EDGE_SOURCE_FLAG_READ, quality, timestamp64, ano0);

   EdgeDataEventMessageBuilder event_message_builder(builder);
   event_message_builder.add_event(new_event);
   builder.Finish(event_message_builder.Finish());
   EDGEDATA_IPC_FD* m_fd = (EDGEDATA_IPC_FD*)fd;
   return edgedata_rpc_send_request(m_fd, MSG_TYPE_UPDATE_DATA, builder.GetBufferPointer(), builder.GetSize());
}

/* Client Callback to process incomming events */
uint32_t edgedata_flatbuffers_edge_event_receive(void* fd, unsigned char* payload, uint32_t payload_len, unsigned char* payload_reply, uint32_t max_payload_reply_len)
{
   if (payload_len == 0)
   {
      return 0;
   }
   flatbuffers::Verifier verifier(payload, payload_len);
   if (!verifier.VerifyBuffer<edgedata_flatbuffers::EdgeDataEventMessage>(nullptr))
   {
      ERROR_LOG("Error flatbuffer\n");
      return 0;
   }
   const edgedata_flatbuffers::EdgeDataEventMessage* event_request = flatbuffers::GetRoot<edgedata_flatbuffers::EdgeDataEventMessage>(payload);  //?????? MISSING ???????
   EDGEDATA_IPC_FD* m_fd = (EDGEDATA_IPC_FD*)fd;

   if (event_request == NULL)
   {
      ERROR_LOG("edgedata_flatbuffers_discover_message_parse parse error\n");
      return 0;
   }
   edgedata_data_event_message_info(m_fd, event_request->event());
   return 0;
}


/* ************************************ */
/* ****Application Interface LAYER***** */
/* ************************************ */

/* static */ EDGEDATA_IPC_FD* edge_data_fd = NULL;
static pthread_mutex_t edge_app_access_mutex = PTHREAD_MUTEX_INITIALIZER;

E_EDGE_DATA_RETVAL edge_data_connect_internal(bool auto_retry)
{
   uint32_t number_of_discoverd_elements = 0;
   E_EDGE_DATA_RETVAL ret = E_EDGE_DATA_RETVAL_OK;
   if (edge_data_fd != NULL)
   {
      edge_data_disconnect();
   }
   ENTER_ACCESS_APP();
   edge_data_fd = edgedata_ipc_unix_client_connect("/edgedata/edgedata");
   //edge_data_fd = edgedata_ipc_fifo_client_connect("edge_data.fifo");  
   if (edge_data_fd == NULL)
   {
      ERROR_LOG("edge_data_connect cant connect\n");
      ret = E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY;
   }
   else
   {
      ENTER_ACCESS_DATA();
      memset(edge_data_handle_list, 0, sizeof(edge_data_handle_list));
      edge_data_list.read_handle_list = &edge_data_handle_list[0];
      edge_data_list.write_handle_list = &edge_data_handle_list[MAX_NUMBER_SUPPORTED_DATAPOINTS];
      edge_data_list.read_handle_list_len = 0;
      edge_data_list.write_handle_list_len = 0;
      LEAVE_ACCESS_DATA();

      /* Callback used to process reply from inital discover request */
      (void)edgedata_callback_register(edge_data_fd, MSG_TYPE_DISCOVER, edgedata_flatbuffers_discover_message_parse);
      (void)edgedata_callback_with_reply_register(edge_data_fd, MSG_TYPE_UPDATE_DATA, edgedata_flatbuffers_edge_event_receive);
      (void)edgedata_callback_register(edge_data_fd, MSG_TYPE_UPDATE_DATA, edgedata_rpc_dummy_ack);
      /* start recv thread */
      edgedata_thread_start_thread_recv(edge_data_fd);
      /* start keep alive thread */
      edgedata_thread_start_keep_alive(edge_data_fd);

      unsigned char tmp_write[1];
      /* request discover info (as long as response is empty) */

      INFO_LOG("SEND INITIAL DISCOVER REQUEST\n");
      do
      {
         /* save actual of read and write value position */
         number_of_discoverd_elements = edge_data_fd->read_values.size() + edge_data_fd->write_values.size();
         if (edgedata_rpc_send_request(edge_data_fd, MSG_TYPE_DISCOVER, tmp_write, 0))
         {
            INFO_LOG("SEND DISCOVER REQUEST (SubMessage) finished\n");
         }
         else
         {
            ERROR_LOG("SEND INITIAL DISCOVER REQUEST failed\n");
            ret = E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY;
            break;
         }
         /* while no changes detected */
      } while (number_of_discoverd_elements != (edge_data_fd->read_values.size() + edge_data_fd->write_values.size()));
   }
   /* reorder discover list by topic */

   LEAVE_ACCESS_APP();
   /* error->clean up */
   if (ret != E_EDGE_DATA_RETVAL_OK)
   {
      if (auto_retry)
      {  /* try once after reconnect but sleep 10 seconds */
         ERROR_LOG("Opposite is maybe not ready, wait 10 Seconds\n");
         sleep(10);
         ERROR_LOG("Try to reconnect\n");
         return edge_data_connect_internal(false);
      }
      edge_data_disconnect();
   }
   INFO_LOG("SEND DISCOVER REQUEST finished\n");
   return ret;
}

E_EDGE_DATA_RETVAL edge_data_disconnect()
{
   ENTER_ACCESS_APP();
   if (edge_data_fd != NULL)
   {
      INFO_LOG("edge_data_disconnect\n");
      edgedata_ipc_disconnect(&edge_data_fd);
   }
   ENTER_ACCESS_DATA();
   edgedata_data_clean_discover_info();
   LEAVE_ACCESS_DATA();
   LEAVE_ACCESS_APP();
   sleep(1);
   return E_EDGE_DATA_RETVAL_OK;
}

E_EDGE_DATA_RETVAL edge_data_connect()
{
   return edge_data_connect_internal(true);
}

const T_EDGE_DATA_LIST* edge_data_discover()
{
   T_EDGE_DATA_LIST* ret = NULL;
   ENTER_ACCESS_DATA();
   if (edge_data_fd != NULL)
   {
      ret = &edge_data_list;
   }
   LEAVE_ACCESS_DATA();
   return ret;
}


T_EDGE_DATA_HANDLE edge_data_get_readable_handle(const char* topic)
{
   T_EDGE_DATA_HANDLE ret = 0;
   ENTER_ACCESS_DATA();
   if (edge_data_fd != NULL)
   {
      for (map<uint32_t, EDGEDATA_VALUES>::iterator it = edge_data_fd->read_values.begin(); it != edge_data_fd->read_values.end(); it++)
      {
         T_EDGE_DATA* entry = it->second.external;
         if (strncmp(entry->topic, topic, 100) == 0)
         {
            ret = it->second.external->handle;
            break;
         }
      }
   }
   LEAVE_ACCESS_DATA();
   return ret;
}

T_EDGE_DATA_HANDLE edge_data_get_writeable_handle(const char* topic)
{
   T_EDGE_DATA_HANDLE ret = 0;
   ENTER_ACCESS_DATA();
   if (edge_data_fd != NULL)
   {
      for (map<uint32_t, EDGEDATA_VALUES>::iterator it = edge_data_fd->write_values.begin(); it != edge_data_fd->write_values.end(); it++)
      {
         T_EDGE_DATA* entry = it->second.external;
         if (strncmp(entry->topic, topic, 100) == 0)
         {
            ret = it->second.external->handle;
            break;
         }
      }
   }
   LEAVE_ACCESS_DATA();
   return ret;
}

T_EDGE_DATA* edge_data_get_data(T_EDGE_DATA_HANDLE handle)
{
   T_EDGE_DATA* ret = NULL;
   ENTER_ACCESS_DATA();
   if (edge_data_fd != NULL)
   {
      map<uint32_t, EDGEDATA_VALUES>::iterator it = edge_data_fd->read_values.find(handle);
      /* found as read handle? */
      if (it != edge_data_fd->read_values.end()) {
         T_EDGE_DATA* entry = it->second.external;
         if (entry->handle == handle)
         {
            ret = it->second.external;
            LEAVE_ACCESS_DATA();
            return ret;
         }
      }
      it = edge_data_fd->write_values.find(handle);
      /* found as write handle? */
      if (it != edge_data_fd->write_values.end()) {
         T_EDGE_DATA* entry = it->second.external;
         if (entry->handle == handle)
         {
            ret = it->second.external;
         }
      }
   }
   LEAVE_ACCESS_DATA();
   return ret;
}


E_EDGE_DATA_RETVAL edge_data_sync_read(T_EDGE_DATA_HANDLE* read_handle_list, uint32_t read_handle_list_len)
{
   E_EDGE_DATA_RETVAL ret = E_EDGE_DATA_RETVAL_OK;
   ENTER_ACCESS_DATA();
   if (read_handle_list == NULL)
   {
      ret = E_EDGE_DATA_RETVAL_NOK;
   }
   else if (edge_data_fd == NULL)
   {
      ret = E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY;
   }
   else if (!edge_data_fd->b_connected)
   {
      ret = E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY;
   }
   else
   {
      for (uint32_t pos = 0; pos < read_handle_list_len; pos++)
      {
         map<uint32_t, EDGEDATA_VALUES>::iterator it = edge_data_fd->read_values.find(read_handle_list[pos]);
         /* found handle? */
         if (it != edge_data_fd->read_values.end())
         {   /* yes, update value */
            (void)memcpy(&it->second.external->value, &it->second.internal->value, sizeof(it->second.internal->value));
            it->second.external->quality = it->second.internal->quality;
            it->second.external->timestamp64 = it->second.internal->timestamp64;
         }
         else
         {
            ERROR_LOG("edge_data_sync_read Invalid Handle\n");
            ret = E_EDGE_DATA_RETVAL_UNKNOWN_HANDLE;
            break;
         }
      }
   }
   LEAVE_ACCESS_DATA();
   return ret;
}

/** Write list of handles out **/
E_EDGE_DATA_RETVAL edge_data_sync_write(T_EDGE_DATA_HANDLE* write_handle_list, uint32_t write_handle_list_len)
{
   E_EDGE_DATA_RETVAL ret = E_EDGE_DATA_RETVAL_OK;
   struct timeval tv;
   int64_t timestamp64_sync_time = 0;
   if (gettimeofday(&tv, NULL) == 0)
   {
      timestamp64_sync_time = ((int64_t)((int64_t)tv.tv_sec * 1000000000) + (int64_t)((int64_t)tv.tv_usec * 1000));
   }
   ENTER_ACCESS_APP();
   if (write_handle_list == NULL)
   {
      ret = E_EDGE_DATA_RETVAL_NOK;
   }
   else if (edge_data_fd == NULL)
   {
      ret = E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY;
   }
   else if (!edge_data_fd->b_connected)
   {
      ret = E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY;
   }
   else
   {
      ENTER_ACCESS_DATA();
      for (uint32_t pos = 0; pos < write_handle_list_len; pos++)
      {
         map<uint32_t, EDGEDATA_VALUES>::iterator it = edge_data_fd->write_values.find(write_handle_list[pos]);
         /* found handle? */
         if (it != edge_data_fd->write_values.end())
         {   /* write out value */
            (void)memcpy(it->second.internal, it->second.external, sizeof(T_EDGE_DATA));
            int64_t timestamp64 = it->second.internal->timestamp64;
            uint32_t handle = it->second.internal->handle;
            E_EDGE_DATA_TYPE type = it->second.internal->type;
            uint32_t quality = it->second.internal->quality;
            T_EDGE_DATA_VALUE value;
            (void)memcpy(&value, &it->second.internal->value, sizeof(T_EDGE_DATA_VALUE));
            /* time stamp available ? */
            if (timestamp64 == 0)
            {
               timestamp64 = timestamp64_sync_time;
            }
            LEAVE_ACCESS_DATA();
            edgedata_flatbuffers_edge_event_send((void*)edge_data_fd, handle, type, quality, &value, timestamp64);
            ENTER_ACCESS_DATA();
         }
         else
         {
            ERROR_LOG("edge_data_sync_write Invalid Handle\n");
            ret = E_EDGE_DATA_RETVAL_UNKNOWN_HANDLE;
            break;
         }
      }
      LEAVE_ACCESS_DATA();
   }
   LEAVE_ACCESS_APP();
   return ret;
}

/** Subscribe for a change indication **/
E_EDGE_DATA_RETVAL edge_data_subscribe_event(uint32_t handle, cb_edge_data_subscribe cb)
{
   E_EDGE_DATA_RETVAL ret = E_EDGE_DATA_RETVAL_OK;
   ENTER_ACCESS_DATA();
   if (edge_data_fd == NULL)
   {
      ret = E_EDGE_DATA_RETVAL_ERROR_CONNECTIVITY;
   }
   else
   {
      map<uint32_t, EDGEDATA_VALUES>::iterator it = edge_data_fd->read_values.find(handle);
      /* unknown handle? */
      if (it == edge_data_fd->read_values.end())
      {
         ERROR_LOG("edge_data_subscribe_event Invalid Handle\n");
         ret = E_EDGE_DATA_RETVAL_UNKNOWN_HANDLE;
      }
      else
      {
         it->second.cb = cb;
      }
   }
   LEAVE_ACCESS_DATA();
   return ret;
}

/** Register a logger callback **/
E_EDGE_DATA_RETVAL edge_data_register_logger(cb_edge_data_logger cb)
{
   ENTER_ACCESS_DATA();
   s_cb = cb;
   LEAVE_ACCESS_DATA();
   return E_EDGE_DATA_RETVAL_OK;
}


