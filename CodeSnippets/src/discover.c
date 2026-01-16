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

#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include <unistd.h>
#include <alloca.h>

#include "helper.h"
#include "edgedata.h"

static volatile int s_keepRunning = 1; 

/**
   \brief     signal handler for Linux signals INT, TERM
 */
static void s_signalHandler(int signal) 
{
   s_keepRunning = 0; 
}

/**
   \brief     callback function for edgedata debugging purpose
 */
static void s_edgedata_logger(const char* info)
{
   if (info != NULL)
   {
      printf("Edgedata Logger Info: %s", info);
   }
}

/**
   \brief     Discover SICAM Application accessing the edge data interface.

    Processing steps are:
      - connect to edge data interface
      - discover all availabe signals
      - on regular basis read and write all discovered signals
*/
int main()
{
   signal(SIGINT, s_signalHandler);
   signal(SIGTERM, s_signalHandler);

   printf("Discover - start\n");

   /* register callback for debugging purpose */
   edge_data_register_logger(s_edgedata_logger);

   while (s_keepRunning)
   {
      /* connect to edge data interfae */
      E_EDGE_DATA_RETVAL edge_rc = edge_data_connect ();

      /* connect failed ? */
      if (edge_rc != E_EDGE_DATA_RETVAL_OK)
      {
         printf("Discover - connection establishment failed, rc: %d\n",edge_rc);
         sleep(1);
         continue;
      }
      printf("Discover - connected\n");

      /* get discover information */
      const T_EDGE_DATA_LIST* list = edge_data_discover();
      if (list == NULL)
      {
         printf("Discover - edge_data_discover() failed\n");
         sleep(1);
         continue;
      }
      printf("Discover - Number of discovered elements for read: %d\n", list->read_handle_list_len);
      printf("Discover - Number of discovered elements for write: %d\n", list->write_handle_list_len);

      /* get write data access pointer by write */
      T_EDGE_DATA** p_write_data_list = (T_EDGE_DATA**)malloc(list->write_handle_list_len * sizeof(T_EDGE_DATA*));
      if (p_write_data_list == NULL && list->write_handle_list_len > 0)
      {
         printf("Discover - malloc failed for write list\n");
         edge_data_disconnect();
         sleep(1);
         continue;
      }
      for (uint32_t i = 0; i < list->write_handle_list_len; i++)
      {
         p_write_data_list[i] = edge_data_get_data(list->write_handle_list[i]);
         printf("Discover - discovered topic for write: %s\n", p_write_data_list[i]->topic);
      }
      /* get read data access pointer by read handle */
      T_EDGE_DATA** p_read_data_list = (T_EDGE_DATA**)malloc(list->read_handle_list_len * sizeof(T_EDGE_DATA*));
      if (p_read_data_list == NULL && list->read_handle_list_len > 0)
      {
         printf("Discover - malloc failed for read list\n");
         free(p_write_data_list);
         edge_data_disconnect();
         sleep(1);
         continue;
      }
      for (uint32_t i = 0; i < list->read_handle_list_len; i++)
      {
         p_read_data_list[i] = edge_data_get_data(list->read_handle_list[i]);
         printf("Discover - discovered topic for read: %s\n", p_read_data_list[i]->topic);
      }

      uint32_t dummy_value = 0;
      /* Do until error or shutdown */
      while (s_keepRunning)
      {
         /* sync list of read signal handles */
         edge_rc = edge_data_sync_read(list->read_handle_list, list->read_handle_list_len);
         if (edge_rc != E_EDGE_DATA_RETVAL_OK)
         {
            printf("Discover - sync read failed: %d\n", edge_rc);
            sleep(1);
            break;
         }
         printf("--------------------------\n");
         printf("--Print all read signals--\n");
         
         /* print all readable handles */
         for (uint32_t i = 0; i < list->read_handle_list_len; i++)
         {
            char print_line[300];
            memset(print_line,0,sizeof(print_line));
            helper_get_edgedata_text(p_read_data_list[i], print_line,sizeof(print_line)-1);
            printf("Discover - %s\n", print_line);
         }
         
         printf("---------------------------\n");
         printf("--Print all write signals--\n");
         /* overwrite topics with dummy_value */
         dummy_value++;
         for (uint32_t i = 0; i < list->write_handle_list_len; i++)
         {
            p_write_data_list[i]->value.uint32 = dummy_value;
            p_write_data_list[i]->timestamp64 = 0; /* 0 menas time will be set by backend */
            char print_line[300];
            memset(print_line,0,sizeof(print_line));
            helper_get_edgedata_text(p_write_data_list[i], print_line,sizeof(print_line)-1);
            printf("Discover - %s\n", print_line);
         }

         /* sync list of write signal handles */
         edge_rc = edge_data_sync_write(list->write_handle_list, list->write_handle_list_len);
         if (edge_rc != E_EDGE_DATA_RETVAL_OK)
         {
            printf("Discover - sync write failed: %d\n", edge_rc);
            break;
         }
         sleep(1);
      }
      free(p_read_data_list);
      free(p_write_data_list);
   }

   printf("Discover - terminated via external signal -> exit 0\n");
   edge_data_disconnect();
   fflush(stdout);
   exit(0); 
}
