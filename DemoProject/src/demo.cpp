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

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <alloca.h>
#include <fcgiapp.h>
#include <edgedata.h>
#include <vector>
#include <string>
#include <list>
#include <iterator>
#include <pthread.h>
#include <unistd.h>

#define XML_STATUS_CONNECTED    "1"
#define XML_STATUS_DISCONNECTED "0"

#define XML_OPEN  "<EdgeData>"
#define XML_ENTRY "<EdgeDataValue>"\
                  "<Topic>%s</Topic>"\
                  "<Handle>%u</Handle>"\
                  "<Source>%s</Source>"\
                  "<Type>%s</Type>"\
                  "<Value>%s</Value>"\
                  "<Quality>%s</Quality>"\
                  "<Timestamp>%lld</Timestamp>"\
                  "</EdgeDataValue>"
#define XML_CLOSE "<Status>%s</Status></EdgeData>"

#define EVENTS_LENGTH 50

using namespace std;

static int readFromStream(char* buffer, int max_size_buffer, FCGX_Stream* stream);
static uint32_t setResponseHeader(char* buffer, int max_len_buffer, int response_status_code);
static vector<string> parseXML(const string& text, string tag);
static void edgedata_logger(const char* info);
static void edgedata_logger_format(const char* format, ...);
static void edgedata_callback(T_EDGE_DATA* event);

static pthread_mutex_t s_mutex;
static pthread_mutex_t s_mutex_log;

static bool s_connected = false;
static vector<T_EDGE_DATA*> s_read_list, s_write_list;

struct T_EDGE_EVENT{
public:
   string                        topic;         /* value name    */
   uint32_t                      handle;        /* value handle  */
   E_EDGE_DATA_TYPE              type;          /* value type    */
   uint32_t                      quality;       /* see EDGE_QUALITY_FLAG_ defines ... for details */
   T_EDGE_DATA_VALUE             value;         /* value         */
   int64_t                       timestamp64;   /* timestamp     */
};


static vector<T_EDGE_EVENT> event_list;

static FILE* log_file_p = NULL;

static void convert_str_to_value(E_EDGE_DATA_TYPE type, const char* in, T_EDGE_DATA* out)
{
   switch (type)
   {
   case E_EDGE_DATA_TYPE_INT32:
      out->value.int32 = strtol(in, NULL, 10);
      break;
   case E_EDGE_DATA_TYPE_UINT32:
      out->value.uint32 = strtoul(in, NULL, 10);
      break;
   case E_EDGE_DATA_TYPE_INT64:
      out->value.int64 = strtoll(in, NULL, 10);
      break;
   case E_EDGE_DATA_TYPE_UINT64:
      out->value.uint64 = strtoull(in, NULL, 10);
      break;
   case E_EDGE_DATA_TYPE_FLOAT32:
      out->value.float32 = strtof(in, NULL);
      break;
   case E_EDGE_DATA_TYPE_DOUBLE64:
      out->value.double64 = strtod(in, NULL);
      break;
   case E_EDGE_DATA_TYPE_UNKNOWN:
   default:
      out->value.uint64 = 0;
      break;
   }
}

static void convert_quality_str_to_value(const char* in, T_EDGE_DATA* out)
{
   uint32_t quality = EDGE_QUALITY_VALID_VALUE;
   if ((strstr(in, "|NT") != NULL) || (strncmp(in, "NT", 2) == 0))
   {
      quality += EDGE_QUALITY_FLAG_NOT_TOPICAL;
   }
   if ((strstr(in, "|OV") != NULL) || (strncmp(in, "OV", 2) == 0))
   {
      quality += EDGE_QUALITY_FLAG_OVERFLOW;
   }
   if ((strstr(in, "|OB") != NULL) || (strncmp(in, "OB", 2) == 0))
   {
      quality += EDGE_QUALITY_FLAG_OPERATOR_BLOCKED;
   }
   if ((strstr(in, "|SB") != NULL) || (strncmp(in, "SB", 2) == 0))
   {
      quality += EDGE_QUALITY_FLAG_SUBSITUTED;
   }
   if ((strstr(in, "|T") != NULL) || (strncmp(in, "T", 1) == 0))
   {
      quality += EDGE_QUALITY_FLAG_TEST;
   }
   if ((strstr(in, "|IV") != NULL) || (strncmp(in, "IV", 2) == 0))
   {
      quality += EDGE_QUALITY_FLAG_INVALID;
   }
   out->quality = quality;
}

