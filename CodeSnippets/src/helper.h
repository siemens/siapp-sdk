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
#include <string.h>
#include <stdint.h>
#include <cinttypes>

#include <edgedata.h>

#ifdef __cplusplus
extern "C" {
#endif
   
extern bool helper_get_edgedata_text(T_EDGE_DATA *edge_data, char *edgedata_to_text, uint32_t max_len_edgedata_to_text);
extern bool helper_is_equal_value(T_EDGE_DATA *data1, T_EDGE_DATA *data2);

#ifdef __cplusplus
}
#endif