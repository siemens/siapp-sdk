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

/*!
   \file                      EdgeDataSim.cpp
   \brief                     DESCRIPTION: Digital Twin of the Edge Data Api
****************************************************************************/

/* Include */
#include <iostream>
#include <stdlib.h>
#include <stdio.h>
#include <cstdio>
#include <cstring>
#include <string>
#include <map>
#include <iterator>
#include <sstream>
#include <fstream>
#include "csvparsing.h"
#include "edgedata_internal.h"

#define  DEFAULT_DISCOVER_FILE_NAME          "discover.csv"
#define  DEFAULT_EVENTS_FILE_NAME            "events.csv"
#define  DEFAULT_EVENTS_topic_Attribute      "topic"
#define  DEFAULT_EVENTS_quality_Attribute    "quality"
#define  DEFAULT_EVENTS_value_Attribute      "value"
#define  DEFAULT_EVENTS_wait_ms_Attribute    "wait_ms"
#define  DEFAULT_Discover_topic_Attribute    "topic"
#define  DEFAULT_Discover_type_Attribute     "type"
#define  DEFAULT_Discover_source_Attribute   "source"

using namespace std;

typedef struct
{
   uint32_t handle;
   E_EDGE_DATA_TYPE type;
} CSV_DATA_INFO;

typedef struct
{
   uint32_t handle;
   uint32_t quality;
   E_EDGE_DATA_TYPE type;
   T_EDGE_DATA_VALUE value;
} CSV_WRITE_DATA_INFO;

static map<string, CSV_DATA_INFO>         topic_read_info;
static map<string, CSV_WRITE_DATA_INFO>   topic_write_info;
static bool                               b_wait_for_discover = true;
static bool                               b_connection_ok = false;
static const char                         *CSV_File1_ptr = NULL;
static const char                         *CSV_File2_ptr = NULL;

/*!
******************************************************************************
DESCRIPTION:     Fast CSV header parsing without memory allocation
*****************************************************************************/
static vector<string> parse_csv_header_fast(const string& line) {
   vector<string> fields;
   fields.reserve(10); // Pre-allocate for typical CSV columns
   
   size_t start = 0;
   size_t end = 0;
   while ((end = line.find(';', start)) != string::npos) {
      fields.emplace_back(line.substr(start, end - start));
      start = end + 1;
   }
   // Add the last column, removing trailing whitespace
   if (start < line.length()) {
      string last_col = line.substr(start);
      while (!last_col.empty() && (last_col.back() == '\n' || last_col.back() == '\r' || last_col.back() == ' ')) {
         last_col.pop_back();
      }
      fields.emplace_back(last_col);
   }
   return fields;
}

/*!
******************************************************************************
DESCRIPTION:     Callback Diagnose Information with timestamp
*****************************************************************************/
static void edgedata_print_info(const char* log_text)
{
   struct timespec tsp;
   clock_gettime(CLOCK_MONOTONIC, &tsp);
   printf("%lld.%.3ld-%.6ld: %s", tsp.tv_sec, tsp.tv_nsec / 1000000, tsp.tv_nsec % 1000000, log_text);
}

/*!
******************************************************************************
DESCRIPTION:     Logging information
*****************************************************************************/
void log(const char* format, ...)
{
   va_list arg;
   char buffer[2000];
   int buffer_len = 0;

   if (format == NULL)
   {
      return;
   }
   va_start(arg, format);
   /* Build Log Info */
   buffer_len = vsnprintf(&buffer[buffer_len], sizeof(buffer) - 1 - buffer_len, format, arg);
   buffer[sizeof(buffer) - 1] = 0;
   /* call registered log callback */
   edgedata_print_info(buffer);
   va_end(arg);
}

/*!
******************************************************************************
DESCRIPTION:     Callback for Discover Information
*****************************************************************************/
uint32_t callback_discover_with_reply(void* fd, unsigned char* payload, uint32_t payload_len, unsigned char* payload_reply, uint32_t max_payload_reply_len)
{
   uint32_t ret = edgedata_flatbuffers_discover_with_reply(fd, payload, payload_len, payload_reply, max_payload_reply_len);
   if (ret == 0)
   {
      b_wait_for_discover = false;
   }
   return ret;
}

