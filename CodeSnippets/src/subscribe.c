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

#include "helper.h"
#include "edgedata.h"

#define  SUBSCRIBE_NAME "read01"

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
   \brief     subscribe callback function for change events
 */
static void s_subscribe_event_cb(T_EDGE_DATA* event)
{
   char print_line[300];
   memset(print_line,0,sizeof(print_line));
   helper_get_edgedata_text(event, print_line,sizeof(print_line)-1);
   printf("Subscribe - Event Callback triggered %s\n", print_line);
}

/**
   \brief     Subscribe SICAM Application accessing the edge data interface.

    Processing steps are:
      - connect to edge data interface
      - check, if signals SUBSCRIBE_NAME exists
      - subscribe signal for changes
      - wait for changes
*/
int main()
{
   signal(SIGINT, s_signalHandler);
   signal(SIGTERM, s_signalHandler);

   printf("Subscribe - start\n");

   edge_data_register_logger(s_edgedata_logger);

   while (s_keepRunning)
   {
      /* connect to edge data interfae */
      E_EDGE_DATA_RETVAL edge_rc = edge_data_connect ();

      /* connect failed ? */
      if (edge_rc != E_EDGE_DATA_RETVAL_OK)
      {
         printf("Subscribe - connection establishment failed, rc: %d\n",edge_rc);
         sleep(1);
         continue;
      }
      printf("Subscribe - connected\n");

      /* get di handle */
      T_EDGE_DATA_HANDLE read_handle = edge_data_get_readable_handle(SUBSCRIBE_NAME);

      if (read_handle == 0)
      {
         printf("Subscribe - input signal '%s' not found\n", SUBSCRIBE_NAME);
         sleep(1);
         continue;
      }

      /* get di data area */
      T_EDGE_DATA* p_read_data = edge_data_get_data(read_handle);

      /* get di data area failed ? */
      if (p_read_data == NULL)
      {
         printf("Subscribe - input signal '%s' get data failed\n", SUBSCRIBE_NAME);
         sleep(1);
         continue;
      }
      
      /* subscribe for change event */
      if (edge_data_subscribe_event(read_handle, s_subscribe_event_cb) != E_EDGE_DATA_RETVAL_OK)
      {
         printf("Subscribe - Error subscribe for input signal '%s'\n", SUBSCRIBE_NAME);
      }

      while (s_keepRunning)
      {
         /* sync read only used here to detect broken connection to backend */
         edge_rc = edge_data_sync_read(&read_handle,1);
         if (edge_rc != E_EDGE_DATA_RETVAL_OK)
         {
            printf("Subscribe - sync read failed: %d\n",edge_rc);
            sleep(1);
            break;
         }
         printf("Subscribe - Wait for Events\n");
         sleep(1);
      }
   }

   printf("Subscribe - terminated via external signal -> exit 0\n");
   edge_data_disconnect();
   fflush(stdout);
   exit(0); 
}
