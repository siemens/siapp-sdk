FROM alpine

# ENV HTTP_PROXY "http://A.B.C.D:X"
EXPOSE 22

RUN apk add --no-cache libstdc++ libgcc g++ python3

RUN apk add openrc
RUN sed -i '/getty/d' /etc/inittab

# set sshlogin to Port 22 with no password
RUN apk add --no-cache openssh \
	&& sed -i 's/#Port.*/Port 22/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PermitEmptyPasswords.*/PermitEmptyPasswords yes/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config \
	&&  /usr/bin/ssh-keygen -A \
	&&  passwd -d root \
	&&  rc-update add sshd 

COPY src /src
COPY edgedataapi /edgedataapi

RUN g++ -std=c++11 -shared -Wcpp -Wno-psabi -I /edgedataapi/include -o /edgedata.so -fPIC /edgedataapi/src/edgedata.cpp

# enable for a smaller release without compiler
RUN apk del g++

COPY src/edgedataapi.py /edgedataapi.py
COPY src/run.py /run.py

RUN chmod +x /run.py /edgedataapi.py

WORKDIR /

# conntect via ssh and run the run.py
ENTRYPOINT ["/sbin/init"]