static void convert_value_to_str(T_EDGE_DATA_VALUE* value, E_EDGE_DATA_TYPE type, char* out_value, char* out_type)
{
   switch (type)
   {
   case E_EDGE_DATA_TYPE_INT32:
      sprintf(out_value, "%d", value->int32);
      sprintf(out_type, "INT32");
      break;
   case E_EDGE_DATA_TYPE_UINT32:
      sprintf(out_value, "%u", value->uint32);
      sprintf(out_type, "UINT32");
      break;
   case E_EDGE_DATA_TYPE_INT64:
      sprintf(out_value, "%lld", value->int64);
      sprintf(out_type, "INT64");
      break;
   case E_EDGE_DATA_TYPE_UINT64:
      sprintf(out_value, "%llu", value->uint64);
      sprintf(out_type, "UINT64");
      break;
   case E_EDGE_DATA_TYPE_FLOAT32:
      sprintf(out_value, "%f", value->float32);
      sprintf(out_type, "FLOAT32");
      break;
   case E_EDGE_DATA_TYPE_DOUBLE64:
      sprintf(out_value, "%lf", value->double64);
      sprintf(out_type, "DOUBLE64");
      break;
   case E_EDGE_DATA_TYPE_UNKNOWN:
   default:
      sprintf(out_value, "%u", 0);
      sprintf(out_type, "UNKNOWN");
      break;
   }
}

static void convert_quality_to_str(uint32_t quality, char* out)
{
   strcpy(out, "");
   if (quality & EDGE_QUALITY_FLAG_NOT_TOPICAL)
   {
      strcat(out, "NT|");
   }
   if (quality & EDGE_QUALITY_FLAG_OVERFLOW)
   {
      strcat(out, "OV|");
   }
   if (quality & EDGE_QUALITY_FLAG_OPERATOR_BLOCKED)
   {
      strcat(out, "OB|");
   }
   if (quality & EDGE_QUALITY_FLAG_SUBSITUTED)
   {
      strcat(out, "SB|");
   }
   if (quality & EDGE_QUALITY_FLAG_TEST) 
   {
      strcat(out, "T|");
   }
   if (quality & EDGE_QUALITY_FLAG_INVALID) 
   {
      strcat(out, "IV|");
   }
   if (strlen(out) > 0)
   {  /* remove '|' at the end */
      out[strlen(out) - 1] = '\0';
   }
}