/*!
******************************************************************************
DESCRIPTION:     Convert source from string to edge
*****************************************************************************/
uint32_t get_source_edge(const char* source_csv)
{
   if (strncmp(source_csv, "READ", sizeof("READ")) == 0)
   {
      return EDGE_SOURCE_FLAG_READ;
   }
   else if (strncmp(source_csv, "WRITE", sizeof("WRITE")) == 0)
   {
      return EDGE_SOURCE_FLAG_WRITE;
   }
   log("Error: Invalid source \"%s\" found in \"%s\". (Allowed values: READ,WRITE) \n", source_csv, CSV_File1_ptr);
   exit(-1);
   return 0;
}

/*!
******************************************************************************
DESCRIPTION:     Convert type from string to edge
*****************************************************************************/
E_EDGE_DATA_TYPE get_type_edge(const char* type_csv)
{
   if (strncmp(type_csv, "UINT32", sizeof("UINT32")) == 0)
   {
      return E_EDGE_DATA_TYPE_UINT32;
   }
   else if (strncmp(type_csv, "INT32", sizeof("INT32")) == 0)
   {
      return E_EDGE_DATA_TYPE_INT32;
   }
   else if (strncmp(type_csv, "INT64", sizeof("INT64")) == 0)
   {
      return E_EDGE_DATA_TYPE_INT64;
   }
   else if (strncmp(type_csv, "UINT64", sizeof("UINT64")) == 0)
   {
      return E_EDGE_DATA_TYPE_UINT64;
   }
   else if (strncmp(type_csv, "FLOAT32", sizeof("FLOAT32")) == 0)
   {
      return E_EDGE_DATA_TYPE_FLOAT32;
   }
   else if (strncmp(type_csv, "DOUBLE64", sizeof("DOUBLE64")) == 0)
   {
      return E_EDGE_DATA_TYPE_DOUBLE64;
   }
   log("Error: Invalid type \"%s\" found in \"%s\". (Allowed values: UINT32,INT32,INT64,UINT64,FLOAT32,DOUBLE64)\n", type_csv, CSV_File1_ptr);
   exit(-1);
}

/*!
******************************************************************************
DESCRIPTION:     Convert value from edge to string
*****************************************************************************/
uint32_t get_value_text(T_EDGE_DATA_VALUE* value, E_EDGE_DATA_TYPE type, char* value_as_text, uint32_t max_len_value_as_string)
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
      pos = snprintf(value_as_text, max_len_value_as_string, "%lld", value->int64);
      break;
   case	E_EDGE_DATA_TYPE_UINT64:
      pos = snprintf(value_as_text, max_len_value_as_string, "%llu", value->uint64);
      break;
   case	E_EDGE_DATA_TYPE_FLOAT32:
      pos = snprintf(value_as_text, max_len_value_as_string, "%f", value->float32);
      break;
   case	E_EDGE_DATA_TYPE_DOUBLE64:
      pos = snprintf(value_as_text, max_len_value_as_string, "%lf", value->double64);
      break;
   case E_EDGE_DATA_TYPE_UNKNOWN:
   default:
      pos = snprintf(value_as_text, max_len_value_as_string, "0");
      break;
   }
   return pos;
}

/*!
******************************************************************************
DESCRIPTION:     Convert value from string to edge
*****************************************************************************/
void get_value_edge(const char* init_value_csv, E_EDGE_DATA_TYPE type, T_EDGE_DATA_VALUE* value)
{
   switch (type)
   {
   case E_EDGE_DATA_TYPE_INT32:
      value->int32 = strtol(init_value_csv, NULL, 10);
      break;
   case E_EDGE_DATA_TYPE_UINT32:
      value->uint32 = strtoul(init_value_csv, NULL, 10);
      break;
   case E_EDGE_DATA_TYPE_INT64:
      value->int64 = strtoll(init_value_csv, NULL, 10);
      break;
   case E_EDGE_DATA_TYPE_UINT64:
      value->uint64 = strtoull(init_value_csv, NULL, 10);
      break;
   case E_EDGE_DATA_TYPE_FLOAT32:
      value->float32 = strtof(init_value_csv, NULL);
      break;
   case E_EDGE_DATA_TYPE_DOUBLE64:
      value->double64 = strtod(init_value_csv, NULL);
      break;
   case E_EDGE_DATA_TYPE_UNKNOWN:
   default:
      value->uint64 = 0;
      break;
   }
}
/*!
******************************************************************************
DESCRIPTION:     compare values from Sim and Client
*****************************************************************************/
bool compare_values(E_EDGE_DATA_TYPE type, T_EDGE_DATA_VALUE* value1, T_EDGE_DATA_VALUE* value2)
{
   switch (type)
   {
   case E_EDGE_DATA_TYPE_INT32:
      return (value1->int32 == value2->int32);
      break;
   case E_EDGE_DATA_TYPE_UINT32:
      return (value1->uint32 == value2->uint32);
      break;
   case E_EDGE_DATA_TYPE_INT64:
      return (value1->int64 == value2->int64);
      break;
   case E_EDGE_DATA_TYPE_UINT64:
      return (value1->uint64 == value2->uint64);
      break;
   case E_EDGE_DATA_TYPE_FLOAT32:
      return (value1->float32 == value2->float32);
      break;
   case E_EDGE_DATA_TYPE_DOUBLE64:
      return (value1->double64 == value2->double64);
      break;
   case E_EDGE_DATA_TYPE_UNKNOWN:
   default:
      return (value1->int64 == value2->int64);
      break;
   }
}

