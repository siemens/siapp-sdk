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

#include <helper.h>

/*!
******************************************************************************
DESCRIPTION:     compare edgedata objects
*****************************************************************************/
bool helper_is_equal_value (T_EDGE_DATA *data1, T_EDGE_DATA *data2)
{
   if ((data1 == NULL) || (data2 == NULL)) 
   {
      return false;
   }
   if (data1->type != data2->type)
   {
      return false;
   }
   if (data1->quality != data2->quality)
   {
      return false;
   }
   switch (data1->type)
   {
      case E_EDGE_DATA_TYPE_INT32:
         return (data1->value.int32 == data2->value.int32);
         break;
      case E_EDGE_DATA_TYPE_UINT32:
         return (data1->value.uint32 == data2->value.uint32);
         break;
      case E_EDGE_DATA_TYPE_INT64:
         return (data1->value.int64 == data2->value.int64);
         break;
      case E_EDGE_DATA_TYPE_UINT64:
         return (data1->value.uint64 == data2->value.uint64);
         break;
      case E_EDGE_DATA_TYPE_FLOAT32:
         return (data1->value.float32 == data2->value.float32);
         break;
      case E_EDGE_DATA_TYPE_DOUBLE64:
         return (data1->value.double64 == data2->value.double64);
         break;
      case E_EDGE_DATA_TYPE_UNKNOWN:
      default:
         return (data1->value.int64 == data2->value.int64);
         break;
   }
}

/*!
******************************************************************************
DESCRIPTION:     Convert value from edge to string
*****************************************************************************/
uint32_t helper_get_value_text (T_EDGE_DATA *edge_data, char *value_as_text, uint32_t max_len_value_as_string)
{
   uint32_t pos = 0;
   switch (edge_data->type)
   {
      case E_EDGE_DATA_TYPE_INT32:
         pos = snprintf (value_as_text, max_len_value_as_string, "%d", edge_data->value.int32);
         break;
      case E_EDGE_DATA_TYPE_UINT32:
         pos = snprintf (value_as_text, max_len_value_as_string, "%u", edge_data->value.uint32);
         break;
      case E_EDGE_DATA_TYPE_INT64:
         pos = snprintf (value_as_text, max_len_value_as_string, "%lld", edge_data->value.int64);
         break;
      case E_EDGE_DATA_TYPE_UINT64:
         pos = snprintf (value_as_text, max_len_value_as_string, "%llu", edge_data->value.uint64);
         break;
      case E_EDGE_DATA_TYPE_FLOAT32:
         pos = snprintf (value_as_text, max_len_value_as_string, "%f", edge_data->value.float32);
         break;
      case E_EDGE_DATA_TYPE_DOUBLE64:
         pos = snprintf (value_as_text, max_len_value_as_string, "%lf", edge_data->value.double64);
         break;
      case E_EDGE_DATA_TYPE_UNKNOWN:
      default:
         pos = snprintf (value_as_text, max_len_value_as_string, "?");
         break;
   }
   return pos;
}


/*!
******************************************************************************
DESCRIPTION:     Convert value from edge to string
*****************************************************************************/
uint32_t helper_get_data_type_text (T_EDGE_DATA *edge_data, char *value_as_text, uint32_t max_len_value_as_string)
{
   uint32_t pos = 0;
   switch (edge_data->type)
   {
      case E_EDGE_DATA_TYPE_INT32:
         pos = snprintf (value_as_text, max_len_value_as_string, "INT32");
         break;
      case E_EDGE_DATA_TYPE_UINT32:
         pos = snprintf (value_as_text, max_len_value_as_string, "UINT32");
         break;
      case E_EDGE_DATA_TYPE_INT64:
         pos = snprintf (value_as_text, max_len_value_as_string, "INT64");
         break;
      case E_EDGE_DATA_TYPE_UINT64:
         pos = snprintf (value_as_text, max_len_value_as_string, "UINT64");
         break;
      case E_EDGE_DATA_TYPE_FLOAT32:
         pos = snprintf (value_as_text, max_len_value_as_string, "FLOAT32");
         break;
      case E_EDGE_DATA_TYPE_DOUBLE64:
         pos = snprintf (value_as_text, max_len_value_as_string, "DOUBLE64");
         break;
      case E_EDGE_DATA_TYPE_UNKNOWN:
      default:
         pos = snprintf (value_as_text, max_len_value_as_string, "UNKOWN");
         break;
   }
   return pos;
}


