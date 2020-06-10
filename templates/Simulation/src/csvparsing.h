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


/***************************************************************************/
/*! \file                      csvparsing.h
    \brief DESCRIPTION:
    \author
****************************************************************************/
#include <iostream>
#include <fstream>
#include <sstream>
#include <cassert>
#include <string>
#include <vector>
#include <map>
#include <regex>
#include <exception>

extern void log(const char* format, ...);
using namespace std;

class csvparsing
{
public:
   csvparsing(const string& filename, char deli = ';', bool strict = true);
   csvparsing(istream& is, char deli = ';', bool strict = true);
   ~csvparsing();

   explicit operator bool() const;
   vector<string> getvec() const;
   csvparsing& operator>> (map<string, string>& row);

private:
   string filename;
   ifstream obj;
   istream& is;
   char deli;
   bool strict;
   size_t line_nom;
   vector<string> vec;

   void read_vec();
   csvparsing(const csvparsing&);
   csvparsing& operator= (const csvparsing&);
};



static bool read_csv_line(istream& is, vector<string>& data, char deli)
{
   data.clear();
   data.push_back(string());
   char c = '\0';
   enum State
   {
      START, QUOTED, QUOTED_ESCAPED, UNQUOTED, UNQUOTED_ESCAPED, END
   };
   State state = START;
   while (is.get(c))
   {
      switch (state)
      {
      case START:
         state = UNQUOTED;
      case UNQUOTED:
         if (c == '"')
         {
            state = QUOTED;
         }
         else if (c == '\\')
         {
            state = UNQUOTED_ESCAPED;
            data.back() += c;
         }
         else if (c == deli)
         {
            data.push_back("");
         }
         else if (c == '\n' || c == '\r')
         {
            state = END;
         }
         else
         {
            data.back() += c;
         }
         break;

      case UNQUOTED_ESCAPED:
         data.back() += c;
         state = UNQUOTED;
         break;

      case QUOTED:
         if (c == '"')
         {
            state = UNQUOTED;
         }
         else if (c == '\\')
         {
            state = QUOTED_ESCAPED;
            data.back() += c;
         }
         else
         {
            data.back() += c;
         }
         break;

      case QUOTED_ESCAPED:
         data.back() += c;
         state = QUOTED;
         break;

      case END:
         if (c != '\n')
         {
            is.unget();
         }

         goto multilevel_break;
         break;

      default:
         assert(0);
         throw state;
      }
   }

multilevel_break:
   if (state != START)
   {
      is.clear();
   }
   return static_cast<bool>(is);
}


csvparsing::csvparsing(const string& filename, char deli, bool strict)
   :filename(filename),is(obj),deli(deli),strict(strict),line_nom(0)
{
   obj.open(filename.c_str());
   if (!obj.is_open())
   {
      string msg = "Error cant read file " + filename;
      log(msg.c_str());
      exit(-1);
   }
   read_vec();
}


csvparsing::csvparsing(istream& is, char deli, bool strict)
   : filename("[no filename]"),
   is(is),
   deli(deli),
   strict(strict),
   line_nom(0)
{
   read_vec();
}


csvparsing::~csvparsing()
{
   if (obj.is_open()) obj.close();
}


csvparsing::operator bool() const
{
   return static_cast<bool>(is);
}


vector<string> csvparsing::getvec() const
{
   return vec;
}


csvparsing& csvparsing::operator>> (map<string, string>& row)
{
   row.clear();
   vector<string> data;
   if (!read_csv_line(is, data, deli)) return *this;
   line_nom += 1;

   if (!strict)
   {
      data.resize(vec.size());
   }
   /* empty line? */
   if (data.size() == 1)
   {
      if (data[0].size() == 0)
      {
         return *this;
      }
   }

   for (size_t i = 0; i < data.size(); ++i)
   {
      row[vec[i]] = data[i];
   }
   return *this;
}

void csvparsing::read_vec()
{
   if (!read_csv_line(is, vec, deli))
   {
      log("Invalid csv format");
      exit(-1);
   }
}