/*!
******************************************************************************
DESCRIPTION:    Convert quality from string to edge
*****************************************************************************/
uint32_t get_events_quality(const char* str)
{
   uint32_t quality = EDGE_QUALITY_VALID_VALUE;
   vector <string>token;
   stringstream getstream(str);
   string new_quality;
   while (getline(getstream, new_quality, '|'))
   {
      token.push_back(new_quality);
   }

   for (unsigned int i = 0; i < token.size(); i++)
   {
      if (strcmp("NT", token[i].c_str()) == 0)
      {
         quality |= EDGE_QUALITY_FLAG_NOT_TOPICAL;
      }
      else if (strcmp("OV", token[i].c_str()) == 0)
      {
         quality |= EDGE_QUALITY_FLAG_OVERFLOW;
      }
      else if (strcmp("OB", token[i].c_str()) == 0)
      {
         quality |= EDGE_QUALITY_FLAG_OPERATOR_BLOCKED;
      }
      else if (strcmp("T", token[i].c_str()) == 0)
      {
         quality |= EDGE_QUALITY_FLAG_TEST;
      }
      else if (strcmp("SB", token[i].c_str()) == 0)
      {
         quality |= EDGE_QUALITY_FLAG_SUBSITUTED;
      }
      else if (strcmp("IV", token[i].c_str()) == 0)
      {
         quality |= EDGE_QUALITY_FLAG_INVALID;
      }
      else if (token[i].length() != 0)
      {
         log("Error: Invalid quality bit \"%s\" found in \"s%\". (Allowed values: NT|OV|OB|T|SB|IV)\n", token[i].c_str(), CSV_File2_ptr);
         exit(-1);
      }
   }
   return quality;
}

/*!
******************************************************************************
DESCRIPTION:    Convert quality from edge to string
*****************************************************************************/
uint32_t get_events_quality_text(uint32_t quality, char* quality_to_text, uint32_t max_len_quality_to_text)
{
   uint32_t pos = 0;

   if ((quality & EDGE_QUALITY_FLAG_NOT_TOPICAL) != 0)
   {
      pos += snprintf(&quality_to_text[pos], (max_len_quality_to_text - pos), "NT|");
   }
   if ((quality & EDGE_QUALITY_FLAG_OVERFLOW) != 0)
   {
      pos += snprintf(&quality_to_text[pos], (max_len_quality_to_text - pos), "OV|");
   }
   if ((quality & EDGE_QUALITY_FLAG_OPERATOR_BLOCKED) != 0)
   {
      pos += snprintf(&quality_to_text[pos], (max_len_quality_to_text - pos), "OB|");
   }
   if ((quality & EDGE_QUALITY_FLAG_TEST) != 0)
   {
      pos += snprintf(&quality_to_text[pos], (max_len_quality_to_text - pos), "T|");
   }
   if ((quality & EDGE_QUALITY_FLAG_SUBSITUTED) != 0)
   {
      pos += snprintf(&quality_to_text[pos], (max_len_quality_to_text - pos), "SB|");
   }
   if ((quality & EDGE_QUALITY_FLAG_INVALID) != 0)
   {
      pos += snprintf(&quality_to_text[pos], (max_len_quality_to_text - pos), "IV|");
   }
   if (pos > 0)
   {
      quality_to_text[pos - 1] = '\0';
      pos--;
   }
   else
   {
      (void)memset(quality_to_text, 0, max_len_quality_to_text);
   }
   return pos;
}

