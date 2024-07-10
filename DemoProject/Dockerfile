FROM alpine

#ENV HTTP_PROXY "http://A.B.C.D:X"
EXPOSE 80

RUN apk add --no-cache g++ lighttpd fcgi-dev fcgi++

COPY src /src
COPY app /app
COPY edgedataapi /edgedataapi

RUN g++ -std=c++11 -Wcpp -Wno-psabi -I /usr/include -I /edgedataapi/include -o /demo /src/demo.cpp /edgedataapi/src/edgedata.cpp /usr/lib/libfcgi.so

#enable for a smaller release without compiler
RUN apk del g++

RUN chmod +x /app/startup.sh /demo

ENTRYPOINT ["/app/startup.sh"]