vector<T_EDGE_DATA*> parseGetDataRequest(const string& text) 
{
   vector<T_EDGE_DATA*> parsed_values;
   vector<string> EdgeDataTag = parseXML(text, "EdgeData");
   if (EdgeDataTag.size() == 1) 
   {
      /* search <EdgeDataValue> tag */
      vector<string> EdgeDataEntryTag = parseXML(EdgeDataTag[0], "EdgeDataValue");
      if (EdgeDataEntryTag.size() > 0) 
      {
         /* search in content of <EdgeDataValue> tag for different tags */
         for (uint32_t i = 0; i < EdgeDataEntryTag.size(); i++) 
         {
            T_EDGE_DATA new_entry;
            E_EDGE_DATA_TYPE type = E_EDGE_DATA_TYPE_UNKNOWN;
            (void)memset(&new_entry, 0, sizeof(new_entry));
            /* search <Handle>, <Value>, <Quality>, <Timestamp> tags */
            vector<string> EdgeDataEntryTag_Handle = parseXML(EdgeDataEntryTag[i], "Handle");
            vector<string> EdgeDataEntryTag_Value = parseXML(EdgeDataEntryTag[i], "Value");
            vector<string> EdgeDataEntryTag_Quality = parseXML(EdgeDataEntryTag[i], "Quality");
            vector<string> EdgeDataEntryTag_Timestamp = parseXML(EdgeDataEntryTag[i], "Timestamp");
            if (EdgeDataEntryTag_Handle.size() != 1 && EdgeDataEntryTag_Value.size() != 1 && EdgeDataEntryTag_Quality.size() != 1 && EdgeDataEntryTag_Timestamp.size() != 1) 
            {
               parsed_values.clear();
               edgedata_logger_format("Error parse xml information from front end\n");
               break;
            }
            new_entry.handle = strtoul(EdgeDataEntryTag_Handle[0].c_str(), NULL, 10);

            for (unsigned int y = 0; y < s_write_list.size(); y++) 
            {
               if (s_write_list[y]->handle == new_entry.handle) 
               {
                  type = s_write_list[y]->type;
                  break;
               }
            }
            convert_str_to_value(type, EdgeDataEntryTag_Value[0].c_str(), &new_entry);
            convert_quality_str_to_value(EdgeDataEntryTag_Quality[0].c_str(), &new_entry);
            new_entry.timestamp64 = strtoll(EdgeDataEntryTag_Timestamp[0].c_str(), NULL, 10);
            parsed_values.push_back(new T_EDGE_DATA(new_entry));
         }
      }
   }
   return parsed_values;
}

void freeParseDataRequest(vector<T_EDGE_DATA*> toDelete) 
{
   for (uint32_t i = 0; i < toDelete.size(); i++) 
   {
      delete toDelete[i];
   }
}

bool processSetDataRequest(const char* in, uint32_t in_len) 
{
   string input(in, in_len);
   vector<T_EDGE_DATA*> parsed_data = parseGetDataRequest(input);
   for (uint32_t i = 0; i < parsed_data.size(); i++) 
   {
      edgedata_logger_format("Handle detected: %u (new value: %u)\n", parsed_data[i]->handle, parsed_data[i]->value.uint32);
      /* enter critical section */
      pthread_mutex_lock(&s_mutex);
      for (int w = 0; w < s_write_list.size(); w++) 
      {
         if (s_write_list[w]->handle == parsed_data[i]->handle) 
         {
            (void)memcpy(&s_write_list[w]->value, &parsed_data[i]->value, sizeof(T_EDGE_DATA_VALUE));
            s_write_list[w]->timestamp64 = parsed_data[i]->timestamp64;
            s_write_list[w]->quality = parsed_data[i]->quality;
            edge_data_sync_write(&s_write_list[w]->handle, 1);
            edgedata_logger_format("sync write finish : new value %u\n", s_write_list[w]->value.uint32);
         }
      }
      /* leave critical section */
      pthread_mutex_unlock(&s_mutex);
   }

   freeParseDataRequest(parsed_data);
   return true;
}

uint32_t processGetDataRequest(char* out, uint32_t max_out_len) 
{
   char type_str[50];
   char value_str[50];
   char quality_str[50];
   /* enter critical section */
   pthread_mutex_lock(&s_mutex);

   uint32_t len;
   len = snprintf(out, max_out_len, XML_OPEN);
   for (int i = 0; i < s_read_list.size(); i++) 
   {
      convert_value_to_str(&(s_read_list[i]->value), s_read_list[i]->type, value_str, type_str);
      convert_quality_to_str(s_read_list[i]->quality, quality_str);
      len += snprintf(&out[len], max_out_len - len, XML_ENTRY, s_read_list[i]->topic, s_read_list[i]->handle, "READ", type_str, value_str, quality_str, s_read_list[i]->timestamp64);
   }
   for (int i = 0; i < s_write_list.size(); i++) 
   {
      convert_value_to_str(&(s_write_list[i]->value), s_write_list[i]->type, value_str, type_str);
      len += snprintf(&out[len], max_out_len - len, XML_ENTRY, s_write_list[i]->topic, s_write_list[i]->handle, "WRITE", type_str, value_str, ""/* quality field for write element empty */, s_write_list[i]->timestamp64);
   }
   if (s_connected)
   {
      len += snprintf(&out[len], max_out_len - len, XML_CLOSE, XML_STATUS_CONNECTED);
   }
   else
   {
      len += snprintf(&out[len], max_out_len - len, XML_CLOSE, XML_STATUS_DISCONNECTED);
   }
   /* leave critical section */
   pthread_mutex_unlock(&s_mutex);

   return len;
}