/*!
******************************************************************************
DESCRIPTION:     Callback for events triggerd by EdgeApp
*****************************************************************************/
static void change_event_cb(T_EDGE_DATA* event)
{
   char tmp[400];
   uint32_t pos = 0;

   topic_write_info[string(event->topic)].quality = event->quality;
   (void)memcpy(&topic_write_info[string(event->topic)].value, &event->value, sizeof(T_EDGE_DATA_VALUE));

   pos = snprintf(tmp, sizeof(tmp), "Topic %s received with Value: ", event->topic);
   pos += get_value_text(&event->value, event->type, &tmp[pos], (sizeof(tmp) - pos));
   pos += snprintf(&tmp[pos], (sizeof(tmp) - pos), ", Quality: ");
   pos += get_events_quality_text(event->quality, &tmp[pos], (sizeof(tmp) - pos));
   (void)snprintf(&tmp[pos], (sizeof(tmp) - pos), "\n");
   edgedata_print_info(tmp);
}

/******************************************************************************
DESCRIPTION:     Get Initvalue and quality bits from events.csv
*****************************************************************************/
static uint32_t get_init_value(const char* topic, T_EDGE_DATA_VALUE* init_value)
{
   csvparsing csvevents(CSV_File2_ptr);
   map<string, string> row_events;
   while (csvevents >> row_events)
   {
      /* skip empty line? */
      if (row_events.size() == 0)
      {
         continue;
      }
      uint32_t wait_ms = atoi(row_events["wait_ms"].c_str());
      if (wait_ms != 0)
      {
         break;
      }
      const char* _topic = row_events["topic"].c_str();
      if (strncmp(topic, _topic, 300) == 0)
      {
         get_value_edge(row_events["value"].c_str(), topic_read_info[string(topic)].type, init_value);
         return get_events_quality(row_events["quality"].c_str());
      }
   }
   return EDGE_QUALITY_FLAG_NOT_TOPICAL;
}


/******************************************************************************
DESCRIPTION:     Attribute's control from events.csv
*****************************************************************************/
void Events_attribute_control()
{
   ifstream data(DEFAULT_EVENTS_FILE_NAME);
   if (!data.is_open())
   {
      exit(EXIT_FAILURE);
   }
   string str;
   getline(data, str, '\n');
   
   // Use fast CSV parsing
   vector<string> vec = parse_csv_header_fast(str);
   for (unsigned int i = 0; i < vec.size(); i++)
   {
      if (vec.at(i) == DEFAULT_EVENTS_topic_Attribute || vec.at(i) == DEFAULT_EVENTS_value_Attribute ||
         vec.at(i) == DEFAULT_EVENTS_wait_ms_Attribute || vec.at(i) == DEFAULT_EVENTS_quality_Attribute)
      {
         continue;
      }
      else
      {
         log("Error: Invalid csv header \"%s\" used in %s (Valid header: topic;quality;value;wait_ms)\n", vec.at(i).c_str(), CSV_File2_ptr);
         exit(-1);
      }
   }
}
/******************************************************************************
DESCRIPTION:    Avoid duplicate topics in discover.csv
*****************************************************************************/
bool if_file_has_duplicates_topics(const vector<string>& vec)
{
   for (auto it1 = vec.begin(); it1 != vec.end(); it1++)
   {
      for (auto it2 = it1 + 1; it2 != vec.end(); it2++)
      {
         if (*it1 == *it2)
         {
            return true;
         }
      }
   }
   return false;
}
/*!
******************************************************************************
DESCRIPTION:     Callback triggerd if connection broken
\fn  VOID ciotask_cb_error_connection (VOID)
*****************************************************************************/
void cb_error_connection(void* fd)
{
   b_connection_ok = false;
}

