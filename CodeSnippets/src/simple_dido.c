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

#include <edgedata.h>
#include "helper.h"
 
#define DI_NAME "read01"
#define DO_NAME "write01"

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
   \brief     Simple SICAM Application accessing the edge data interface.

    Processing steps are:
      - connect to edge data interface
      - check, if signals DI_NAME and DO_NAME exists
      - on regular basis read 'test_signal_di' -> write state to 'tests_signal_do'  
*/
int main(int argc, char** argv)
{
   signal(SIGINT, s_signalHandler);
   signal(SIGTERM, s_signalHandler);

   printf("Simple DI DO - start\n");
   
   edge_data_register_logger(s_edgedata_logger);

   while (s_keepRunning)
   {
      /* connect to edge data interfae */
      E_EDGE_DATA_RETVAL edge_rc = edge_data_connect ();

      /* connect failed ? */
      if (edge_rc != E_EDGE_DATA_RETVAL_OK)
      {
         printf("Simple DI DO - connection establishment failed, rc: %d\n",edge_rc);
         sleep(1);
         continue;
      }
      printf("Simple DI DO - connected\n");
      
      /* get di handle */
      T_EDGE_DATA_HANDLE di_handle = edge_data_get_readable_handle(DI_NAME);

      /* get di handle failed ? */
      if (di_handle == 0)
      {
         printf("Simple DI DO - input signal '%s' not found\n", DI_NAME);
         sleep(1);
         continue;
      }

      /* get di data area */
      T_EDGE_DATA *p_di_data = edge_data_get_data(di_handle);

      /* get di data area failed ? */
      if (p_di_data == NULL)
      {
         printf("Simple DI DO - input signal '%s' get data failed\n",DI_NAME);
         sleep(1);
         continue;
      }

      /* add to read sync update handle list */
      T_EDGE_DATA_HANDLE rd_handle_list[1];
      rd_handle_list[0] = di_handle;

      /* get do handle */
      T_EDGE_DATA_HANDLE do_handle = edge_data_get_writeable_handle(DO_NAME);

      /* get do handle failed ? */
      if (do_handle == 0)
      {
         printf("Simple DI DO - output signal '%s' not found\n",DO_NAME);
         sleep(1);
         continue;
      }

      /* get do data area */
      T_EDGE_DATA *p_do_data = edge_data_get_data(do_handle);

      /* get di data area failed ? */
      if (p_do_data == NULL)
      {
         printf("Simple DI DO - oinput signal '%s' get data failed\n",DO_NAME);
         sleep(1);
         continue;
      }

      /* add to write sync update handle list */
      T_EDGE_DATA_HANDLE wr_handle_list[1];
      wr_handle_list[0] = do_handle;

      /* equal data types needed (for simplicity) */
      if (p_do_data->type != p_di_data->type)
         {
         printf("Simple DI DO - input signal '%s' and output signal '%s' using different datatypes\n", DI_NAME, DO_NAME);
         sleep(1);
         continue;
         }

      /* init actual value */
      T_EDGE_DATA_VALUE        act_value;
      memset(&act_value,0,sizeof(act_value));

      /* read di data in loop and update do*/
      while (s_keepRunning)
      {
         /* sync list of read signal handles */
         edge_rc = edge_data_sync_read(rd_handle_list,1);
         if (edge_rc != E_EDGE_DATA_RETVAL_OK)
         {
            printf("Simple DI DO - sync read failed: %d\n",edge_rc);
            sleep(1);
            break;
         }

         /* di value changed ? */
         if (!helper_is_equal_value(p_di_data, p_do_data))
         {
            char print_line_old[300];
            memset(print_line_old,0,sizeof(print_line_old));
            helper_get_edgedata_text(p_di_data, print_line_old,sizeof(print_line_old)-1);
            
            memcpy (&p_do_data->value, &p_di_data->value, sizeof(p_do_data->value));
            p_do_data->quality = p_di_data->quality;

            char print_line_new[300];
            memset(print_line_new,0,sizeof(print_line_new));
            helper_get_edgedata_text(p_do_data, print_line_new,sizeof(print_line_new)-1);

            printf("Simple DI DO - value change detected\n");
            printf("Simple DI DO - Input: %s\n",print_line_old);
            printf("Simple DI DO - Mirrored to output: %s\n",print_line_new);

            /* sync list of write signal handles */
            edge_rc = edge_data_sync_write(wr_handle_list,1);
            if (edge_rc != E_EDGE_DATA_RETVAL_OK)
            {
               printf("Simple DI DO - sync write failed: %d\n",edge_rc);
               sleep(1);
               break;
            }
         }
         /* 10ms wait */
         usleep(10000);
      }
   }

   printf("Simple DI DO - terminated via external signal -> exit 0\n");   
   edge_data_disconnect();
   fflush(stdout);
   exit(0); 
}