uint32_t processGetEventsRequest(char* out, uint32_t max_out_len)
{
   char type_str[50];
   char value_str[50];
   char quality_str[50];

   /* enter critical section */
   pthread_mutex_lock(&s_mutex);

   uint32_t len;
   len = snprintf(out, max_out_len, XML_OPEN);
   for (int i = 0; i < event_list.size(); i++) 
   {
      convert_value_to_str(&(event_list[i].value), event_list[i].type, value_str, type_str);
      convert_quality_to_str(event_list[i].quality, quality_str);
      len += snprintf(&out[len], max_out_len - len, XML_ENTRY, event_list[i].topic.c_str(), event_list[i].handle, "READ", type_str, value_str, quality_str, event_list[i].timestamp64);
   }

   if (s_connected)
   {
      len += snprintf(&out[len], max_out_len - len, XML_CLOSE, XML_STATUS_CONNECTED);
   }
   else
   {
      len += snprintf(&out[len], max_out_len - len, XML_CLOSE, XML_STATUS_DISCONNECTED);
   }
   /* leave critical section */
   pthread_mutex_unlock(&s_mutex);

   return len;
}

static void open_log_file()
{   
   if (log_file_p!=NULL)
   {
      fclose(log_file_p);
      log_file_p = NULL;
   }
   
   /* remove last log file */
   remove("/app/www/logfile_last.txt");
   rename("/app/www/logfile.txt", "/app/www/logfile_last.txt");
   log_file_p = fopen("/app/www/logfile.txt", "w+");
}

static void edgedata_logger(const char* info) 
{
   static uint32_t number_of_logged_lines=0;
   pthread_mutex_lock(&s_mutex_log);

   if (number_of_logged_lines > 10000)
   {  /* reopen logfile */
      open_log_file();
      number_of_logged_lines = 0;
   }
   if ((info != NULL) && (log_file_p!= NULL))
   {
      printf("%s", info);
      fputs(info, log_file_p);
      fflush(log_file_p);      
   }
   pthread_mutex_unlock(&s_mutex_log);

}

static void edgedata_logger_format(const char* format, ...)
{
   va_list arg;
   char buffer[400];

   if (format == NULL)
   {
      return;
   }
   va_start(arg, format);
   /* Build Log Info */
   (void)vsnprintf(&buffer[0], sizeof(buffer) - 1, format, arg);
   buffer[sizeof(buffer) - 1] = 0;
   edgedata_logger(buffer);
   va_end(arg);
}

static void edgedata_callback(T_EDGE_DATA* event) 
{
   pthread_mutex_lock(&s_mutex);
   //edgedata_logger_format("Incomming event for topic: %s\n", event->topic);
   if (event_list.size() >= EVENTS_LENGTH) 
   {
      event_list.erase(event_list.begin());
   }
   T_EDGE_EVENT event_entry = {event->topic, event->handle, event->type, event->quality, event->value, event->timestamp64};
   event_list.push_back(event_entry);
   pthread_mutex_unlock(&s_mutex);
}

