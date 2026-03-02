FROM alpine

# ENV HTTP_PROXY "http://A.B.C.D:X"
EXPOSE 22

# !!! SET YOUR SSH PASSWORD HERE !!! (replace CHANGE_ME with your password)
ARG SSH_PASSWORD=CHANGE_ME

RUN apk add --no-cache libstdc++ libgcc g++ python3

RUN apk add openrc
RUN sed -i '/getty/d' /etc/inittab

# set sshlogin to Port 22 with password authentication
RUN apk add --no-cache openssh \
	&& sed -i 's/#Port.*/Port 22/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config \
	&&  sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config \
	&&  /usr/bin/ssh-keygen -A \
	&&  rc-update add sshd

# Fail build if password was not changed from default
RUN test "$SSH_PASSWORD" != "CHANGE_ME" \
	|| { printf '\n\n  *** ERROR: Set your SSH password in the Dockerfile! ***\n\n'; false; } \
	&& echo "root:$SSH_PASSWORD" | chpasswd 

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