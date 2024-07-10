# SIAPP SDK README

The [SIAPP SDK](https://github.com/siemens/siapp-sdk) provides tools to build and emulate application containers, called SIAPPs. SIAPPs can run on hardware platforms like the [SICAM A8000](http://www.siemens.com/sicam) series.

## Table of Contents

- [System Requirements](#system-requirements)
- [Basics](#basics)
- [Quickstart](#quickstart)
  - [SIAPP Build](#building-a-siapp)
  - [SIAPP Device Upload](#device-upload)
  - [SIAPP Docker Emulation](#docker-emulation)
- [Constraints](#constraints)
- [Terms and Abbreviations](#terms-and-abbreviations)
- [Licensing](#licensing)
- [Reporting Bugs and Security Issues](#reporting-bugs-and-security-issues)

# System Requirements

The [SIAPP SDK](https://github.com/siemens/siapp-sdk) is a platform software independent development kit and can be used on Windows and Linux.

- Windows Professional 10 (version 1803 or later) or Linux
- An up-to-date version of [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows), [Docker](https://www.docker.com/) (Linux) or [Podman](https://podman.io/) (Windows, Linux)
- For Linux with edgedata simulation you need [QEMU](https://www.qemu.org/) <br>
e.g. for Debian 12.2:<br>
'sudo apt-get install qemu binfmt-support qemu-user-static' (Call once)<br>
'docker run --rm --privileged multiarch/qemu-user-static --reset -p yes' (Call after each restart)
- [Python3](https://www.python.org/)
- Podman must contain docker.io in registries (/etc/containers/registries.conf)
```BASH
unqualified-search-registries = ["docker.io"]
```
- Podman within VM needs KVM support. For Hyper-V following command in admin Powershell will activate it 
```BASH
Set-VMProcessor -VMName <VMName> -ExposeVirtualizationExtensions $true
```
# Basics

- Configure a SIAR on the platform you are working with. For further information, please refer to the device manual.
- Demo SIAPPs are provided within this repository, please take a look at chapter [SIAPP Build](#building-a-siapp).
- Upload the SIAPP into the device. For further information on how to upload, please refer to the device manual. <br>
  Alternatively, an [SIAPP Docker Emulation](#docker-emulation) is provided where the SIAPP can be executed on your local machine using Docker. <br>

# Quickstart

This quick guideline goes into the build process of a SIAPP and its simulation. For limitations and constraints have a look at chapter [Constraints](#constraints).

# Building a SIAPP

A SIAPP can be created by using the python3 script _build.py_. The _PROJECT_PATH_ must contain the container project and a Dockerfile named _Dockerfile_. By default all platform are build.

```BASH
python build.py PROJECT_PATH
```

Help for more information and extra parameter

```BASH
python build.py -h
```

## Example

Three demo projects: **DemoProject**, **DemoSshd** and **CodeSnippets** have been provided within this repository to demonstrate the usage of the SIAPP SDK and the EdgeData API. To get started, follow this step-by-step tutorial:

Open a terminal window within your desired working directory and use `git clone` to download this repository. To generate the **DemoProject** run `build.py`.

```BASH
cd <YOUR_WORKING_DIRECTORY>
git clone https://github.com/siemens/siapp-sdk.git
python siapp-sdk/build.py DemoProject
```

The **DemoProject** SIAPP will now be generated. This may take a few minutes. It contains a basic web server to provide access to a set of configured example signals to the SIAPP.

The other examples **DemoSshd** and **CodeSnippets** include an SSH daemon. No password or key is required. This SIAPP is for testing purposes only and should not be used in a production manner. The **CodeSnippets** SIAPP additionally contains examples on how to use the Edgedata API. The **DemoSshd** SIAPP can be generated by executing:

```BASH
python siapp-sdk/build.py DemoSshd
```

After the build was successful, the SIAPP can be found in the `./siapp-sdk/build` directory. To start the SIAPP, you have two options:
* [Upload](#device-upload) the SIAPP into a target (CP-8031 or CP-8050)
* [Emulate](#docker-emulation) the SIAPP on your local machine using Docker.

# Device Upload

**CP-8031/CP-8050**

The minimum recommended SIAPP slot size, which can be found in the output of the build, should be considered in the SICAM Device Manager configuration. You can upload the SIAPP either by using the SICAM Device Manager or the SICAM Web. For a more detailed description, please refer to the SICAM Device Manager manual. After configuring the siapp runtime in general a port must be provided. So in SICAM Devicemanager open SIAPP -> SIAPP Runtimes -> SIAPP Runtime X (SIAR X). Add a port with a port group different to SICAM Web and a valid IP address.

- The `DemoProject` starts a webserver which is accessible on the containers http port. It provides access to all configured signals to the SIAPP.
- The `DemoSshd` Project includes a SSH daemon without password or key and is for testing purposes only and should not be used for production.
- The `CodeSnippets` Project includes a SSH daemon without password or key and is for testing purposes only and should not be used for production. It additionally contains small examples on how to use the Edgedata API.

# Docker Emulation

Once a SIAPP has been created, it's possible to emulate the SIAPP's behavior on your local machine using Docker and furthermore it's interaction with a **Edgedata API** simulation container.

To start the emulation you have to provide a `discover.csv` and a `events.csv` in your project directory. If no csv files are provided, default files will be used.
The `discover.csv` contains all topics the API should provide and defines whether it is a read or write topic. The `events.csv` specifies the values and quality bits. The `wait_ms` column defines the delta time between the occurrences of topics. You can create recurring topics by setting `GOTO x` at the end of the CSV, where `x` stands for the line number the simulation should continue with.

discover.csv example:

```XML
topic;type;source
read01;UINT32;READ
read02;UINT32;READ
read03;UINT32;READ
read04;UINT32;READ
write01;UINT32;WRITE
```

events.csv example:

```XML
topic;quality;value;wait_ms
read01;NT|T|SB;10;2000
write01;NT|T|SB;10;100
read01;NT|T|SB;10;2000
write01;NT|T|SB;10;100
read01;IV|NT|T;11;2000
write01;IV|NT|T;11;100
read01;T|SB;10;2000
write01;T|SB;10;100
read01;;10;2000
write01;;10;100
GOTO 2;;;
```

A simulation can be started with the following command:

```BASH
python run.py PROJECT_PATH -p PLATFORM
```

Run help for more information

```BASH
python run.py -h
```

## Example

The emulation of the `DemoProject` web server can be reached via [http://127.0.0.1:MAPPED_PORT](http://127.0.0.1:32778). The `MAPPED_PORT` is printed out after the start of the emulation. If you use **Docker Desktop** click on the button **OPEN IN BROWSER** next to the docker **sim** container.

```BASH
python siapp-sdk/run.py DemoProject -p a8000
```

# Constraints

**Structure of a SIAPP Project**

A project consists of a **Dockerfile** which defines the SIAPP image and optionally a `config.json` which defines the container settings and limits.
If no `config.json` is provided, a default `config.json` will be used.
Note that the `build.py` script overwrites certain settings in the `config.json` if Docker is used:

- `ENTRYPOINT` or `CMD` in the Dockerfile will overwrite `args` in the `config.json`.
- `WORKDIR` will overwrite `cwd`.

**Dockerfile constraints**

The SICAM CP-8031/CP-8050 runs an `armhf` (_ARM hard float_) architecture. Therefore the dockerfile must be based on the same architecture.<br>
If you want to use a pre-existing image from Docker hub, make sure it is compiled against `armhf` architecture. For example: `FROM` [arm32v7/alpine](https://hub.docker.com/r/arm32v7/alpine/) can be used to build your SIAPP.<br>
Also remove unnecessary and unused tools, packages or data from your container image during build process to reduce installation time and to keep the image lean. You may also consider using [multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build/).


With [Version 2.0.0](/CHANGELOG.md#siapp-sdk-200) building and running multiple platforms are supported. Selecting the image is done via parameter now. If the implementation has still architecture differences, consider using build args in the Dockerfile for separate commands for better maintainability. 

# Terms and Abbreviations

**SIAPP**

SIAPPs (_SICAM Applications_) can be used to run your own programs or pre-existing images from the [Docker Hub](https://hub.docker.com/) on supported hardware. It is possible to access I/O signals, Ethernet interfaces and tested communication protocols in addition to the existing system features.

Some possible use cases:

- **_Web-based HMI APP_** - Run your own web server on CP-8050 fed with RTU data
- **_Analytics APP_** - Run your own data analytics algorithm and provide data via existing IEC or cloud protocols
- **_Controller APP_** - Port and run your existing C-code on performant CP-8050 hardware
- **_Server APP_** - Run your server beside existing RTU functionality within a secure environment – LDAP, Radius, SYSLOG, FTP, ...
- **_Customer specific APP_** - Create and run user-defined communication protocols or data point conversions

The SICAM A8000 platform currently supports multiple SIAPPs. Those SIAPPs are deployed into SIAPP Slots which are assigned to one of the SIARs (SICAM Application Runtimes). All that can be configured with the SICAM Device Manager, the engineering software for the SICAM A8000 series.

**SIAPP SDK**

The SIAPP SDK (_SICAM Application Software Development Kit_) is the toolchain to build and emulate SIAPPs.

**SIAR**

The SIAR (_SICAM Application Runtime_) defines the available Ethernet interfaces as well as it limits RAM or CPU usage and other runtime settings of the assigned SIAPPs. It is also possible to create virtual Ethernet interfaces to enable communication between SIARs or between SIARs and platform specific Web services (e.g. SICAM Web).

**SIAPP slot**

A SIAPP slot defines, amongst other things, the maximum Flash memory that is available for the SIAPP and provides the Edgedata API. A SIAPP can be uploaded into the SIAPP slot. <br>
For further information and SIAPP deployment on the SICAM A8000 platform, please refer to the SICAM Device Manager manual.

**Edgedata API**

Via the Edgedata API you can access the topics which are assigned to the SIAPP slot in the SICAM Device Manager. Just add the [EdgeDataApi folder](./edgedataapi) to your project and access the API as described in the [EdgeDataApi](./EDGEDATAAPI.md) usage information.

**Persistence**

There is a persistent directory `/persist_data` that will not be erased during a SIAPP update. <br>
Note that on the SICAM A8000 platform the persistent directory will be erased, if you change the SIAPP slot's size or if you delete the SIAPP slot and recreate it in the SICAM Device Manager.

# Licensing

[SIAPP SDK](https://github.com/siemens/siapp-sdk) is primarily licensed under the terms of the MIT license.

Each of its source code files contains a license declaration in its header. Whenever a file is provided under an additional or different license than MIT, this is stated in the file header.

# Reporting Bugs and Security Issues

Before opening an issue, check if the following conditions are met:

- The issue is related to siapp-sdk.
- There is no similar issue.

To make the investigation as simple as possible, please include the siapp-sdk version in your ticket. <br>
If possible, add debug information and callstacks.
