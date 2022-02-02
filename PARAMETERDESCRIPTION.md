SIAPP Parameter Description
===============

If a parameter schema file exist, it must be named "parameter_schema.json" inside the "cmd" directory of your SIAPP.
Language files have to be named "specific.po" in different directories like cmd/i18n/en or cmd/i18n/de.  
Example for the language file:


```
msgid  "Parameter 1"
msgstr "Parameter 1 deutsch"
```



Schema File
----------------

Example for a schema file:

```
{
  "apptype": "siapp",
  "definition": [
    {
      "group": "MyGroup1",
      "parameters": [
        {
          "description": "Short description of this parameter",
          "key": "KEY_1",
          "displayName": "Parameter 1",
          "string": {
            "minLength": 1,
            "maxLength": 9,
            "regex": "^[a-zA-Z0-9 _-]+$",
            "hint": "Only 1-9 characters ranging from 0-9, a-z, A-Z, underscore, dash, and blank are allowed.",
            "default": "default"
          }
        },
        {
          "key": "KEY_2",
          "displayName": "Parameter 2",
          "choice": 
            {
              "default": "1",
              "list": [
                {
                  "displayName": "On",
                  "value": "1"
                },
                {
                  "displayName": "Off",
                  "value": "0"
                }
              ]
            }
          },
          {
            "key": "KEY_3",
            "displayName": "Parameter 3",
            "integer": {
              "min": 1,
              "max": 255,
              "hint": "Allowed Range is 1-255 ", 
              "default": 255
             }
          },
          {
            "key": "KEY_4",
            "displayName": "Parameter 4",
            "real": {
              "default": 2.45,
              "precision": 2,
              "min": 0,
              "max": 123.5,
              "hint": "Allowed Range is 0 - 123.5 with 2 digits precision"
            }
          }
        ]
      },
      {
        "group": "MyGroup2",
        "parameters": [
          {
            "key": "KEY_5",
            "displayName": "Parameter 5",
            "string": {
              "minLength": 1,
              "maxLength": 9,
              "regex": "^[a-zA-Z0-9 _-]+$",
              "hint": "Only 1-9 characters ranging from 0-9, a-z, A-Z, underscore, dash, and blank are allowed.",
               "default": "default"
            }
          },
          {
            "key": "KEY_BLOB",
            "displayName": "Parameter 6",
            "blob": {
              "maxLength": 512,
              "fileFilter" : ["txt", "bin"]
            }
          }
        ]
      }
    ]
}
```

Schema File Description
----------------

```
- apptype (optional)
  ==================
Describes the application type
Default = „siapp“
If the apptype is used, only “siapp” is currently possible.

- group (optional)
  ================
Allows the user to group his parameter on the gui
Maximum length: 50

- parameters (mandatory)
  ======================
A list of parameter
Allowed entries:
•	string
•	choice
•	integer
•	real
•	blob

- key (mandatory)
  ===============
Identifies the parameter on the device and must be unique
Maximum length: 50
Allowed characters: A-Z, a-z, 0-9, _

- displayName (mandatory)
  =======================
Corresponds to the name displayed on the device manager and must be unique
Maximum length: 50

- description (optional)
  ======================
Description of the parameter

- string (optional)
  =================
The value of the key
Optional attributes:
•	default: 	default value
•	minLength:	minimum length of the string
•	maxLength:	maximum length of the string
•	regex:		regular expression
•	hint:		help text in the device manager, maximum length: 1024

- choice (optional)
  =================
A list for the selection of values
Mandatory attributes:
•	default:	default value, must match a value in the list
•	list:           list of values
•	displayName:	corresponds to the name displayed on the device manager
•	value:		value of the choice

- integer (optional)
  ==================
The value of the key
Optional attributes:
•	min:		minimum value
•	max:		maximum value
•	hint:		help text in the device manager, maximum length: 1024
•	default:	default value

- real (optional)
  ===============
Value of the key (decimal point)
Optional attributes:
•	min:		minimum value
•	max:		maximum value
•	precision: accuracy
•	hint:		help text in the device manager, maximum length: 1024
•	default:	default value

- blob (optional)
  ===============
Value of the key 
Optional attributes:
•	maxLength:	maximum file size for import (limited by 10240 bytes base64 coded)
•	fileFilter:	shown files for import, file extension
		        For example: [“txt”] or [“bin”, “png”] or [“*”], …

```