/* task for snychronize EdgeDataApi */
void* edgedata_task(void* void_ptr) 
{
   sleep(1);
   edge_data_register_logger(edgedata_logger);
   while (1) 
   {
      pthread_mutex_lock(&s_mutex);
      s_read_list.clear();
      s_write_list.clear();

      if (edge_data_connect() != E_EDGE_DATA_RETVAL_OK) 
      {
         edgedata_logger_format("Error during EdgeDataApi connection attempt\n");
         pthread_mutex_unlock(&s_mutex);
         sleep(1);
         continue;
      }
      edgedata_logger_format("EdgeDataApi connected successfully\n");

      const T_EDGE_DATA_LIST* discover_info = edge_data_discover();
      for (int i = 0; i < discover_info->read_handle_list_len; i++) 
      {
         s_read_list.push_back(edge_data_get_data(discover_info->read_handle_list[i]));
         edge_data_subscribe_event(discover_info->read_handle_list[i], &edgedata_callback);
      }
      for (int i = 0; i < discover_info->write_handle_list_len; i++) 
      {
         s_write_list.push_back(edge_data_get_data(discover_info->write_handle_list[i]));
      }
      s_connected = true;
      
      while (1) 
      {
         if (edge_data_sync_read(discover_info->read_handle_list, discover_info->read_handle_list_len) != E_EDGE_DATA_RETVAL_OK)
         {
            break;
         }
         /* update data every second */
         pthread_mutex_unlock(&s_mutex);
         usleep(1000000);
         pthread_mutex_lock(&s_mutex);
      }
      s_connected = false;
      edge_data_disconnect();
      /* error -> reconnect */
      pthread_mutex_unlock(&s_mutex);
   }
   return 0;
}