/******************************************************************************
DESCRIPTION:     Attribute's identical control in discover.csv
*****************************************************************************/
void Discover_attribute_control()
{
   ifstream data(DEFAULT_DISCOVER_FILE_NAME);
   if (!data.is_open())
   {
      exit(EXIT_FAILURE);
   }
   string str;
   getline(data, str, '\n');
   
   // Use fast CSV parsing
   vector<string> vec = parse_csv_header_fast(str);

   for (unsigned int i = 0; i < vec.size(); i++)
   {
      if (vec.at(i) == DEFAULT_Discover_topic_Attribute || vec.at(i) == DEFAULT_Discover_type_Attribute || vec.at(i) == DEFAULT_Discover_source_Attribute)
      {
         continue;
      }
      else
      {
         log("Error: Invalid csv header \"%s\" used in %s (Valid header: topic;type;source)\n", vec.at(i).c_str(), CSV_File1_ptr);
         exit(-1);
      }
   }

}
/******************************************************************************
DESCRIPTION:   Topics identical control of discover.csv & events.csv
*****************************************************************************/
void Topic_control_csv_files()
{
   csvparsing csv_discover(CSV_File1_ptr);
   csvparsing csv_evennts(CSV_File2_ptr);
   map<string, string> row_topic_discover, row_topic_events;
   vector<string>topic_discover_vec;
   vector<string>topic_events_vec;
   vector<string> difference;
   while (csv_discover >> row_topic_discover)
   {
      if (row_topic_discover.size() == 0)
      {
         continue;
      }

      string topic = row_topic_discover["topic"].c_str();

      if (strncmp(topic.c_str(), "GOTO", 4) != 0)
      {
         topic_discover_vec.push_back(topic);
      }

      if (if_file_has_duplicates_topics(topic_discover_vec) == true)
      {
         log("Error: Duplicate topics in %s\n", CSV_File1_ptr);
         exit(-1);
      }
   }
   while (csv_evennts >> row_topic_events)
   {
      if (row_topic_events.size() == 0)
      {
         continue;
      }
      string topic = row_topic_events["topic"].c_str();

      if (strncmp(topic.c_str(), "GOTO", 4) != 0)
      {
         topic_events_vec.push_back(topic);
      }
   }

   for (size_t i = 0; i < topic_events_vec.size(); ++i)
   {
      vector<string>::iterator it = find(topic_discover_vec.begin(), topic_discover_vec.end(), topic_events_vec[i]);
      if (it == topic_discover_vec.end())
      {
         log("Unkown topic \"%s\" found: (Missing topic description in \"%s\")\n", topic_events_vec[i].c_str(), CSV_File2_ptr);
         exit(-1);
      }
   }
}

/******************************************************************************
DESCRIPTION: Desired GOTO line_number of events.csv
*****************************************************************************/
struct not_digit
{
   bool operator()(const char c)
   {
      return c != ' ' && !isdigit(c);
   }
};

static uint32_t goto_number()
{
   csvparsing csvevents(CSV_File2_ptr);
   map<string, string> row_events;
   vector <string> file_size;
   while (csvevents >> row_events)
   {
      if (row_events.size() == 0)
      {
         continue;
      }

      string topic = row_events["topic"];
      file_size.push_back(topic);

      if (strncmp(topic.c_str(), "GOTO", 4) == 0)
      {
         string str(topic);
         not_digit not_a_digit;
         string::iterator end = std::remove_if(str.begin(), str.end(), not_a_digit);
         string all_numbers(str.begin(), end);
         stringstream ss(all_numbers);
         vector<uint32_t> numbers;
         for (uint32_t i = 0; ss >> i;)
         {
            numbers.push_back(i);
            return i;
         }
      }
   }
   return 0;
}

