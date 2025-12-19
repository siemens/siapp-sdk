SIAPP SDK CHANGES
===============

This is a summary of the most important changes of SIAPP SDK.

SIAPP SDK Releases
----------------
 - [SIAPP SDK 2.1.6](#siapp-sdk-216)
 - [SIAPP SDK 2.1.5](#siapp-sdk-215)
 - [SIAPP SDK 2.1.4](#siapp-sdk-214)
 - [SIAPP SDK 2.1.3](#siapp-sdk-213)
 - [SIAPP SDK 2.1.2](#siapp-sdk-212)
 - [SIAPP SDK 2.1.1](#siapp-sdk-211)
 - [SIAPP SDK 2.1.0](#siapp-sdk-210)
 - [SIAPP SDK 2.0.0](#siapp-sdk-200)
 - [SIAPP SDK 1.2.8](#siapp-sdk-128)
 - [SIAPP SDK 1.2.7](#siapp-sdk-127)
 - [SIAPP SDK 1.2.6](#siapp-sdk-126)
 - [SIAPP SDK 1.2.5](#siapp-sdk-125)
 - [SIAPP SDK 1.2.4](#siapp-sdk-124)
 - [SIAPP SDK 1.2.3](#siapp-sdk-123)
 - [SIAPP SDK 1.2.2](#siapp-sdk-122)
 - [SIAPP SDK 1.2.1](#siapp-sdk-121)
 - [SIAPP SDK 1.2.0](#siapp-sdk-120) [os independent python scripts]
 - [SIAPP SDK 1.1.2](#siapp-sdk-112) 
 - [SIAPP SDK 1.1.1](#siapp-sdk-111) 
 - [SIAPP SDK 1.1.0](#siapp-sdk-110) [first public released version on github]
 - [SIAPP SDK 1.0.0](#siapp-sdk-100) [not official released]


-----------

## SIAPP SDK 2.1.6

### Bug Fixes
* Fixed segmentation fault in SIAPP SDK simulation component (Special thanks to Laurin)
* Enhanced connection stability in Edge Data API: automatic retry mechanism with 10-second wait interval when peer is not ready during fast reconnect scenarios

-----------

## SIAPP SDK 2.1.5

### Improvements
* Allow access to writeable signals via `Read()` helper in edgedataapi.py (Special thanks again to pgabert71)

-----------

## SIAPP SDK 2.1.4

### Bug Fixes
* Clean current sync write handle list after sync edgedataapi.py (Special thanks again to pgabert71)

-----------

## SIAPP SDK 2.1.3

### Bug Fixes
* Incorrect error handling in edgedataapi.py (Special thanks to pgabert71)

-----------

## SIAPP SDK 2.1.2

### Bug Fixes
* Remove unused variable in edgedataapi.py (Special thanks to kfetzer-siemens)

-----------

## SIAPP SDK 2.1.1

### Features
* Fix some compile warnings (also in EDGEDATAAPI)
* Support latest alpine image with openrc

-----------

## SIAPP SDK 2.1.0

### Features
* Python Interface for EDGEDATAAPI (new example application DemoPy)

-----------

## SIAPP SDK 2.0.0

### Features
* New Command Line Interface
* Add support for Podman
* Add support for SICAM Software Solution (SWS)
### Bug Fixes
* Prevent endless loop in DemoProject

### Notes
* Since more platforms are supported _Dockerfile.arm32v7_ is now only _Dockerfile_
* Running the emulation requires now the platform (in this release either a8000 or sws)
* For new interface options call `python build.py -h` or `python run.py -h`

-----------

## SIAPP SDK 1.2.8

**Improvements**
*  Add platform option to build command of build.py (Special thanks to stejspet)

-----------

## SIAPP SDK 1.2.7

**Improvements**
*  Bugfix for JSON Decoding  (Special thanks to lucasschramm1)

-----------

## SIAPP SDK 1.2.6

**Improvements**
*  Bugfix for EdgeDataApi simulation for Linux hosts
*  Remove SIAPP Dashboard

-----------

## SIAPP SDK 1.2.5

**Improvements**
*  Fix Mutex deadlock in DemoProject code during simultaneous data access
*  Add executable flag to SIAPP examples

-----------

## SIAPP SDK 1.2.4

**Improvements**
*  Support absolute and relative path for build.py and run.py tools (Special thanks to claus-kutsche)
*  SIAPP Dashboard update

-----------

## SIAPP SDK 1.2.3

**Improvements**
*  SIAPP Dashboard added

-----------

## SIAPP SDK 1.2.2

**Improvements**
*  Support different formats of container entrypoints in a dockerfile (ENTRYPOINT, CMD)
*  Recommended slot size corrected

-----------

## SIAPP SDK 1.2.1

**Improvements**
*  Bugfix SIAPP can be imported again in SICAM Devicemanager

-----------

## SIAPP SDK 1.2.0

**Improvements**
*  OS independent python scripts
*  SIAPP engineering over SICAM Device Manager via configuration files
*  build.bat and run.bat files removed

-----------

## SIAPP SDK 1.1.2

**Improvements**
*  Fix memory leak

-----------

## SIAPP SDK 1.1.1

**Improvements**
*  Data simulation backend supports topic names up to 128 characters

*  Increase stability of DemoProject

*  Data emulation crash fixed

-----------

## SIAPP SDK 1.1.0

**Improvements**
*  Update MIT license
*  Remove qemu-arm-static<br>
   *Qemu is now part of docker.*

*  Support spaces in file path

*  Display exposed ports for emulation

-----------

## SIAPP SDK 1.0.0

**New Features**
*  Support of SIAPPs for SICAM A8000 CP-8050

*  EdgeDataApi simulation added

*  Add demoprojects to SIAPP SDK