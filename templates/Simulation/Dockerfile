FROM alpine

#ENV HTTP_PROXY "http://A.B.C.D:X"

RUN apk add --no-cache g++

COPY edgedataapi /edgedataapi
COPY src /src

RUN g++ -std=c++11 -Wcpp -Wno-psabi -I /usr/include -I /edgedataapi/include -o /EdgeDataSim.elf /src/EdgeDataSim.cpp /edgedataapi/src/edgedata.cpp

COPY discover.csv /
COPY events.csv /

RUN chmod +x /EdgeDataSim.elf

ENTRYPOINT ["./EdgeDataSim.elf", "discover.csv", "events.csv"]