/******************************************************************************
DESCRIPTION:   Size of events.csv
*****************************************************************************/
static uint32_t  file_size()
{

   csvparsing csvevents(CSV_File2_ptr);
   map<string, string> row_events;
   vector<string> number_of_topics;
   while (csvevents >> row_events)
   {
      const char* topic = row_events["topic"].c_str();
      number_of_topics.push_back(topic);
   }
   return number_of_topics.size();
}
/******************************************************************************
DESCRIPTION:   Control the number of GOTO  in events.csv
*****************************************************************************/
void verify_GOTO_value(uint32_t goto_value)
{
   if (goto_value == 0 || goto_value == 1 || goto_value > file_size())
   {
      log("Unkown GOTO line number \"%u\" found: (Missing topic description in \"%s\")\n", goto_value, CSV_File2_ptr);
      exit(-1);
   }
}
/******************************************************************************
DESCRIPTION:     Repeat writing or reading  events by line number
*****************************************************************************/
bool Repeat_send_Events_edge(EDGEDATA_IPC_FD* server, uint32_t line_nom)
{
   char str_quality[200] = "";
   char str_quality2[200] = "";
   char str_value[200] = "";
   char str_value2[200] = "";
   struct timeval tv;
   int64_t timestamp64;

   Events_attribute_control();
   csvparsing csvevents("events.csv");
   map<string, string> row_events;
   uint32_t row_nom = 0;
   bool ignore_initial_values = true;
   while (csvevents >> row_events)
   {
      if (row_events.size() == 0) // ignor empty rows 
      {
         continue;
      }

      const char* topic = row_events["topic"].c_str();
      uint32_t quality = get_events_quality(row_events["quality"].c_str());
      uint32_t wait_ms = atoi(row_events["wait_ms"].c_str());

      if ((wait_ms == 0) && (ignore_initial_values)) // ignor inital values 
      {
         continue;
      }

      else
      {
         ignore_initial_values = false;
      }

      row_nom++;
      if (row_nom >= (line_nom - 1)) // -1, weil die erste linie des CSV-files nicht mitgezählt wird 
      {

         T_EDGE_DATA_VALUE value;

         if (topic_read_info.find(string(topic)) != topic_read_info.end())
         {
            get_value_edge(row_events["value"].c_str(), topic_read_info[string(topic)].type, &value);
            log("Wait for %d ms\n", wait_ms);

            usleep(wait_ms * 1000);
            timestamp64 = 0;
            if (gettimeofday(&tv, NULL) == 0)
            {
               timestamp64 = ((int64_t)((int64_t)tv.tv_sec * 1000000000) + (int64_t)((int64_t)tv.tv_usec * 1000));
            }
            get_value_text(&value, topic_read_info[string(topic)].type, str_value, sizeof(str_value));
            (void)get_events_quality_text(quality, str_quality, sizeof(str_quality) - 1);
            log(" Send update for topic: %s, value: %s, quality: %s\n", topic, str_value, str_quality);

            if (!edgedata_flatbuffers_edge_event_send((void*)server, topic_read_info[string(topic)].handle, topic_read_info[string(topic)].type, quality, &value, timestamp64))
            {
               log("Connection aborted\n");
               return false;
            }
         }

         if (topic_write_info.find(string(topic)) != topic_write_info.end())
         {
            usleep(wait_ms * 1000);

            get_value_edge(row_events["value"].c_str(), topic_write_info[string(topic)].type, &value);
            get_value_text(&value, topic_write_info[string(topic)].type, str_value, sizeof(str_value) - 1);
            get_value_text(&topic_write_info[string(topic)].value, topic_write_info[string(topic)].type, str_value2, sizeof(str_value2) - 1);

            if (compare_values(topic_write_info[string(topic)].type, &value, &topic_write_info[string(topic)].value))
            {
               log("Value (%s) matches csv file content (expected=%s, current=%s)\n", topic, str_value, str_value2);
            }
            else
            {
               get_value_text(&value, topic_write_info[string(topic)].type, str_value, sizeof(str_value) - 1);
               get_value_text(&topic_write_info[string(topic)].value, topic_write_info[string(topic)].type, str_value2, sizeof(str_value2) - 1);
               log("Value (%s) DOES NOT MATCH csv file content (expected=%s, current=%s) \n", topic, str_value, str_value2);
            }
            if (topic_write_info[string(topic)].quality == quality)
            {
               get_events_quality_text(quality, str_quality, sizeof(str_quality) - 1);
               get_events_quality_text(topic_write_info[string(topic)].quality, str_quality2, sizeof(str_quality2) - 1);
               log("Quality (%s) matches csv file content (expected=%s, current=%s) \n", topic, str_quality, str_quality2);
            }
            else
            {
               (void)get_events_quality_text(quality, str_quality, sizeof(str_quality) - 1);
               (void)get_events_quality_text(topic_write_info[string(topic)].quality, str_quality2, sizeof(str_quality2) - 1);
               log("Quality (%s) DOES NOT MATCH csv file content (expected=%s, current=%s) \n", topic, str_quality, str_quality2);
            }
         }
      }

      if (row_nom == file_size())
      {
         row_nom = 0;
      }
   }
   return true;
}


