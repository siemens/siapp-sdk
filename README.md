SIAPP SDK README
===============

The SIAPP SDK provides tools to build and emulate appilcation containers so-called SIAPPs. These SIAPPs can run on hardware platforms like the SICAM A8000 series. For further information on the SICAM A8000 series please visit: http://www.siemens.com/sicam

Table of Contents
----------------
 - [System Requirements](#System-Requirements)
 - [Quickstart](#Quickstart)
 - [SIAPP Terms](#SIAPP-Terms)
 - [Building a SIAPP](#Building-a-SIAPP)
 - [SIAPP Emulator](#SIAPP-Emulator)
 - [Reporting Bugs and Security Issues](#Reporting-Bugs-and-Security-Issues)


System Requirements
===============

- Windows Professional 10 (version 1803 or later)
- an up-to-date version of Docker Desktop (https://www.docker.com/products/docker-desktop)


Quickstart
===============

- Configure an application runtime (SIAR) on the platform you are working with. For further information please refer to the device manual.
- Build the SIAPP (see Building a SIAPP below). E.g. a demo SIAPP provided within this repository.
- Upload the SIAPP to the device. For further information on how to upload please refer to the device manual.
- That's it! 


SIAPP Terms
===============

**SIAPP**

SIAPPs can be used to run your own programs or pre-existing images from Docker hub on supported hardware. It is possible to access I/O signals, Ethernet interfaces and tested communication protocols in addition to the existing system features.

Some possible use cases:
- Web-based HMI APP - Run your own Webserver on CP-8050 fed with RTU data
- Analytics APP - Run your own data analytics algorithm and provide data via existing IEC or cloud protocols
- Controller APP - Port and run your existing C-code on performant CP-8050 hardware
- Server APP - Run your server beside existing RTU functionality within an secure environment – LDAP, Radius, Syslog, FTP, ...
- Customer specific APP - Create and run user-defined communication protocols or datapoint conversions

The SICAM A8000 platform currently supports up to 3 SIAPPs per CP-8050. Those SIAPPs are deployed into SIAPP Slots which are assigned to one of up to 3 SICAM Application runtimes (SIARs). All that can be configured with the SICAM Device Manager, the engineering software for the SICAM A8000 series. 

**SIAPP SDK**

The SIAPP SDK is the toolchain to build and emulate SIAPPs.

**SIAR**

The SIAR (application runtime) defines the available Ethernet interfaces as well as it limits RAM or CPU usage and other runtime settings of the assigned SIAPPs. It is also possible to create virtual Ethernet interfaces to enable communication between SIARs or between SIARs and platform specific Web services (e.g. SICAM Web).

**SIAPP slot**

A SIAPP slot defines, amongst other things, the maximum Flash memory that is available for the SIAPP and provides the Edgedata API. A SIAPP can be uploaded into the SIAPP slot. <br>
For further information and SIAPP deployment on the SICAM A8000 platform, please refer to the SICAM Device Manager manual.

**Edgedata API**

Via the Edgedata API you can access the topics which are assigned to the SIAPP slot in the SICAM Device Manager. Just add the [EdgeDataApi folder](./edgedataapi) to your project and access the API as described in the [EdgeDataApi](./EDGEDATAAPI.md) usage information.

**Persistence**

There is a persistent directory `/persist_data` that will not be erased during a SIAPP update. <br>
Note that on the SICAM A8000 platform the persistent directory will be erased, if you change the SIAPP slot's size or if you delete the SIAPP slot and recreate it in the SICAM Device Manager.

Building a SIAPP
===============

The following steps are needed to build a SIAPP.
Download this repository and unpack it.
Open your Windows PowerShell and navigate into the repository, then run the following command:

`.\build.bat project_path [-name NAME] [-version VERSION]`

Two demo projects (`DemoProject` and `DemoSshd`) have been provided within this repository to demonstrate the usage of the SIAPP SDK and the EdgeDataApi.

`DemoProject` starts a websever on port 8080 which provides access to all configured signals to the SIAPP.

`.\build.bat DemoProject`

The `DemoSshd` Project includes a sshd demon without password or key and is for testing purposes only and should not be used for production.

`.\build.bat DemoSshd`

SIAPPs are generated into the build directory and the minimum recommended SIAPP slot size which should be configured in the SICAM Device Manager, will be displayed.

**Structure of a SIAPP Project**

A project consists of a Dockerfile which defines the SIAPP image and optionally a `config.json` which defines the container settings and limits.
If no `config.json` is provided, a default `config.json` will be used. 
Note that the `build.bat` script overwrites certain settings in the `config.json` for by using the content of the Dockerfile:
- `ENTRYPOINT` or `CMD` in the Dockerfile will overwrite `args` in the `config.json`.
- `WORKDIR` will overwrite `cwd`.

**Dockerfile constraints**

The SICAM CP-8050 runs an `armhf` architecuture. Therefore the dockerfile must based on the same architecuture.<br>
If you want to use a pre-existing image from Docker hub, make sure it is compiled against `armhf` architecture. (e.g. use `FROM arm32v7/alpine`)<br>
Also remove unnecessary and unused tools, packages or data from your container image during build process to reduce installation time.

SIAPP Emulator
===============

It is also possible to emulate the SIAPP's behaviour itself locally on your Windows machine and furthermore it's interaction with the Edgedata API. 

To start the emulation you have to provide a discover.csv and a events.csv in your project directory. If no csv files are provided, default csv files will be generated. 
The `discover.csv` contains all topics the API should provide and defines whether it is a read or write topic.
The `events.csv` specifies the values and quality bits. The `wait_ms` column defines the delta time between the occurrences of topics. You can create recurring topics by setting `GOTO x` at the end of the CSV, where x stands for the line number the simulation should continue with.
The simulation can be started with the following command:

`.\run.bat project_path [-name NAME] [-version VERSION]`

e.g. `.\run.bat DemoProject`
<br>
The emulation of the `DemoProject` webserver can be reached via http://127.0.0.1:MAPPED_PORT. The MAPPED_PORT is printed out after the start of the emulation.
```
...
8080/tcp -> 0.0.0.0:32778
run.bat - Successfully simulated \demoproject-0.0.1.siapp
```

Licensing
===============
SIAPP-SDK is primarily licensed under the terms of the MIT license.

Each of its source code files contains a license declaration in its header. Whenever a file is provided under an additional or different license than MIT, this is stated in the file header.

Reporting Bugs and Security Issues
===============
Before opening an issue, check if the following conditions are met:

- The issue is related to siapp-sdk.
- There is no similar issue

To make the investigation as simple as possible, please include the siapp-sdk version in your ticket.

If possible, add debug information and callstacks.