uint32_t helper_get_quality_text (T_EDGE_DATA *edge_data, char *quality_to_text, uint32_t max_len_quality_to_text)
{
   uint32_t pos = 0;
   uint32_t quality;
   
   quality = edge_data->quality;

   if ((quality & EDGE_QUALITY_FLAG_NOT_TOPICAL) != 0)
   {
      pos += snprintf (&quality_to_text[pos], (max_len_quality_to_text - pos), "NT|");
   }
   if ((quality & EDGE_QUALITY_FLAG_OVERFLOW) != 0)
   {
      pos += snprintf (&quality_to_text[pos], (max_len_quality_to_text - pos), "OV|");
   }
   if ((quality & EDGE_QUALITY_FLAG_OPERATOR_BLOCKED) != 0)
   {
      pos += snprintf (&quality_to_text[pos], (max_len_quality_to_text - pos), "OB|");
   }
   if ((quality & EDGE_QUALITY_FLAG_TEST) != 0)
   {
      pos += snprintf (&quality_to_text[pos], (max_len_quality_to_text - pos), "TS|");
   }
   if ((quality & EDGE_QUALITY_FLAG_SUBSITUTED) != 0)
   {
      pos += snprintf (&quality_to_text[pos], (max_len_quality_to_text - pos), "SB|");
   }
   if ((quality & EDGE_QUALITY_FLAG_INVALID) != 0)
   {
      pos += snprintf (&quality_to_text[pos], (max_len_quality_to_text - pos), "IV|");
   }
   if (pos > 0)
   {
      quality_to_text[pos - 1] = '\0';
      pos--;
   }
   else
   {
      (void)memset (quality_to_text, 0, max_len_quality_to_text);
   }
   return pos;
}


bool helper_get_edgedata_text(T_EDGE_DATA *edge_data, char *edgedata_to_text, uint32_t max_len_edgedata_to_text)
{
   uint32_t pos = 0;
   if ((edgedata_to_text == NULL) || (edge_data == NULL))
   {
      return false;
   }
   /* Topic: */
   pos += (uint32_t)snprintf(&edgedata_to_text[pos], (max_len_edgedata_to_text-pos) ,"Topic: %s", edge_data->topic);
   
   /* (Data)Type: */
   pos += (uint32_t)snprintf(&edgedata_to_text[pos], (max_len_edgedata_to_text-pos) ,", Type:");
   pos += helper_get_data_type_text(edge_data, &edgedata_to_text[pos], (max_len_edgedata_to_text-pos));
   
   /* Quality: */
   pos += (uint32_t)snprintf(&edgedata_to_text[pos], (max_len_edgedata_to_text-pos) ,", Quality: ");
   pos += helper_get_quality_text(edge_data, &edgedata_to_text[pos], (max_len_edgedata_to_text-pos));

   /* Value: */
   pos += (uint32_t)snprintf(&edgedata_to_text[pos], (max_len_edgedata_to_text-pos) ,", Value: ");
   pos += helper_get_value_text(edge_data, &edgedata_to_text[pos], (max_len_edgedata_to_text-pos));
   
   /* Timestamp */
   if (edge_data->timestamp64==0)
   {
      pos += (uint32_t)snprintf(&edgedata_to_text[pos], (max_len_edgedata_to_text-pos) ,", UNIX-Timestamp (64Bit): NOT SET");
   }
   else
   {
      pos += (uint32_t)snprintf(&edgedata_to_text[pos], (max_len_edgedata_to_text-pos) ,", UNIX-Timestamp (64Bit): %llu", edge_data->timestamp64);
   }
   return true;
}