int main(int argc, char* argv[])
{
   fstream file1, file2;
   uint32_t next_handle;
   struct timeval tv;
   int64_t timestamp64;

   if (argc == 3)
   {
      CSV_File1_ptr = argv[1];
      CSV_File2_ptr = argv[2];
   }
   else
   {
      CSV_File1_ptr = DEFAULT_DISCOVER_FILE_NAME;
      CSV_File2_ptr = DEFAULT_EVENTS_FILE_NAME;
   }

   file1.open(CSV_File1_ptr);
   file2.open(CSV_File2_ptr);

   if (file1.fail() || file2.fail())
   {
      log("Error: \"%s\" or \"%s\" could not found!\n ", CSV_File1_ptr, CSV_File2_ptr);
      exit(-1);
   }

   log("Verify CSV File\n");
   Discover_attribute_control();
   Topic_control_csv_files();

   log("Start Data Simulation\n");
   edge_data_register_logger(edgedata_print_info);
   log("Wait for SIAPP to connect...\n");
   EDGEDATA_IPC_FD* server = edgedata_ipc_unix_server_listen_with_error_cb("/edgedata/edgedata", "root:root", cb_error_connection);

   while (1)
   {
      topic_read_info.clear();
      topic_write_info.clear();
      if (server == NULL)
      {
         log("Error: server == NULL!");
         exit(-1);
      }

      (void)edgedata_callback_with_reply_register(server, MSG_TYPE_DISCOVER, callback_discover_with_reply);
      (void)edgedata_callback_with_reply_register(server, MSG_TYPE_UPDATE_DATA, edgedata_flatbuffers_edge_event_receive);
      (void)edgedata_callback_register(server, MSG_TYPE_UPDATE_DATA, edgedata_rpc_dummy_ack);
      log("EdgeApp connected to Simulation...\n");
      next_handle = 1;

      /*
      DISOVER
      */
      log("EdgeApp csv_discover...\n");
      csvparsing csv_discover(CSV_File1_ptr);
      map<string, string> row_discover;
      while (csv_discover >> row_discover)
      {
         /* skip empty line? */
         if (row_discover.size() == 0)
         {
            continue;
         }
         const char* topic = row_discover["topic"].c_str();
         uint32_t source = get_source_edge(row_discover["source"].c_str());
         E_EDGE_DATA_TYPE type = get_type_edge(row_discover["type"].c_str());
         T_EDGE_DATA_VALUE init_value;
         (void)memset(&init_value, 0, sizeof(init_value));

         if (source == EDGE_SOURCE_FLAG_WRITE)
         {
            CSV_WRITE_DATA_INFO info;
            info.handle = next_handle;
            info.type = type;
            info.quality = 0;
            (void)memcpy(&info.value, &init_value, sizeof(init_value));
            topic_write_info.insert(std::pair<string, CSV_WRITE_DATA_INFO>(string(topic), info));
            log("EdgeApp edgedata_data_discover_add (write)...\n");
            edgedata_data_discover_add(server, topic, next_handle, type, source, info.quality, &init_value, 0, change_event_cb);
         }
         else
         {
            CSV_DATA_INFO info;
            uint32_t quality;
            info.handle = next_handle;
            info.type = type;
            timestamp64 = 0;
            if (gettimeofday(&tv, NULL) == 0)
            {
               timestamp64 = ((int64_t)((int64_t)tv.tv_sec * 1000000000) + (int64_t)((int64_t)tv.tv_usec * 1000));
            }
            topic_read_info.insert(std::pair<string, CSV_DATA_INFO>(string(topic), info));
            quality = get_init_value(topic, &init_value);
            log("EdgeApp edgedata_data_discover_add (read)...\n");
            edgedata_data_discover_add(server, topic, next_handle, type, source, quality, &init_value, timestamp64, NULL);
         }
         next_handle++;
      }

      edgedata_thread_start_thread_recv(server);
      /* start keep alive thread */
      edgedata_thread_start_keep_alive(server);
      log("Wait for discover\n");
      while (b_wait_for_discover)
      {
         usleep(1000);
      }
      verify_GOTO_value(goto_number());
      log("Discover received, Start send simulation data\n");

      b_connection_ok = Repeat_send_Events_edge(server, 2);
      int n = 1;
      while (b_connection_ok)
      {
         log("......................................\n");
         log("%dth Repetition of data transmission \n", n++);
         log("......................................\n");
         b_connection_ok = Repeat_send_Events_edge(server, goto_number());
      }

      /* reconnect */
      edgedata_ipc_disconnect(&server);
      sleep(1);
      log("Wait for SIAPP to connect...\n");
      server = edgedata_ipc_unix_server_listen_with_error_cb("/edgedata/edgedata", "root:root", cb_error_connection);
   }
}