/* simple webserver (fastcgi interface)*/
int main(int argc, char** argv) 
{
   char out_buffer[2000000];
   uint32_t len = 0;
   char in_buffer[50000];
   char* request_method, * request_uri, * request_length;
   FCGX_Request cgi;
   memset(&cgi, 0, sizeof(FCGX_Request));
   pthread_mutex_init(&s_mutex, NULL);
   pthread_mutex_init(&s_mutex_log, NULL);

   pthread_t edgedata_thread_nr;
   int ret;
   
   open_log_file();
   
   if (!log_file_p) 
   {
      printf("Cant write log into file\n");
      return -2;
   }

   /* create a thread which executes edgedata_task */
   if (pthread_create(&edgedata_thread_nr, NULL, edgedata_task, &ret)) 
   {
      edgedata_logger_format("Error creating thread\n");
      return 1;
   }

   edgedata_logger_format("Start Server\n");
   /* Init fast cgi */
   int err = FCGX_Init();
   if (err) 
   {
      edgedata_logger_format("FCGX_Init failed: %d\n", err);
      return -1;
   }

   /* connect to fcgi socket (port 12345)*/
   int sock_fd = FCGX_OpenSocket(":12345", 1024);
   err = FCGX_InitRequest(&cgi, sock_fd, 0);
   if (err) 
   {
      edgedata_logger_format("FCGX_InitRequest failed: %d\n", err);
      return -2;
   }
   edgedata_logger_format("Wait for Requests\n");
   while (1) 
   {
      err = FCGX_Accept_r(&cgi);
      if (err) 
      {
         edgedata_logger_format("FCGX_Accept_r stopped: %d\n", err);
         break;
      }

      //http://php.net/manual/de/reserved.variables.server.php
      request_method = FCGX_GetParam("REQUEST_METHOD", cgi.envp);
      request_uri = FCGX_GetParam("REQUEST_URI", cgi.envp);
      request_length = FCGX_GetParam("CONTENT_LENGTH", cgi.envp);
      if ((request_method == NULL) || (request_uri == NULL) || (request_length == NULL)) 
      {
         edgedata_logger_format("Missing param (null)\n");
      }
      else if (strncmp("POST", request_method, 5) == 0)
      {
         (void)memset(in_buffer, 0, sizeof(in_buffer));
         if (readFromStream(in_buffer, sizeof(in_buffer) - 1, cgi.in) >= 0) 
         {
            in_buffer[sizeof(in_buffer) - 1] = '\0';
            if (in_buffer[0] != '\0') 
            {
               edgedata_logger_format("Payload: %s\n", in_buffer);
            }
            if (strncmp(request_uri, "/edgedata/set", 100) == 0)
            {
               processSetDataRequest(in_buffer, sizeof(in_buffer));
               len = setResponseHeader(out_buffer, sizeof(out_buffer), 200);
               len += snprintf(&out_buffer[len], sizeof(out_buffer) - len, "<SetResponse>OK</SetResponse>");
               snprintf(&out_buffer[len], sizeof(out_buffer) - len, "\r\n");
            }
            else if (strncmp(request_uri, "/edgedata/get", 100) == 0) 
            {
               len = setResponseHeader(out_buffer, sizeof(out_buffer), 200);
               len += processGetDataRequest(&out_buffer[len], sizeof(out_buffer) - len);
               snprintf(&out_buffer[len], sizeof(out_buffer) - len, "\r\n");
            }
            else if (strncmp(request_uri, "/edgedata/get_events", 100) == 0) 
            {
               len = setResponseHeader(out_buffer, sizeof(out_buffer), 200);
               len += processGetEventsRequest(&out_buffer[len], sizeof(out_buffer) - len);
               snprintf(&out_buffer[len], sizeof(out_buffer) - len, "\r\n");
            }
            else 
            {
               len = setResponseHeader(out_buffer, sizeof(out_buffer), 200);
               len += snprintf(&out_buffer[len], sizeof(out_buffer) - len, "<error>Invalid Command(URI)</error>");
               snprintf(&out_buffer[len], sizeof(out_buffer) - len, "\r\n");
            }
         }
         else 
         {
            len = setResponseHeader(out_buffer, sizeof(out_buffer), 200);
            len += snprintf(&out_buffer[len], sizeof(out_buffer) - len, "<error>Invalid Request</error>");
            snprintf(&out_buffer[len], sizeof(out_buffer) - len, "\r\n");
         }
      }
      else if (strncmp("GET", request_method, 4) == 0) 
      {
         setResponseHeader(out_buffer, sizeof(out_buffer), 500);
      }
      else 
      {
         edgedata_logger_format("Error unsupported Request Method\n");
         setResponseHeader(out_buffer, sizeof(out_buffer), 500);
      }
      FCGX_PutStr(out_buffer, strlen(out_buffer), cgi.out);
      FCGX_Finish_r(&cgi);
   }
   return -3;
}

static uint32_t setResponseHeader(char* buffer, int max_len_buffer, int response_status_code) 
{
   return snprintf(buffer, max_len_buffer, "Status: %d OK\r\nContent-Type: text/html\r\n\r\n", response_status_code);
}

static int readFromStream(char* buffer, int max_size_buffer, FCGX_Stream* stream) 
{
   int i;
   int c;
   memset(buffer, 0, max_size_buffer);
   for (i = 0; i < max_size_buffer; i++) 
   {
      c = FCGX_GetChar(stream);
      if (c == EOF) 
      {
         return i;
      }
      buffer[i] = c;
   }
   edgedata_logger_format("RECV Buffer to small\n");
   return 0;
}


/* very simple xml parser
   returns a list of contents for a target tag
*/
static vector<string> parseXML(const string& text, string tag)
{
   vector<string> collection;
   unsigned int pos = 0, begin_pos;

   while (1) 
   {
      begin_pos = text.find("<" + tag + ">", pos);
      if (begin_pos == string::npos) 
      {
         /* not found stop searching */
         break;
      }
      /* skip tag characters '<' and '>' */
      begin_pos += tag.length() + 2;

      pos = text.find("</" + tag + ">", begin_pos);
      if (begin_pos == string::npos) 
      {
         /* not found stop searching .... */
         break;
      }
      /* save the content of the tag into a list of contents */
      collection.push_back(text.substr(begin_pos, pos - begin_pos));
   }
   return collection;
}

