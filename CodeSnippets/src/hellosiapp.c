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

static volatile int keepRunning = 1;
 
/**
   \brief     signal handler for Linux signals INT, TERM
 */
static void s_signalHandler(int signal) 
{   
   keepRunning = 0; 
} 

/**
   \brief     The main function of the SICAM Application

    This simple SICAM Application demonstrates 
    how process a controlled shutdown an external signal.
*/
int main() 
{   
   signal(SIGINT, s_signalHandler); 
   signal(SIGTERM, s_signalHandler); 

   printf("Hello Siapp - started\n");
   
   while(keepRunning) 
   {     
      printf("Hello Siapp - wait for external signal\n");
      sleep(1);
   }
   
   printf("Hello Siapp - terminated via external signal -> exit 1\n");
   fflush(stdout);
   exit (1); 
}
